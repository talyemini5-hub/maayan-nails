-- 0006: Row Level Security
-- Principle: customers can only ever see/touch rows that belong to them;
-- everything else requires role = 'admin'. Direct table writes are locked
-- down even for admins on tables where a validating RPC exists (appointments),
-- to force all writes through the business-rule functions in 0003/0004.

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.service_addons enable row level security;
alter table public.working_hours enable row level security;
alter table public.schedule_overrides enable row level security;
alter table public.blocked_times enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_addons enable row level security;
alter table public.gallery enable row level security;
alter table public.saved_inspirations enable row level security;
alter table public.reviews enable row level security;
alter table public.business_settings enable row level security;
alter table public.customer_treatment_history enable row level security;
alter table public.uploaded_images enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customers where profile_id = auth.uid();
$$;

-- ---------------- profiles ----------------
create policy profiles_select_own on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_all on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- customers ----------------
create policy customers_select_own on public.customers for select
  using (profile_id = auth.uid() or public.is_admin());
create policy customers_update_own on public.customers for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());
create policy customers_admin_write on public.customers for insert
  with check (public.is_admin());
create policy customers_admin_delete on public.customers for delete
  using (public.is_admin());

-- ---------------- services / service_addons ----------------
create policy services_public_read on public.services for select
  using (is_active = true or public.is_admin());
create policy services_admin_write on public.services for all
  using (public.is_admin()) with check (public.is_admin());

create policy service_addons_public_read on public.service_addons for select
  using (true);
create policy service_addons_admin_write on public.service_addons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- schedule internals (admin only; availability is exposed
-- exclusively via the get_available_slots / get_available_dates RPCs) -----
create policy working_hours_admin_only on public.working_hours for all
  using (public.is_admin()) with check (public.is_admin());
create policy schedule_overrides_admin_only on public.schedule_overrides for all
  using (public.is_admin()) with check (public.is_admin());
create policy blocked_times_admin_only on public.blocked_times for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- appointments ----------------
-- Reads: customer sees only their own; admin sees all.
create policy appointments_select on public.appointments for select
  using (customer_id = public.current_customer_id() or public.is_admin());
-- Direct writes: admin only (customers must use create_appointment_request /
-- customer_cancel_appointment / customer_reschedule_appointment, which are
-- SECURITY DEFINER and therefore run with elevated privilege regardless of
-- this policy — this policy is defense-in-depth against any direct table access).
create policy appointments_admin_write on public.appointments for all
  using (public.is_admin()) with check (public.is_admin());

create policy appointment_addons_select on public.appointment_addons for select
  using (
    exists (select 1 from public.appointments a where a.id = appointment_id and (a.customer_id = public.current_customer_id() or public.is_admin()))
  );
create policy appointment_addons_admin_write on public.appointment_addons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- gallery ----------------
create policy gallery_public_read on public.gallery for select
  using (is_published = true or public.is_admin());
create policy gallery_admin_write on public.gallery for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- saved inspirations ----------------
create policy saved_inspirations_own on public.saved_inspirations for select
  using (customer_id = public.current_customer_id() or public.is_admin());
create policy saved_inspirations_insert_own on public.saved_inspirations for insert
  with check (customer_id = public.current_customer_id());
create policy saved_inspirations_delete_own on public.saved_inspirations for delete
  using (customer_id = public.current_customer_id() or public.is_admin());

-- ---------------- reviews ----------------
create policy reviews_public_read on public.reviews for select
  using (status = 'published' or public.is_admin());
create policy reviews_admin_write on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- business settings ----------------
create policy business_settings_public_read on public.business_settings for select
  using (true);
create policy business_settings_admin_write on public.business_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- treatment history ----------------
create policy treatment_history_own on public.customer_treatment_history for select
  using (customer_id = public.current_customer_id() or public.is_admin());
create policy treatment_history_admin_write on public.customer_treatment_history for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- admin-only tables ----------------
create policy uploaded_images_admin_only on public.uploaded_images for all
  using (public.is_admin()) with check (public.is_admin());
create policy notification_logs_admin_only on public.notification_logs for all
  using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin_only on public.audit_logs for all
  using (public.is_admin()) with check (public.is_admin());

-- Lock down direct execution of internal helper so only the RPCs above use it
revoke all on function public._effective_hours(date) from public, anon, authenticated;

-- Explicitly grant execute on the public-facing RPCs
grant execute on function public.get_available_slots(date, uuid) to anon, authenticated;
grant execute on function public.get_available_dates(date, uuid) to anon, authenticated;
-- Callable by guests (anon) too — booking must not require signing in first.
grant execute on function public.create_appointment_request(uuid, uuid[], timestamptz, text, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.customer_cancel_appointment(uuid, uuid) to authenticated;
grant execute on function public.customer_reschedule_appointment(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.admin_upsert_appointment(uuid, uuid, uuid, uuid[], timestamptz, text, appointment_status) to authenticated;
grant execute on function public.admin_set_appointment_status(uuid, appointment_status, text) to authenticated;
