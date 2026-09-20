import { NextResponse } from "next/server";
import { reviewFormSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). */
export async function POST(request: Request) {
  const parsed = reviewFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      customer_name: input.customerName,
      rating: input.rating ?? null,
      content: input.content,
      status: input.status,
      is_demo: false,
      sort_order: input.sortOrder,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error || !review) {
    console.error("review create failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בהוספת הביקורת." }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
