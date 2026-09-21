-- 0007: support any number of break windows per working day.
-- Replaces the single break_start/break_end pair on working_hours with a
-- one-to-many table, since a real salon day can have more than one closed
-- window (e.g. 12:00-13:00 for lunch AND 16:00-16:30 for a personal errand).

set search_path = public;

create table if not exists public.working_hours_breaks (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null references public.working_hours(day_of_week) on delete cascade,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint working_hours_breaks_range_check check (start_time < end_time)
);
create index if not exists working_hours_breaks_day_idx on public.working_hours_breaks (day_of_week);

alter table public.working_hours_breaks enable row level security;
create policy working_hours_breaks_admin_only on public.working_hours_breaks for all
  using (public.is_admin()) with check (public.is_admin());

-- Carry over any existing single-break data before dropping the old columns.
insert into public.working_hours_breaks (day_of_week, start_time, end_time)
select day_of_week, break_start, break_end
from public.working_hours
where break_start is not null and break_end is not null;

-- ------------------------------------------------------------------
-- _effective_hours no longer deals with breaks at all (multiple breaks
-- per day can't fit in a single row) — it only resolves the open/close
-- window; breaks are now checked directly in get_available_slots below.
-- ------------------------------------------------------------------
create or replace function public._effective_hours(p_date date)
returns table (start_time time, end_time time)
language sql
stable
as $$
  select
    coalesce(o.start_time, w.start_time) as start_time,
    coalesce(o.end_time, w.end_time) as end_time
  from (select 1) dummy
  left join public.schedule_overrides o on o.date = p_date
  left join public.working_hours w on w.day_of_week = extract(dow from p_date)::int
  where coalesce(o.is_closed, false) = false
    and (o.id is not null or (w.is_open is true))
$$;

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
  v_cursor timestamptz;
  v_slot_end timestamptz;
  v_now timestamptz := now();
  v_dow int := extract(dow from p_date)::int;
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

  v_cursor := v_day_start;
  while v_cursor + make_interval(mins => v_duration) <= v_day_end loop
    v_slot_end := v_cursor + make_interval(mins => v_duration);

    if v_cursor >= v_now
      -- doesn't overlap ANY of that day's break windows (any number of them)
      and not exists (
        select 1 from public.working_hours_breaks wb
        where wb.day_of_week = v_dow
          and v_cursor < ((p_date::text || ' ' || wb.end_time::text)::timestamp at time zone v_tz)
          and v_slot_end > ((p_date::text || ' ' || wb.start_time::text)::timestamp at time zone v_tz)
      )
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

-- Old single-break columns are fully superseded by working_hours_breaks above.
alter table public.working_hours drop constraint if exists working_hours_break_check;
alter table public.working_hours drop column if exists break_start;
alter table public.working_hours drop column if exists break_end;
