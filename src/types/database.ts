/**
 * Hand-authored types mirroring the Supabase schema (supabase/migrations).
 * Once the project is linked, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * and reconcile any drift with this file's shape (kept compatible on purpose).
 */

export type AppRole = "customer" | "admin";
export type ServiceKind = "treatment" | "addon";
export type AppointmentStatus =
  | "pending_approval"
  | "scheduled"
  | "confirmed"
  | "declined"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type ApprovalStatus = "pending" | "approved" | "declined" | "not_required";
export type BlockedTimeType = "personal" | "errand" | "vacation" | "day_off" | "custom";
export type GalleryCategory =
  | "gel_polish"
  | "extensions"
  | "french"
  | "nail_art"
  | "before_after"
  | "special";
export type ReviewStatus = "draft" | "approved" | "published" | "hidden";
export type NotificationType =
  | "appointment_requested"
  | "appointment_confirmed"
  | "appointment_declined"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_reminder";
export type NotificationStatus = "sent" | "failed" | "skipped";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  profile_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  kind: ServiceKind;
  name: string;
  description: string | null;
  price: number;
  price_max: number | null;
  is_price_from: boolean;
  duration_minutes: number | null;
  prep_buffer_minutes: number;
  image_url: string | null;
  is_active: boolean;
  requires_approval: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ServiceAddonLink = {
  service_id: string;
  addon_id: string;
  created_at: string;
};

export type WorkingHours = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  updated_at: string;
};

export type ScheduleOverride = {
  id: string;
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string;
};

export type BlockedTime = {
  id: string;
  start_at: string;
  end_at: string;
  block_type: BlockedTimeType;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  customer_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  prep_buffer_minutes: number;
  price: number;
  final_price: number;
  appointment_status: AppointmentStatus;
  approval_status: ApprovalStatus;
  notes: string | null;
  inspiration_image_url: string | null;
  hold_expires_at: string | null;
  created_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  is_recurring_followup: boolean;
  parent_appointment_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentAddon = {
  id: string;
  appointment_id: string;
  addon_id: string;
  name_snapshot: string;
  price: number;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: GalleryCategory;
  image_url: string;
  thumbnail_url: string | null;
  orientation: "portrait" | "landscape" | "square";
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SavedInspiration = {
  id: string;
  customer_id: string;
  gallery_item_id: string | null;
  custom_image_url: string | null;
  note: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  customer_name: string;
  rating: number | null;
  content: string;
  status: ReviewStatus;
  is_demo: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type BusinessSettingsRow = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
};

export type CustomerTreatmentHistory = {
  id: string;
  appointment_id: string | null;
  customer_id: string;
  treatment_type: string | null;
  treatment_date: string;
  price: number | null;
  color: string | null;
  shade_number: string | null;
  brand: string | null;
  addons: string[] | null;
  notes: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  created_at: string;
};

export type NotificationLog = {
  id: string;
  notification_type: NotificationType;
  recipient_email: string;
  appointment_id: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/** Row shape returned by get_available_slots(date, service_id) */
export type AvailableSlot = {
  slot_start: string;
  slot_end: string;
};

/** Shape expected by @supabase/postgrest-js's GenericTable constraint. */
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/** Shape expected by @supabase/postgrest-js's GenericFunction constraint. */
type Fn<Args, Returns> = { Args: Args; Returns: Returns };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      customers: Table<Customer>;
      services: Table<Service>;
      service_addons: Table<ServiceAddonLink, ServiceAddonLink, Partial<ServiceAddonLink>>;
      working_hours: Table<WorkingHours>;
      schedule_overrides: Table<ScheduleOverride>;
      blocked_times: Table<BlockedTime>;
      appointments: Table<Appointment>;
      appointment_addons: Table<AppointmentAddon>;
      gallery: Table<GalleryItem>;
      saved_inspirations: Table<SavedInspiration>;
      reviews: Table<Review>;
      business_settings: Table<BusinessSettingsRow>;
      customer_treatment_history: Table<CustomerTreatmentHistory>;
      notification_logs: Table<NotificationLog>;
      audit_logs: Table<AuditLog>;
    };
    Views: Record<string, never>;
    Functions: {
      get_available_slots: Fn<{ p_date: string; p_service_id: string }, AvailableSlot[]>;
      get_available_dates: Fn<{ p_month_start: string; p_service_id: string }, { available_date: string }[]>;
      create_appointment_request: Fn<
        {
          p_service_id: string;
          p_addon_ids: string[] | null;
          p_start_at: string;
          p_notes: string | null;
          p_inspiration_image_url: string | null;
          p_customer_full_name: string;
          p_customer_phone: string;
          p_customer_email: string;
          p_auth_user_id: string | null;
        },
        Appointment
      >;
      customer_cancel_appointment: Fn<{ p_appointment_id: string; p_customer_id: string }, Appointment>;
      customer_reschedule_appointment: Fn<{ p_appointment_id: string; p_customer_id: string; p_new_start_at: string }, Appointment>;
      admin_upsert_appointment: Fn<
        {
          p_appointment_id: string | null;
          p_customer_id: string;
          p_service_id: string;
          p_addon_ids: string[] | null;
          p_start_at: string;
          p_notes: string | null;
          p_status: AppointmentStatus | null;
        },
        Appointment
      >;
      admin_set_appointment_status: Fn<{ p_appointment_id: string; p_status: AppointmentStatus; p_reason: string | null }, Appointment>;
    };
  };
};
