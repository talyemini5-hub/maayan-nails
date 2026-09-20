import { NextResponse } from "next/server";
import { galleryItemFormSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). */
export async function POST(request: Request) {
  const parsed = galleryItemFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("gallery")
    .insert({
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
    .select()
    .single();

  if (error || !item) {
    console.error("gallery item create failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בהוספת התמונה." }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
