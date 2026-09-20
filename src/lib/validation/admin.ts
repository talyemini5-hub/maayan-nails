import { z } from "zod";

export const serviceFormSchema = z
  .object({
    kind: z.enum(["treatment", "addon"]),
    name: z.string().trim().min(2, "נא להזין שם"),
    description: z.string().trim().max(500).optional().nullable(),
    price: z.coerce.number().min(0, "המחיר לא יכול להיות שלילי"),
    priceMax: z.coerce.number().min(0).optional().nullable(),
    isPriceFrom: z.boolean().default(false),
    durationMinutes: z.coerce.number().int().min(5).max(480).optional().nullable(),
    prepBufferMinutes: z.coerce.number().int().min(0).max(120).default(0),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
    allowedAddonIds: z.array(z.string().uuid()).default([]),
  })
  .refine((data) => !data.priceMax || data.priceMax >= data.price, {
    message: "מחיר מקסימלי חייב להיות גדול או שווה למחיר הבסיס",
    path: ["priceMax"],
  });
export type ServiceFormInput = z.infer<typeof serviceFormSchema>;

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין (HH:mm)");

export const workingHoursDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    startTime: timeString.optional().nullable(),
    endTime: timeString.optional().nullable(),
    breakStart: timeString.optional().nullable(),
    breakEnd: timeString.optional().nullable(),
  })
  .refine((d) => !d.isOpen || (d.startTime && d.endTime && d.startTime < d.endTime), {
    message: "שעת פתיחה חייבת להיות לפני שעת סגירה",
  });

export const scheduleOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isClosed: z.boolean().default(false),
  startTime: timeString.optional().nullable(),
  endTime: timeString.optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export const blockedTimeSchema = z
  .object({
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    blockType: z.enum(["personal", "errand", "vacation", "day_off", "custom"]),
    reason: z.string().max(200).optional().nullable(),
  })
  .refine((d) => new Date(d.startAt) < new Date(d.endAt), {
    message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
    path: ["endAt"],
  });

export const businessSettingsSchema = z.object({
  business_info: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    whatsapp_intl: z.string().min(1),
    instagram_url: z.string().url(),
    timezone: z.string().min(1),
    logo_url: z.string().url().nullable(),
  }),
  availability: z.object({
    slot_interval_minutes: z.coerce.number().int().min(5).max(120),
    booking_horizon_days: z.coerce.number().int().min(1).max(365),
    short_notice_hours: z.coerce.number().min(0).max(72),
    hold_duration_minutes: z.coerce.number().int().min(1).max(120),
  }),
  policies: z.object({
    reschedule_cutoff_hours: z.coerce.number().min(0).max(72),
    warranty_text: z.string().min(1),
    nail_art_policy_text: z.string().min(1),
    cancellation_policy_text: z.string().min(1),
  }),
});

export const galleryItemFormSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.enum(["gel_polish", "extensions", "french", "nail_art", "before_after", "special"]),
  imageUrl: z.string().url("נא להזין קישור תמונה תקין"),
  thumbnailUrl: z.string().url().optional().nullable(),
  orientation: z.enum(["portrait", "landscape", "square"]).default("square"),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});
export type GalleryItemFormInput = z.infer<typeof galleryItemFormSchema>;

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["draft", "approved", "published", "hidden"]),
});

export const reviewFormSchema = z.object({
  customerName: z.string().trim().min(2, "נא להזין שם"),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  content: z.string().trim().min(2, "נא להזין תוכן"),
  status: z.enum(["draft", "approved", "published", "hidden"]).default("draft"),
  sortOrder: z.coerce.number().int().default(0),
});
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export const customerNotesUpdateSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
});

export const adminAppointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum([
    "pending_approval",
    "scheduled",
    "confirmed",
    "declined",
    "arrived",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ]),
  reason: z.string().max(300).optional().nullable(),
});
