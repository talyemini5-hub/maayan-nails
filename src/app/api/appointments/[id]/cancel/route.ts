import { NextResponse, after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { data: customer } = await supabase.from("customers").select("id").eq("profile_id", user.id).single();
  if (!customer) return NextResponse.json({ error: "NO_CUSTOMER_RECORD" }, { status: 403 });

  const { data: appointment, error } = await supabase.rpc("customer_cancel_appointment", {
    p_appointment_id: id,
    p_customer_id: customer.id,
  });

  if (error) {
    if (error.message?.includes("CUTOFF_PASSED")) {
      return NextResponse.json(
        {
          error: "CUTOFF_PASSED",
          message: "לא ניתן לבטל תור בפחות משעתיים לפני המועד. נא ליצור קשר ישיר בוואטסאפ.",
        },
        { status: 409 }
      );
    }
    if (error.message?.includes("APPOINTMENT_NOT_FOUND")) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה. נא לנסות שוב." }, { status: 500 });
  }

  const { data: service } = await supabase.from("services").select("name").eq("id", appointment.service_id).single();
  const { data: customerRow } = await supabase.from("customers").select("full_name, email").eq("id", customer.id).single();
  if (customerRow?.email) {
    const recipientEmail = customerRow.email;
    after(() => sendAppointmentNotification({
      type: "appointment_cancelled",
      appointmentId: appointment.id,
      recipientEmail,
      data: {
        customerName: customerRow.full_name,
        serviceName: service?.name ?? "",
        startAt: appointment.start_at,
        price: appointment.final_price,
        address: "הכרמים 104, אופקים",
      },
    }));
  }

  return NextResponse.json({ appointment });
}
