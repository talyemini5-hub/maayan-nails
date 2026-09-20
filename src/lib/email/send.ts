import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildEmailForNotification, type AppointmentEmailData } from "@/lib/email/templates";
import type { NotificationType } from "@/types/database";

/**
 * Sends a transactional appointment email and unconditionally writes a row
 * to notification_logs (sent / failed / skipped). Per spec: a failed or
 * skipped email must NEVER throw and must never block or duplicate the
 * appointment it's about — this function always resolves, never rejects.
 */
export async function sendAppointmentNotification(params: {
  type: NotificationType;
  appointmentId: string;
  recipientEmail: string;
  data: AppointmentEmailData;
}): Promise<void> {
  const { type, appointmentId, recipientEmail, data } = params;
  let status: "sent" | "failed" | "skipped" = "skipped";
  let errorMessage: string | null = null;

  try {
    const env = getServerEnv();
    if (!env.RESEND_API_KEY) {
      status = "skipped";
      errorMessage = "RESEND_API_KEY is not configured — email sending is disabled.";
    } else {
      const resend = new Resend(env.RESEND_API_KEY);
      const { subject, html } = buildEmailForNotification(type, data);
      const { error } = await resend.emails.send({
        from: env.EMAIL_FROM || "Maayan Nails <onboarding@resend.dev>",
        to: recipientEmail,
        subject,
        html,
      });
      if (error) {
        status = "failed";
        errorMessage = error.message;
      } else {
        status = "sent";
      }
    }
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : "Unknown error while sending email";
  }

  try {
    const admin = createServiceRoleClient();
    await admin.from("notification_logs").insert({
      notification_type: type,
      recipient_email: recipientEmail,
      appointment_id: appointmentId,
      status,
      error_message: errorMessage,
    });
  } catch {
    // Logging itself failed (e.g. service role key missing in dev) — swallow,
    // this must never bubble up and affect the appointment flow.
  }
}
