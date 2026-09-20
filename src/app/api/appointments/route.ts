import { NextResponse } from "next/server";
import { createAppointmentRequestSchema } from "@/lib/validation/booking";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";

/**
 * Creates a new appointment request. Deliberately does NOT require the
 * caller to be signed in (see create_appointment_request in
 * supabase/migrations/0003_functions.sql) — booking must stay frictionless.
 *
 * Double-booking safety: all we do here is call the RPC and translate its
 * result/error. The actual race-condition guard is the Postgres EXCLUDE
 * constraint on public.appointments — see appointments_no_overlap.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = createAppointmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appointment, error } = await supabase.rpc("create_appointment_request", {
    p_service_id: input.serviceId,
    p_addon_ids: input.addonIds,
    p_start_at: input.startAt,
    p_notes: input.customer.note ?? null,
    p_inspiration_image_url: input.inspirationImageUrl ?? null,
    p_customer_full_name: input.customer.fullName,
    p_customer_phone: input.customer.phone,
    p_customer_email: input.customer.email,
    p_auth_user_id: user?.id ?? null,
  });

  if (error) {
    // 23P01 = exclusion_violation → the slot was taken by someone else in
    // the split-second between the client reading availability and this
    // request landing. This is the double-booking guard doing its job.
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "SLOT_TAKEN", message: "מצטערים, השעה הזו נתפסה ממש עכשיו. נא לבחור שעה אחרת." },
        { status: 409 }
      );
    }
    if (error.message?.includes("SLOT_IN_PAST")) {
      return NextResponse.json({ error: "SLOT_IN_PAST", message: "לא ניתן לקבוע תור בזמן שכבר עבר." }, { status: 400 });
    }
    if (error.message?.includes("SERVICE_NOT_BOOKABLE")) {
      return NextResponse.json(
        { error: "SERVICE_NOT_BOOKABLE", message: "הטיפול הזה אינו זמין כרגע לקביעת תור אונליין." },
        { status: 400 }
      );
    }
    console.error("create_appointment_request failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה. נא לנסות שוב." }, { status: 500 });
  }

  // Fire-and-forget: never let email delivery block or fail the booking response.
  const { data: service } = await supabase.from("services").select("name").eq("id", appointment.service_id).single();
  void sendAppointmentNotification({
    type: appointment.appointment_status === "pending_approval" ? "appointment_requested" : "appointment_confirmed",
    appointmentId: appointment.id,
    recipientEmail: input.customer.email,
    data: {
      customerName: input.customer.fullName,
      serviceName: service?.name ?? "",
      startAt: appointment.start_at,
      price: appointment.final_price,
      address: "הכרמים 104, אופקים",
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
