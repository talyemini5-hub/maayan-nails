import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendAppointmentNotification } from "@/lib/email/send";

const bodySchema = z.object({ newStartAt: z.string().datetime({ offset: true }) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { data: customer } = await supabase.from("customers").select("id, full_name, email").eq("profile_id", user.id).single();
  if (!customer) return NextResponse.json({ error: "NO_CUSTOMER_RECORD" }, { status: 403 });

  const { data: appointment, error } = await supabase.rpc("customer_reschedule_appointment", {
    p_appointment_id: id,
    p_customer_id: customer.id,
    p_new_start_at: parsed.data.newStartAt,
  });

  if (error) {
    if (error.code === "23P01") {
      return NextResponse.json({ error: "SLOT_TAKEN", message: "השעה הזו נתפסה. נא לבחור שעה אחרת." }, { status: 409 });
    }
    if (error.message?.includes("CUTOFF_PASSED")) {
      return NextResponse.json(
        { error: "CUTOFF_PASSED", message: "לא ניתן לשנות מועד בפחות משעתיים לפני התור. נא ליצור קשר ישיר בוואטסאפ." },
        { status: 409 }
      );
    }
    if (error.message?.includes("APPOINTMENT_NOT_FOUND")) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה. נא לנסות שוב." }, { status: 500 });
  }

  const { data: service } = await supabase.from("services").select("name").eq("id", appointment.service_id).single();
  if (customer.email) {
    const recipientEmail = customer.email;
    after(() => sendAppointmentNotification({
      type: "appointment_rescheduled",
      appointmentId: appointment.id,
      recipientEmail,
      data: {
        customerName: customer.full_name,
        serviceName: service?.name ?? "",
        startAt: appointment.start_at,
        price: appointment.final_price,
        address: "הכרמים 104, אופקים",
      },
    }));
  }

  return NextResponse.json({ appointment });
}
