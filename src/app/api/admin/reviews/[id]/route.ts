import { NextResponse } from "next/server";
import { reviewStatusUpdateSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). Status-only update (moderation actions). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = reviewStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const { status } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: review, error } = await supabase
    .from("reviews")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !review) {
    console.error("review status update failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בעדכון הביקורת." }, { status: 500 });
  }

  return NextResponse.json({ review });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("review delete failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה במחיקת הביקורת." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
