-- Maayan Nails — Database schema
-- 0001: extensions + enum types

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "btree_gist";    -- required for EXCLUDE USING gist on non-range equality columns

-- Roles
do $$ begin
  create type app_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

-- Service kind
do $$ begin
  create type service_kind as enum ('treatment', 'addon');
exception when duplicate_object then null; end $$;

-- Appointment lifecycle status (operational state)
do $$ begin
  create type appointment_status as enum (
    'pending_approval', -- ממתין לאישור
    'scheduled',         -- נקבע (אושר אוטומטית)
    'confirmed',         -- אושר (אושר ידנית ע"י מעיין)
    'declined',          -- נדחה
    'arrived',           -- הגיעה
    'in_progress',       -- בטיפול
    'completed',         -- הושלם
    'cancelled',         -- בוטל
    'no_show'            -- לא הגיעה
  );
exception when duplicate_object then null; end $$;

-- Statuses that actually occupy a slot on the calendar / must be protected from double-booking
-- (declined, cancelled, no_show do NOT block the slot)

do $$ begin
  create type blocked_time_type as enum ('personal', 'errand', 'vacation', 'day_off', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gallery_category as enum ('gel_polish', 'extensions', 'french', 'nail_art', 'before_after', 'special');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('draft', 'approved', 'published', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'appointment_requested',
    'appointment_confirmed',
    'appointment_declined',
    'appointment_rescheduled',
    'appointment_cancelled',
    'appointment_reminder'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;
