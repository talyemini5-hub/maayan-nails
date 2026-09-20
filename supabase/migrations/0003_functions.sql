-- 0003: business-logic functions (SECURITY DEFINER RPCs)
-- These run with elevated privileges so they can read blocked_times / working_hours
-- (which are NOT publicly selectable — see RLS) while returning only the minimal,
-- safe result (free slots), never the underlying reason for a block.

set search_path = public;

-- ------------------------------------------------------------------
-- Helper: current effective open-window for a given date, honoring
-- schedule_overrides over the fixed weekly working_hours.
-- Returns NULL rows (no window) when the business is closed that day.
-- ------------------------------------------------------------------
create or replace function public._effective_hours(p_date date)
returns table (start_time time, end_time time, break_start time, break_end time)
language sql
stable
as $$
  select
    coalesce(o.start_time, w.start_time) as start_time,
    coalesce(o.end_time, w.end_time) as end_time,
    w.break_start,
    w.break_end
  from (select 1) dummy
  left join public.schedule_overrides o on o.date = p_date
  left join public.working_hours w on w.day_of_week = extract(dow from p_date)::int
  where coalesce(o.is_closed, false) = false
    and (o.id is not null or (w.is_open is true))
$$;

-- ------------------------------------------------------------------
-- Expire stale "pending_approval" holds so they stop occupying a slot.
-- Called defensively before every availability read and every booking attempt.
-- ------------------------------------------------------------------
create or replace function public.expire_stale_holds()
returns void
language sql
as $$
  update public.appointments
  set appointment_status = 'cancelled',
      cancel_reason = 'hold_expired',
      cancelled_at = now(),
      updated_at = now()
  where appointment_status = 'pending_approval'
    and hold_expires_at is not null
    and hold_expires_at < now();
$$;

-- ------------------------------------------------------------------
-- Get available start-times for a given date + service (+ optional addon ids
-- to add their extra time, currently addons do not add duration by default).
-- Slot granularity = business_settings.slot_interval_minutes.
-- ------------------------------------------------------------------
create or replace function public.get_available_slots(
  p_date date,
  p_service_id uuid
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration int;
  v_buffer int;
  v_interval int;
  v_horizon_days int;
  v_tz text := 'Asia/Jerusalem';
  v_hours record;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_break_start timestamptz;
  v_break_end timestamptz;
  v_cursor timestamptz;
  v_slot_end timestamptz;
  v_now timestamptz := now();
begin
  perform public.expire_stale_holds();

  select duration_minutes, prep_buffer_minutes into v_duration, v_buffer
  from public.services
  where id = p_service_id and is_active = true;

  if v_duration is null then
    return; -- service not bookable online (no duration configured) or inactive
  end if;

  select coalesce((value->>'slot_interval_minutes')::int, 30) into v_interval
  from public.business_settings where key = 'availability';

  select coalesce((value->>'booking_horizon_days')::int, 30) into v_horizon_days
  from public.business_settings where key = 'availability';

  if p_date > (v_now at time zone v_tz)::date + coalesce(v_horizon_days, 30) then
    return;
  end if;
  if p_date < (v_now at time zone v_tz)::date then
    return;
  end if;

  select * into v_hours from public._effective_hours(p_date);
  if v_hours.start_time is null or v_hours.end_time is null then
    return; -- closed
  end if;

  v_day_start := (p_date::text || ' ' || v_hours.start_time::text)::timestamp at time zone v_tz;
  v_day_end   := (p_date::text || ' ' || v_hours.end_time::text)::timestamp at time zone v_tz;
  if v_hours.break_start is not null and v_hours.break_end is not null then
    v_break_start := (p_date::text || ' ' || v_hours.break_start::text)::timestamp at time zone v_tz;
    v_break_end   := (p_date::text || ' ' || v_hours.break_end::text)::timestamp at time zone v_tz;
  end if;

  v_cursor := v_day_start;
  while v_cursor + make_interval(mins => v_duration) <= v_day_end loop
    v_slot_end := v_cursor + make_interval(mins => v_duration);

    if v_cursor >= v_now
      -- doesn't overlap the lunch/break window
      and not (v_break_start is not null and v_cursor < v_break_end and v_slot_end > v_break_start)
      -- doesn't overlap any occupied appointment (including its buffer) or blocked time
      and not exists (
        select 1 from public.appointments a
        where a.appointment_status in ('pending_approval','scheduled','confirmed','arrived','in_progress')
          and tstzrange(a.start_at, a.end_at + make_interval(mins => a.prep_buffer_minutes), '[)')
              && tstzrange(v_cursor, v_slot_end + make_interval(mins => v_buffer), '[)')
      )
      and not exists (
        select 1 from public.blocked_times b
        where tstzrange(b.start_at, b.end_at, '[)') && tstzrange(v_cursor, v_slot_end, '[)')
      )
    then
      slot_start := v_cursor;
      slot_end := v_slot_end;
      return next;
    end if;

    v_cursor := v_cursor + make_interval(mins => coalesce(v_interval, 30));
  end loop;
end;
$$;

-- ------------------------------------------------------------------
-- Get which dates in a month have at least one available slot for a service.
-- Used to render the calendar (only open, available days are selectable).
-- ------------------------------------------------------------------
create or replace function public.get_available_dates(
  p_month_start date,
  p_service_id uuid
)
returns table (available_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_month_end date := (p_month_start + interval '1 month' - interval '1 day')::date;
  v_count int;
begin
  v_day := p_month_start;
  while v_day <= v_month_end loop
    select count(*) into v_count from public.get_available_slots(v_day, p_service_id) limit 1;
    if v_count > 0 then
      available_date := v_day;
      return next;
    end if;
    v_day := v_day + 1;
  end loop;
end;
$$;

-- ------------------------------------------------------------------
-- Create an appointment request. This is the ONLY sanctioned way to insert
-- into appointments from client code. It re-validates availability inside
-- the same transaction and relies on the appointments_no_overlap EXCLUDE
-- constraint as the final, unbypassable guard against double-booking:
-- if two requests race, Postgres itself rejects the second one atomically.
--
-- Per spec, booking must NOT require a signed-in account first ("אין
-- להעמיס הרשמה מורכבת לפני קביעת התור") — so this takes plain contact
-- details and finds-or-creates the matching public.customers row itself
-- (by email), rather than requiring the caller to already hold a
-- customer_id. It is callable by both `anon` and `authenticated` (see
-- 0006_rls.sql grants). If the caller IS authenticated, p_auth_user_id
-- links the new/matched customer to their profile immediately.
-- ------------------------------------------------------------------
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

  -- Find-or-create the customer by email (case-insensitive). This keeps a
  -- returning customer's history under one record even if they book as a
  -- guest multiple times before ever logging in.
  select id into v_customer_id from public.customers where lower(email) = lower(p_customer_email) limit 1;
  if v_customer_id is null then
    insert into public.customers (profile_id, full_name, phone, email)
    values (p_auth_user_id, p_customer_full_name, p_customer_phone, p_customer_email)
    returning id into v_customer_id;
  else
    update public.customers
    set full_name = p_customer_full_name,
        phone = coalesce(p_customer_phone, phone),
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
  'Single sanctioned entry point for booking. Relies on the appointments_no_overlap EXCLUDE constraint for atomic double-booking prevention under concurrency.';
