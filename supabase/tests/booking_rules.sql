-- Manual SQL smoke tests for the double-booking guarantee and core RLS rules.
-- Run this against a connected Supabase project (local `supabase start` needs
-- Docker, which is not available in every environment) with:
--   supabase db execute --file supabase/tests/booking_rules.sql
-- or paste it into the SQL editor in the Supabase dashboard.
-- Every block either raises "PASS: ..." via RAISE NOTICE or aborts the
-- transaction with an assertion failure — nothing here is left committed
-- (the whole file runs inside one rolled-back transaction).

begin;

-- ------------------------------------------------------------------
-- Fixtures: one service with a 60-minute duration, one customer.
-- ------------------------------------------------------------------
insert into services (id, kind, name, price, duration_minutes, is_active)
values ('00000000-0000-4000-8000-000000000001', 'treatment', '__test_service__', 100, 60, true);

insert into customers (id, full_name, email)
values ('00000000-0000-4000-8000-000000000002', '__test_customer_a__', 'a@test.local');

insert into customers (id, full_name, email)
values ('00000000-0000-4000-8000-000000000003', '__test_customer_b__', 'b@test.local');

-- ------------------------------------------------------------------
-- TEST 1: first booking on a fresh slot succeeds.
-- ------------------------------------------------------------------
insert into appointments (id, customer_id, service_id, start_at, end_at, duration_minutes, price, final_price, appointment_status, approval_status)
values (
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  '2030-01-01 10:00:00+02', '2030-01-01 11:00:00+02',
  60, 100, 100, 'scheduled', 'not_required'
);
do $$ begin raise notice 'PASS: first booking on a free slot succeeded'; end $$;

-- ------------------------------------------------------------------
-- TEST 2: an overlapping booking for a DIFFERENT customer at the exact
-- same time MUST be rejected by the appointments_no_overlap constraint.
-- ------------------------------------------------------------------
do $$
begin
  begin
    insert into appointments (id, customer_id, service_id, start_at, end_at, duration_minutes, price, final_price, appointment_status, approval_status)
    values (
      '00000000-0000-4000-8000-0000000000a2',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000001',
      '2030-01-01 10:00:00+02', '2030-01-01 11:00:00+02',
      60, 100, 100, 'scheduled', 'not_required'
    );
    raise exception 'FAIL: overlapping booking was NOT rejected — double-booking protection is broken';
  exception
    when exclusion_violation then
      raise notice 'PASS: exact-overlap booking correctly rejected (exclusion_violation)';
  end;
end $$;

-- ------------------------------------------------------------------
-- TEST 3: a PARTIALLY overlapping booking (starts mid-way through the
-- first appointment) must also be rejected.
-- ------------------------------------------------------------------
do $$
begin
  begin
    insert into appointments (id, customer_id, service_id, start_at, end_at, duration_minutes, price, final_price, appointment_status, approval_status)
    values (
      '00000000-0000-4000-8000-0000000000a3',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000001',
      '2030-01-01 10:30:00+02', '2030-01-01 11:30:00+02',
      60, 100, 100, 'scheduled', 'not_required'
    );
    raise exception 'FAIL: partially-overlapping booking was NOT rejected';
  exception
    when exclusion_violation then
      raise notice 'PASS: partial-overlap booking correctly rejected (exclusion_violation)';
  end;
end $$;

-- ------------------------------------------------------------------
-- TEST 4: a booking immediately AFTER the first one ends (back-to-back,
-- no gap) must succeed — the range is half-open [start, end).
-- ------------------------------------------------------------------
insert into appointments (id, customer_id, service_id, start_at, end_at, duration_minutes, price, final_price, appointment_status, approval_status)
values (
  '00000000-0000-4000-8000-0000000000a4',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  '2030-01-01 11:00:00+02', '2030-01-01 12:00:00+02',
  60, 100, 100, 'scheduled', 'not_required'
);
do $$ begin raise notice 'PASS: back-to-back booking with no gap succeeded'; end $$;

-- ------------------------------------------------------------------
-- TEST 5: a CANCELLED appointment must NOT block a new booking at the
-- same time (cancelled/declined/no_show are excluded from the guard).
-- ------------------------------------------------------------------
update appointments set appointment_status = 'cancelled', cancelled_at = now()
where id = '00000000-0000-4000-8000-0000000000a1';

insert into appointments (id, customer_id, service_id, start_at, end_at, duration_minutes, price, final_price, appointment_status, approval_status)
values (
  '00000000-0000-4000-8000-0000000000a5',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  '2030-01-01 10:00:00+02', '2030-01-01 11:00:00+02',
  60, 100, 100, 'scheduled', 'not_required'
);
do $$ begin raise notice 'PASS: re-booking a slot freed by cancellation succeeded'; end $$;

-- ------------------------------------------------------------------
-- TEST 6: get_available_slots must not return a slot when a shorter gap
-- than the service duration remains (e.g. a 90-minute service against a
-- single free 60-minute window).
-- ------------------------------------------------------------------
do $$
declare
  v_count int;
begin
  update services set duration_minutes = 90 where id = '00000000-0000-4000-8000-000000000001';
  select count(*) into v_count
  from get_available_slots('2030-01-01', '00000000-0000-4000-8000-000000000001')
  where slot_start = '2030-01-01 12:00:00+02'; -- only 60 free minutes remain after a5 ends at 11:00.. next block a4 covers 11:00-12:00
  if v_count > 0 then
    raise exception 'FAIL: get_available_slots returned a slot too short for the service duration';
  end if;
  raise notice 'PASS: get_available_slots correctly excludes windows shorter than the service duration';
end $$;

rollback;
