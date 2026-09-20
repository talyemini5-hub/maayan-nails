import { NextResponse } from "next/server";
import { serviceFormSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). */
export async function POST(request: Request) {
  const parsed = serviceFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: service, error } = await supabase
    .from("services")
    .insert({
      kind: input.kind,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      price_max: input.priceMax ?? null,
      is_price_from: input.isPriceFrom,
      duration_minutes: input.durationMinutes ?? null,
      prep_buffer_minutes: input.prepBufferMinutes,
      image_url: input.imageUrl ?? null,
      is_active: input.isActive,
      requires_approval: input.requiresApproval,
      sort_order: input.sortOrder,
    })
    .select()
    .single();

  if (error || !service) {
    console.error("service insert failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה ביצירת השירות." }, { status: 500 });
  }

  if (input.kind === "treatment" && input.allowedAddonIds.length > 0) {
    const links = input.allowedAddonIds.map((addonId) => ({ service_id: service.id, addon_id: addonId }));
    const { error: linkError } = await supabase.from("service_addons").insert(links);
    if (linkError) console.error("service_addons insert failed", linkError);
  }

  return NextResponse.json({ service }, { status: 201 });
}
