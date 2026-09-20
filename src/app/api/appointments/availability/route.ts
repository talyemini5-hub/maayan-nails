import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/appointments/availability?serviceId=...&date=YYYY-MM-DD
 *   -> free time slots for that exact day (get_available_slots RPC)
 * GET /api/appointments/availability?serviceId=...&month=YYYY-MM-01
 *   -> which dates in that month have at least one free slot (get_available_dates RPC)
 *
 * Deliberately dynamic / never cached (see next.config.ts + PWA notes):
 * showing a stale "available" slot that's actually already taken is exactly
 * what the spec forbids.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");

  if (!serviceId || (!date && !month)) {
    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (date) {
    const { data, error } = await supabase.rpc("get_available_slots", { p_date: date, p_service_id: serviceId });
    if (error) {
      console.error("get_available_slots failed", error);
      return NextResponse.json({ error: "AVAILABILITY_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ slots: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase.rpc("get_available_dates", { p_month_start: month!, p_service_id: serviceId });
  if (error) {
    console.error("get_available_dates failed", error);
    return NextResponse.json({ error: "AVAILABILITY_ERROR" }, { status: 500 });
  }
  return NextResponse.json({ dates: (data ?? []).map((d) => d.available_date) }, { headers: { "Cache-Control": "no-store" } });
}
