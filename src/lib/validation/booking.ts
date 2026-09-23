import { z } from "zod";

/** Israeli phone numbers: 05X-XXXXXXX (mobile) or 0X-XXXXXXX (landline), digits only after stripping separators. */
export const israeliPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^0(5\d{8}|[2-4,8-9]\d{7})$/.test(v), {
    message: "מספר טלפון לא תקין. נא להזין מספר ישראלי, לדוגמה 050-1234567",
  });

export const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "נא להזין שם מלא"),
  phone: israeliPhoneSchema,
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  note: z.string().trim().max(500, "עד 500 תווים").optional(),
});
export type CustomerDetailsInput = z.infer<typeof customerDetailsSchema>;

export const createAppointmentRequestSchema = z.object({
  serviceId: z.string().uuid(),
  addonIds: z.array(z.string().uuid()).default([]),
  startAt: z.string().datetime({ offset: true, message: "תאריך/שעה לא תקינים" }),
  customer: customerDetailsSchema,
  inspirationImageUrl: z.string().url().nullable().optional(),
  savedInspirationId: z.string().uuid().nullable().optional(),
  acceptedCancellationPolicy: z.literal(true, {
    error: "יש לאשר את מדיניות הביטולים",
  }),
});
export type CreateAppointmentRequestInput = z.infer<typeof createAppointmentRequestSchema>;

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  newStartAt: z.string().datetime({ offset: true }),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
});

export const otpVerifySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "הקוד חייב להכיל 6 ספרות"),
});
