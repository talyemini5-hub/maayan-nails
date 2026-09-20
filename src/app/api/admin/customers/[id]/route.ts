import { NextResponse } from "next/server";
import { customerNotesUpdateSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). Notes-only update. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = customerNotesUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .update({ notes: parsed.data.notes ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error || !customer) {
    console.error("customer notes update failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בעדכון ההערות." }, { status: 500 });
  }

  return NextResponse.json({ customer });
}
