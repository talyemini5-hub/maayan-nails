-- 0002: core tables

-- ============================================================
-- PROFILES — 1:1 with auth.users, carries role
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'customer',
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per authenticated user (auth.users). Holds role for authorization.';

-- ============================================================
-- CUSTOMERS — canonical customer business record.
-- Can exist before the customer ever creates an account (e.g. walk-in
-- entered by admin), and gets linked to a profile once they authenticate.
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  notes text,                         -- private admin notes, never exposed to the customer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_email_idx on public.customers (lower(email));

-- trigram search requires pg_trgm
create extension if not exists pg_trgm;
create index if not exists customers_full_name_idx on public.customers using gin (full_name gin_trgm_ops);

-- ============================================================
-- SERVICES — treatments AND addons live in the same table
-- (service_kind distinguishes them), so addons can be linked to
-- treatments via service_addons.
-- ============================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  kind service_kind not null default 'treatment',
  name text not null,
  description text,
  price numeric(10,2) not null,
  price_max numeric(10,2),                 -- optional range (e.g. nail art 10-50 ILS)
  is_price_from boolean not null default false, -- "החל מ-"
  duration_minutes int,                     -- NULL = cannot be booked online yet
  prep_buffer_minutes int not null default 0,
  image_url text,
  is_active boolean not null default true,
  requires_approval boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint services_price_max_check check (price_max is null or price_max >= price),
  constraint services_duration_check check (duration_minutes is null or duration_minutes > 0)
);
create index if not exists services_kind_active_idx on public.services (kind, is_active, sort_order);

-- Which addons are selectable for which treatment
create table if not exists public.service_addons (
  service_id uuid not null references public.services(id) on delete cascade,
  addon_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, addon_id),
  constraint service_addons_not_self check (service_id <> addon_id)
);

-- ============================================================
-- WORKING HOURS — fixed weekly schedule
-- ============================================================
create table if not exists public.working_hours (
  day_of_week int primary key check (day_of_week between 0 and 6), -- 0=Sunday .. 6=Saturday
  is_open boolean not null default true,
  start_time time,
  end_time time,
  break_start time,
  break_end time,
  updated_at timestamptz not null default now(),
  constraint working_hours_range_check check (
    (is_open = false) or (start_time is not null and end_time is not null and start_time < end_time)
  ),
  constraint working_hours_break_check check (
    (break_start is null and break_end is null) or (break_start < break_end)
  )
);

-- ============================================================
-- SCHEDULE OVERRIDES — per-date exceptions to the weekly schedule
-- (special hours, or a day fully closed)
-- ============================================================
create table if not exists public.schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  constraint schedule_overrides_range_check check (
    is_closed = true or start_time is null or end_time is null or start_time < end_time
  )
);

-- ============================================================
-- BLOCKED TIMES — ad-hoc blocks (personal, errands, vacation, custom)
-- ============================================================
create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  block_type blocked_time_type not null default 'custom',
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint blocked_times_range_check check (start_at < end_at)
);
create index if not exists blocked_times_range_idx on public.blocked_times using gist (tstzrange(start_at, end_at, '[)'));

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_minutes int not null,
  prep_buffer_minutes int not null default 0,
  price numeric(10,2) not null,
  final_price numeric(10,2) not null,
  appointment_status appointment_status not null default 'pending_approval',
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','declined','not_required')),
  notes text,
  inspiration_image_url text,
  hold_expires_at timestamptz,          -- only set while appointment_status = 'pending_approval'
  created_by uuid references public.profiles(id), -- null = booked by the customer themselves
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  cancel_reason text,
  is_recurring_followup boolean not null default false,
  parent_appointment_id uuid references public.appointments(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_range_check check (start_at < end_at)
);
create index if not exists appointments_customer_idx on public.appointments (customer_id, start_at desc);
create index if not exists appointments_start_idx on public.appointments (start_at);
create index if not exists appointments_status_idx on public.appointments (appointment_status);

-- *** CRITICAL: server + database level double-booking protection ***
-- No two appointments that are in an "active" (slot-occupying) status may overlap in time.
-- This EXCLUDE constraint is enforced by Postgres itself on every INSERT/UPDATE — it cannot
-- be bypassed by application bugs, race conditions, or concurrent requests.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (appointment_status in ('pending_approval','scheduled','confirmed','arrived','in_progress'));

-- Addons attached to a booked appointment
create table if not exists public.appointment_addons (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  addon_id uuid not null references public.services(id),
  name_snapshot text not null,   -- addon name at time of booking (survives later renames)
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists appointment_addons_appt_idx on public.appointment_addons (appointment_id);

-- ============================================================
-- GALLERY
-- ============================================================
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  category gallery_category not null default 'nail_art',
  image_url text not null,
  thumbnail_url text,
  orientation text check (orientation in ('portrait','landscape','square')) default 'square',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gallery_published_idx on public.gallery (is_published, category, sort_order);

-- ============================================================
-- SAVED INSPIRATIONS — customer "likes" from the gallery, or an
-- uploaded reference photo, attachable to a booking.
-- ============================================================
create table if not exists public.saved_inspirations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  gallery_item_id uuid references public.gallery(id) on delete set null,
  custom_image_url text,
  note text,
  created_at timestamptz not null default now(),
  constraint saved_inspirations_source_check check (gallery_item_id is not null or custom_image_url is not null)
);
create index if not exists saved_inspirations_customer_idx on public.saved_inspirations (customer_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int check (rating between 1 and 5),
  content text not null,
  status review_status not null default 'draft',
  is_demo boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists reviews_status_idx on public.reviews (status);

-- ============================================================
-- BUSINESS SETTINGS — singleton key/value store, editable from Admin
-- ============================================================
create table if not exists public.business_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- ============================================================
-- CUSTOMER TREATMENT HISTORY
-- ============================================================
create table if not exists public.customer_treatment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  treatment_type text,
  treatment_date date not null default current_date,
  price numeric(10,2),
  color text,
  shade_number text,
  brand text,
  addons text[],
  notes text,
  before_image_url text,
  after_image_url text,
  created_at timestamptz not null default now()
);
create index if not exists treatment_history_customer_idx on public.customer_treatment_history (customer_id, treatment_date desc);

-- ============================================================
-- UPLOADED IMAGES — audit trail for storage uploads
-- ============================================================
create table if not exists public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  uploaded_by uuid references public.profiles(id),
  original_filename text,
  mime_type text,
  size_bytes int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_type notification_type not null,
  recipient_email text not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  status notification_status not null,
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists notification_logs_appt_idx on public.notification_logs (appointment_id);

-- ============================================================
-- AUDIT LOGS — admin actions
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
