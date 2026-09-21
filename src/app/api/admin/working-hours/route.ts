import { NextResponse } from "next/server";
import { z } from "zod";
import { workingHoursDaySchema } from "@/lib/validation/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({ days: z.array(workingHoursDaySchema).length(7) });

/** Admin-only (see proxy.ts). Replaces all 7 working_hours rows, and the
 * full set of break windows, in one go — the form always submits the
 * complete week, so a wholesale replace is the simplest correct approach. */
export async function PUT(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const rows = parsed.data.days.map((d) => ({
    day_of_week: d.dayOfWeek,
    is_open: d.isOpen,
    start_time: d.isOpen ? d.startTime : null,
    end_time: d.isOpen ? d.endTime : null,
  }));

  const { error } = await supabase.from("working_hours").upsert(rows, { onConflict: "day_of_week" });
  if (error) {
    console.error("working_hours upsert failed", error);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בשמירת שעות העבודה." }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("working_hours_breaks").delete().gte("day_of_week", 0);
  if (deleteError) {
    console.error("working_hours_breaks delete failed", deleteError);
    return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בשמירת שעות העבודה." }, { status: 500 });
  }

  const breakRows = parsed.data.days.flatMap((d) =>
    d.isOpen ? d.breaks.map((b) => ({ day_of_week: d.dayOfWeek, start_time: b.startTime, end_time: b.endTime })) : []
  );
  if (breakRows.length > 0) {
    const { error: insertError } = await supabase.from("working_hours_breaks").insert(breakRows);
    if (insertError) {
      console.error("working_hours_breaks insert failed", insertError);
      return NextResponse.json({ error: "UNKNOWN", message: "אירעה שגיאה בשמירת שעות העבודה." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
