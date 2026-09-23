import { NextResponse, after } from "next/server";
import { adminCreateAppointmentSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";

/**
 * Admin-only (see proxy.ts). Creates an appointment on a customer's behalf
 * (e.g. someone who messaged on WhatsApp) via the same admin_upsert_appointment
 * RPC used for editing — this call always passes p_appointment_id = null and
 * defaults the status to 'confirmed' (an admin booking it herself needs no
 * separate approval step).
 */
export async function POST(request: Request) {
  const parsed = adminCreateAppointmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const supabase = await createServerSupabaseClient();

  let customerId = input.customerId ?? null;
  let customerEmail: string | null = null;
  let customerName = "";

  if (!customerId && input.newCustomer) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: input.newCustomer.fullName,
        phone: input.newCustomer.phone,
        email: input.newCustomer.email ?? null,
      })
      .select()
      .single();
    if (customerError || !customer) {
      console.error("admin customer create failed", customerError);
      return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה ביצירת הלקוחה." }, { status: 500 });
    }
    customerId = customer.id;
    customerEmail = customer.email;
    customerName = customer.full_name;
  } else if (customerId) {
    const { data: customer } = await supabase.from("customers").select("email, full_name").eq("id", customerId).single();
    customerEmail = customer?.email ?? null;
    customerName = customer?.full_name ?? "";
  }

  const { data: appointment, error } = await supabase.rpc("admin_upsert_appointment", {
    p_appointment_id: null,
    // Guaranteed non-null here: either supplied directly, or just set above
    // after inserting the new customer row (adminCreateAppointmentSchema's
    // refine requires one of the two).
    p_customer_id: customerId as string,
    p_service_id: input.serviceId,
    p_addon_ids: input.addonIds,
    p_start_at: input.startAt,
    p_notes: input.notes ?? null,
    p_status: "confirmed",
  });

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "SLOT_TAKEN", message: "יש כבר תור פעיל אחר בשעה הזו. נא לבחור שעה אחרת." },
        { status: 409 }
      );
    }
    if (error.message?.includes("SERVICE_HAS_NO_DURATION")) {
      return NextResponse.json(
        { error: "SERVICE_HAS_NO_DURATION", message: "לטיפול הזה אין משך זמן מוגדר. נא להשלים בעמוד הטיפולים." },
        { status: 400 }
      );
    }
    if (error.message === "FORBIDDEN" || error.code === "42501") {
      return NextResponse.json({ error: "FORBIDDEN", message: "אין הרשאה לפעולה זו." }, { status: 403 });
    }
    console.error("admin_upsert_appointment failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה. נא לנסות שוב." }, { status: 500 });
  }

  if (customerEmail) {
    const { data: service } = await supabase.from("services").select("name").eq("id", appointment.service_id).single();
    after(() => sendAppointmentNotification({
      type: "appointment_confirmed",
      appointmentId: appointment.id,
      recipientEmail: customerEmail,
      data: {
        customerName,
        serviceName: service?.name ?? "",
        startAt: appointment.start_at,
        price: appointment.final_price,
        address: "הכרמים 104, אופקים",
      },
    }));
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
