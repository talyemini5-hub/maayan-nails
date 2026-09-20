-- 0004: reschedule / cancel / status-change RPCs
-- All mutation paths funnel through these functions so the overlap constraint
-- and business rules (2h customer cutoff, 4h short-notice approval, etc.)
-- are enforced in exactly one place, server-side.

set search_path = public;

-- ------------------------------------------------------------------
-- Customer self-service cancel. Enforced cutoff: business_settings.reschedule_cutoff_hours
-- ------------------------------------------------------------------
create or replace function public.customer_cancel_appointment(
  p_appointment_id uuid,
  p_customer_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_cutoff_hours numeric;
begin
  select * into v_appt from public.appointments
  where id = p_appointment_id and customer_id = p_customer_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_appt.appointment_status in ('cancelled','completed','declined','no_show') then
    raise exception 'APPOINTMENT_NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  select coalesce((value->>'reschedule_cutoff_hours')::numeric, 2) into v_cutoff_hours
  from public.business_settings where key = 'policies';

  if extract(epoch from (v_appt.start_at - now())) / 3600.0 < v_cutoff_hours then
    raise exception 'CUTOFF_PASSED' using errcode = 'P0003';
  end if;

  update public.appointments
  set appointment_status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = (select profile_id from public.customers where id = p_customer_id),
      cancel_reason = 'cancelled_by_customer',
      updated_at = now()
  where id = p_appointment_id
  returning * into v_appt;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values ((select profile_id from public.customers where id = p_customer_id), 'appointment_cancelled_self', 'appointment', p_appointment_id);

  return v_appt;
end;
$$;

-- ------------------------------------------------------------------
-- Customer self-service reschedule (same cutoff rule). Relies on the same
-- exclusion constraint for concurrency-safety.
-- ------------------------------------------------------------------
create or replace function public.customer_reschedule_appointment(
  p_appointment_id uuid,
  p_customer_id uuid,
  p_new_start_at timestamptz
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_cutoff_hours numeric;
  v_service public.services%rowtype;
begin
  select * into v_appt from public.appointments
  where id = p_appointment_id and customer_id = p_customer_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_appt.appointment_status in ('cancelled','completed','declined','no_show') then
    raise exception 'APPOINTMENT_NOT_EDITABLE' using errcode = 'P0001';
  end if;

  select coalesce((value->>'reschedule_cutoff_hours')::numeric, 2) into v_cutoff_hours
  from public.business_settings where key = 'policies';

  if extract(epoch from (v_appt.start_at - now())) / 3600.0 < v_cutoff_hours then
    raise exception 'CUTOFF_PASSED' using errcode = 'P0003';
  end if;

  select * into v_service from public.services where id = v_appt.service_id;

  update public.appointments
  set start_at = p_new_start_at,
      end_at = p_new_start_at + make_interval(mins => v_appt.duration_minutes),
      updated_at = now()
  where id = p_appointment_id
  returning * into v_appt;
  -- overlap constraint protects us here too

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values ((select profile_id from public.customers where id = p_customer_id), 'appointment_rescheduled_self', 'appointment', p_appointment_id);

  return v_appt;
end;
$$;

-- ------------------------------------------------------------------
-- Admin: full status/timing control (create manual, edit, move, approve,
-- decline, cancel, arrived/in_progress/completed/no_show).
-- Authorization (role = admin) is enforced by RLS on the SECURITY DEFINER
-- function's caller check below, mirroring the app_role check.
-- ------------------------------------------------------------------
create or replace function public.assert_admin()
returns void
language plpgsql
stable
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_upsert_appointment(
  p_appointment_id uuid,           -- null = create new
  p_customer_id uuid,
  p_service_id uuid,
  p_addon_ids uuid[],
  p_start_at timestamptz,
  p_notes text,
  p_status appointment_status default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_addon public.services%rowtype;
  v_price numeric(10,2);
  v_end_at timestamptz;
  v_appt public.appointments%rowtype;
  v_addon_id uuid;
begin
  perform public.assert_admin();

  select * into v_service from public.services where id = p_service_id;
  if not found then
    raise exception 'SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_service.duration_minutes is null then
    raise exception 'SERVICE_HAS_NO_DURATION' using errcode = 'P0001';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_price := v_service.price;
  if p_addon_ids is not null then
    foreach v_addon_id in array p_addon_ids loop
      select * into v_addon from public.services where id = v_addon_id;
      v_price := v_price + coalesce(v_addon.price, 0);
    end loop;
  end if;

  if p_appointment_id is null then
    insert into public.appointments (
      customer_id, service_id, start_at, end_at, duration_minutes, prep_buffer_minutes,
      price, final_price, appointment_status, approval_status, notes, created_by
    ) values (
      p_customer_id, p_service_id, p_start_at, v_end_at, v_service.duration_minutes, v_service.prep_buffer_minutes,
      v_price, v_price, coalesce(p_status, 'scheduled'), 'not_required', p_notes, auth.uid()
    ) returning * into v_appt;

    if p_addon_ids is not null then
      foreach v_addon_id in array p_addon_ids loop
        select * into v_addon from public.services where id = v_addon_id;
        insert into public.appointment_addons (appointment_id, addon_id, name_snapshot, price)
        values (v_appt.id, v_addon_id, v_addon.name, v_addon.price);
      end loop;
    end if;
  else
    update public.appointments
    set customer_id = p_customer_id,
        service_id = p_service_id,
        start_at = p_start_at,
        end_at = v_end_at,
        duration_minutes = v_service.duration_minutes,
        price = v_price,
        final_price = v_price,
        notes = p_notes,
        appointment_status = coalesce(p_status, appointment_status),
        updated_at = now()
    where id = p_appointment_id
    returning * into v_appt;

    delete from public.appointment_addons where appointment_id = p_appointment_id;
    if p_addon_ids is not null then
      foreach v_addon_id in array p_addon_ids loop
        select * into v_addon from public.services where id = v_addon_id;
        insert into public.appointment_addons (appointment_id, addon_id, name_snapshot, price)
        values (p_appointment_id, v_addon_id, v_addon.name, v_addon.price);
      end loop;
    end if;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), case when p_appointment_id is null then 'appointment_created_admin' else 'appointment_updated_admin' end,
          'appointment', v_appt.id, jsonb_build_object('status', v_appt.appointment_status));

  return v_appt;
end;
$$;

create or replace function public.admin_set_appointment_status(
  p_appointment_id uuid,
  p_status appointment_status,
  p_reason text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
begin
  perform public.assert_admin();

  update public.appointments
  set appointment_status = p_status,
      approval_status = case
        when p_status = 'confirmed' then 'approved'
        when p_status = 'declined' then 'declined'
        else approval_status
      end,
      cancel_reason = case when p_status in ('cancelled','declined') then p_reason else cancel_reason end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      cancelled_by = case when p_status = 'cancelled' then auth.uid() else cancelled_by end,
      hold_expires_at = case when p_status in ('confirmed','scheduled') then null else hold_expires_at end,
      updated_at = now()
  where id = p_appointment_id
  returning * into v_appt;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'appointment_status_changed', 'appointment', v_appt.id, jsonb_build_object('status', p_status, 'reason', p_reason));

  return v_appt;
end;
$$;
