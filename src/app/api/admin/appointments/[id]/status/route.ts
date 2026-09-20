import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  return NextResponse.json({ appointment: data });
}
