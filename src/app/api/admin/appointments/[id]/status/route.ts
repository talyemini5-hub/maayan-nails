import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";
import type { NotificationType } from "@/types/database";

/**
 * Admin-only (enforced by proxy.ts's updateSession for the whole /api/admin/**
 * prefix). Always goes through the admin_set_appointment_status RPC rather
 * than a direct table update — see 0006_rls.sql's comment on why appointment
 * writes stay funneled through the SECURITY DEFINER functions even for admins.
 */
const bodySchema = z.object({
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

/** Statuses that should notify the customer by email when an admin sets them. */
const NOTIFICATION_TYPE_BY_STATUS: Partial<Record<string, NotificationType>> = {
  confirmed: "appointment_confirmed",
  declined: "appointment_declined",
  cancelled: "appointment_cancelled",
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("admin_set_appointment_status", {
    p_appointment_id: id,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason ?? null,
  });

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "SLOT_TAKEN", message: "לא ניתן — יש כבר תור פעיל אחר בשעה הזו." },
        { status: 409 }
      );
    }
    console.error("admin_set_appointment_status failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה. נא לנסות שוב." }, { status: 500 });
  }

  const notificationType = NOTIFICATION_TYPE_BY_STATUS[parsed.data.status];
  if (notificationType) {
    const [{ data: service }, { data: customer }] = await Promise.all([
      supabase.from("services").select("name").eq("id", data.service_id).single(),
      supabase.from("customers").select("full_name, email").eq("id", data.customer_id).single(),
    ]);
    if (customer?.email) {
      const recipientEmail = customer.email;
      const reason = parsed.data.reason ?? null;
      after(() =>
        sendAppointmentNotification({
          type: notificationType,
          appointmentId: data.id,
          recipientEmail,
          data: {
            customerName: customer.full_name,
            serviceName: service?.name ?? "",
            startAt: data.start_at,
            price: data.final_price,
            address: "הכרמים 104, אופקים",
            reason,
          },
        })
      );
    }
  }

  return NextResponse.json({ appointment: data });
}
