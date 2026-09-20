import { NextResponse } from "next/server";
import { businessSettingsSchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Admin-only (see proxy.ts). Upserts the three business_settings rows in one call. */
export async function PUT(request: Request) {
  const parsed = businessSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const rows = [
    { key: "business_info", value: parsed.data.business_info },
    { key: "availability", value: parsed.data.availability },
    { key: "policies", value: parsed.data.policies },
  ];

  const { error } = await supabase.from("business_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    console.error("business_settings upsert failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בשמירת ההגדרות." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
