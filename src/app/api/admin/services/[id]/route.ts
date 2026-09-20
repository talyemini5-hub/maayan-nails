import { NextResponse } from "next/server";
import { serviceFormSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = serviceFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: service, error } = await supabase
    .from("services")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (error || !service) {
    console.error("service update failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בעדכון השירות." }, { status: 500 });
  }

  if (input.kind === "treatment") {
    // Resync service_addons links to exactly the submitted set.
    await supabase.from("service_addons").delete().eq("service_id", id);
    if (input.allowedAddonIds.length > 0) {
      const links = input.allowedAddonIds.map((addonId) => ({ service_id: id, addon_id: addonId }));
      const { error: linkError } = await supabase.from("service_addons").insert(links);
      if (linkError) console.error("service_addons resync failed", linkError);
    }
  }

  return NextResponse.json({ service });
}

/**
 * Soft-archive rather than a hard delete: past appointments reference
 * service_id, so removing the row would break history. Setting is_active
 * false + archived_at just hides it from booking and admin "active" lists.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("service archive failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בהסרת השירות." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
