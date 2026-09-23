import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";
import { verifyEmailActionToken } from "@/lib/email/action-token";
import { formatDateHe, formatTimeHe } from "@/lib/format";

/**
 * Public (unauthenticated) endpoint behind the "אישור / דחייה" buttons in the
 * admin_new_booking alert email — lets Maayan approve or decline a pending
 * booking request with one click, no /admin login required. Security is the
 * signed token (see lib/email/action-token.ts), not a session; this route is
 * intentionally outside /api/admin so proxy.ts's admin-auth gate never blocks it.
 *
 * Because it's opened by clicking a link in an email client / browser (not a
 * fetch call from our own UI), it must return an HTML page, not JSON.
 */

const PAGE_STYLE =
  "font-family: Heebo, Arial, sans-serif; direction: rtl; text-align: center; background:#fbf8f4; padding:48px 16px; color:#2c2725; min-height:100vh; box-sizing:border-box;";
const CARD_STYLE =
  "max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px -12px rgba(44,39,37,0.18);";

function page(title: string, body: string, ok: boolean) {
  const icon = ok ? "✓" : "✕";
  const color = ok ? "#2f6f4e" : "#6e2b3a";
  return new NextResponse(
    `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="${PAGE_STYLE}"><div style="${CARD_STYLE}"><p style="font-size:40px;margin:0 0 8px;color:${color};">${icon}</p><h1 style="font-size:20px;margin:0 0 12px;">${title}</h1><div style="font-size:15px;color:#4a423d;line-height:1.6;">${body}</div></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const verified = verifyEmailActionToken({
    appointmentId: id,
    action: url.searchParams.get("action"),
    exp: url.searchParams.get("exp"),
    token: url.searchParams.get("token"),
  });

  if (!verified.ok) {
    const messages: Record<string, string> = {
      MISCONFIGURED: "התכונה הזו אינה מוגדרת כרגע באתר.",
      INVALID: "הקישור אינו תקין.",
      EXPIRED: "פג תוקפו של הקישור. אפשר לבצע את הפעולה מפאנל הניהול.",
    };
    return page("לא ניתן לבצע את הפעולה", messages[verified.reason], false);
  }

  const admin = createServiceRoleClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id, appointment_status, service_id, customer_id, start_at, final_price")
    .eq("id", id)
    .single();

  if (!appointment) {
    return page("התור לא נמצא", "ייתכן שהתור נמחק.", false);
  }

  if (appointment.appointment_status !== "pending_approval") {
    return page(
      "כבר טופל",
      `הבקשה הזו כבר טופלה קודם (סטטוס נוכחי: ${appointment.appointment_status}). אין צורך בפעולה נוספת.`,
      appointment.appointment_status === "confirmed"
    );
  }

  const action = verified.action;
  const newStatus = action === "confirm" ? "confirmed" : "declined";
  const reason = action === "decline" ? "נדחה על ידי מעיין (דרך המייל)" : null;

  const { data: updated, error } = await admin
    .from("appointments")
    .update({
      appointment_status: newStatus,
      approval_status: newStatus === "confirmed" ? "approved" : "declined",
      cancel_reason: reason,
      hold_expires_at: newStatus === "confirmed" ? null : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("appointment_status", "pending_approval")
    .select("id, start_at, final_price, service_id, customer_id")
    .single();

  if (error || !updated) {
    console.error("email-action appointment update failed", error);
    return page("אירעה שגיאה", "נא לנסות שוב, או לבצע את הפעולה מפאנל הניהול.", false);
  }

  await admin.from("audit_logs").insert({
    actor_id: null,
    action: "appointment_status_changed",
    entity_type: "appointment",
    entity_id: updated.id,
    metadata: { status: newStatus, reason, via: "email_action" },
  });

  const [{ data: service }, { data: customer }] = await Promise.all([
    admin.from("services").select("name").eq("id", updated.service_id).single(),
    admin.from("customers").select("full_name, email").eq("id", updated.customer_id).single(),
  ]);

  if (customer?.email) {
    await sendAppointmentNotification({
      type: newStatus === "confirmed" ? "appointment_confirmed" : "appointment_declined",
      appointmentId: updated.id,
      recipientEmail: customer.email,
      data: {
        customerName: customer.full_name,
        serviceName: service?.name ?? "",
        startAt: updated.start_at,
        price: updated.final_price,
        address: "הכרמים 104, אופקים",
        reason,
      },
    });
  }

  const when = `${formatDateHe(updated.start_at)}, ${formatTimeHe(updated.start_at)}`;
  if (newStatus === "confirmed") {
    return page(
      "התור אושר ✓",
      `התור של ${customer?.full_name ?? ""} ל${service?.name ?? "טיפול"} בתאריך ${when} אושר, והלקוחה קיבלה מייל עדכון.`,
      true
    );
  }
  return page(
    "התור נדחה",
    `בקשת התור של ${customer?.full_name ?? ""} ל${service?.name ?? "טיפול"} בתאריך ${when} נדחתה, והלקוחה קיבלה מייל עדכון.`,
    false
  );
}
