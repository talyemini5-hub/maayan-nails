import { NextResponse } from "next/server";
import { galleryItemFormSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = galleryItemFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("gallery")
    .update({
      title: input.title ?? null,
      description: input.description ?? null,
      category: input.category,
      image_url: input.imageUrl,
      thumbnail_url: input.thumbnailUrl ?? null,
      orientation: input.orientation,
      is_featured: input.isFeatured,
      is_published: input.isPublished,
      sort_order: input.sortOrder,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !item) {
    console.error("gallery item update failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בעדכון התמונה." }, { status: 500 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("gallery").delete().eq("id", id);

  if (error) {
    console.error("gallery item delete failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה במחיקת התמונה." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
