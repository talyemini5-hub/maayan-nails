-- Fixes a real production bug (hit live on 2026-09-23): a logged-in customer
-- who books again with a DIFFERENT email than the one on their existing
-- customers row hit "duplicate key value violates unique constraint
-- customers_profile_id_key" — because the old find-or-create logic looked
-- customers up by email only, so it fell into the INSERT branch and tried to
-- insert a second customers row for the same (unique) profile_id.
--
-- Fix: when the caller is authenticated, look the customer up by profile_id
-- first (it's unique per auth user, so there's at most one row) and only
-- fall back to an email lookup for guest (unauthenticated) bookings.
create or replace function public.create_appointment_request(
  p_service_id uuid,
  p_addon_ids uuid[],
  p_start_at timestamptz,
  p_notes text,
  p_inspiration_image_url text,
  p_customer_full_name text,
  p_customer_phone text,
  p_customer_email text,
  p_auth_user_id uuid default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_addon public.services%rowtype;
  v_end_at timestamptz;
  v_price numeric(10,2);
  v_short_notice_hours numeric;
  v_hold_minutes int;
  v_status appointment_status;
  v_approval text;
  v_appt public.appointments%rowtype;
  v_addon_id uuid;
  v_customer_id uuid;
begin
  perform public.expire_stale_holds();

  -- Find-or-create the customer. A logged-in user maps to exactly one
  -- customers row (profile_id is unique) regardless of which email they type
  -- into the booking form this time, so that lookup takes priority; only a
  -- guest (no auth session) is matched by email.
  if p_auth_user_id is not null then
    select id into v_customer_id from public.customers where profile_id = p_auth_user_id limit 1;
  end if;
  if v_customer_id is null then
    select id into v_customer_id from public.customers where lower(email) = lower(p_customer_email) limit 1;
  end if;
  if v_customer_id is null then
    insert into public.customers (profile_id, full_name, phone, email)
    values (p_auth_user_id, p_customer_full_name, p_customer_phone, p_customer_email)
    returning id into v_customer_id;
  else
    update public.customers
    set full_name = p_customer_full_name,
        phone = coalesce(p_customer_phone, phone),
        email = coalesce(p_customer_email, email),
        profile_id = coalesce(profile_id, p_auth_user_id)
    where id = v_customer_id;
  end if;

  select * into v_service from public.services where id = p_service_id and is_active = true;
  if not found or v_service.duration_minutes is null then
    raise exception 'SERVICE_NOT_BOOKABLE' using errcode = 'P0001';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_price := v_service.price;

  if p_addon_ids is not null then
    foreach v_addon_id in array p_addon_ids loop
      select * into v_addon from public.services where id = v_addon_id and is_active = true and kind = 'addon';
      if not found then
        raise exception 'ADDON_NOT_FOUND' using errcode = 'P0001';
      end if;
      if not exists (select 1 from public.service_addons sa where sa.service_id = p_service_id and sa.addon_id = v_addon_id) then
        raise exception 'ADDON_NOT_ALLOWED_FOR_SERVICE' using errcode = 'P0001';
      end if;
      v_price := v_price + v_addon.price;
    end loop;
  end if;

  select coalesce((value->>'short_notice_hours')::numeric, 4) into v_short_notice_hours
  from public.business_settings where key = 'availability';
  select coalesce((value->>'hold_duration_minutes')::int, 15) into v_hold_minutes
  from public.business_settings where key = 'availability';

  if p_start_at < now() then
    raise exception 'SLOT_IN_PAST' using errcode = 'P0001';
  end if;

  if extract(epoch from (p_start_at - now())) / 3600.0 < v_short_notice_hours then
    v_status := 'pending_approval';
    v_approval := 'pending';
  elsif v_service.requires_approval then
    v_status := 'pending_approval';
    v_approval := 'pending';
  else
    v_status := 'scheduled';
    v_approval := 'not_required';
  end if;

  insert into public.appointments (
    customer_id, service_id, start_at, end_at, duration_minutes, prep_buffer_minutes,
    price, final_price, appointment_status, approval_status, notes, inspiration_image_url,
    hold_expires_at, created_by
  ) values (
    v_customer_id, p_service_id, p_start_at, v_end_at, v_service.duration_minutes, v_service.prep_buffer_minutes,
    v_price, v_price, v_status, v_approval, p_notes, p_inspiration_image_url,
    case when v_status = 'pending_approval' then now() + make_interval(mins => v_hold_minutes) else null end,
    p_auth_user_id
  )
  returning * into v_appt;
  -- ^ If this overlaps an existing active appointment, the appointments_no_overlap
  --   EXCLUDE constraint raises a unique/exclusion_violation (SQLSTATE 23P01) here,
  --   which the API layer catches and turns into a friendly "slot just got taken" message.

  if p_addon_ids is not null then
    foreach v_addon_id in array p_addon_ids loop
      select * into v_addon from public.services where id = v_addon_id;
      insert into public.appointment_addons (appointment_id, addon_id, name_snapshot, price)
      values (v_appt.id, v_addon_id, v_addon.name, v_addon.price);
    end loop;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (p_auth_user_id, 'appointment_requested', 'appointment', v_appt.id, jsonb_build_object('status', v_status));

  return v_appt;
end;
$$;

comment on function public.create_appointment_request is
  'Single sanctioned entry point for booking. Relies on the appointments_no_overlap EXCLUDE constraint for atomic double-booking prevention under concurrency. Customer lookup: by profile_id when authenticated (unique per user), else by email (guest booking).';
