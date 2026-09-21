"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkingHours, WorkingHoursBreak } from "@/types/database";

const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

type BreakRange = { startTime: string; endTime: string };

type Row = {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  breaks: BreakRange[];
};

function toRows(hours: WorkingHours[], breaks: WorkingHoursBreak[]): Row[] {
  return Array.from({ length: 7 }, (_, day) => {
    const existing = hours.find((h) => h.day_of_week === day);
    const dayBreaks = breaks
      .filter((b) => b.day_of_week === day)
      .map((b) => ({ startTime: b.start_time.slice(0, 5), endTime: b.end_time.slice(0, 5) }));
    return {
      dayOfWeek: day,
      isOpen: existing?.is_open ?? false,
      startTime: existing?.start_time?.slice(0, 5) ?? "09:00",
      endTime: existing?.end_time?.slice(0, 5) ?? "19:00",
      breaks: dayBreaks,
    };
  });
}

export function WorkingHoursForm({ hours, breaks }: { hours: WorkingHours[]; breaks: WorkingHoursBreak[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(hours, breaks));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function updateRow(day: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  function addBreak(day: number) {
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, breaks: [...r.breaks, { startTime: "12:00", endTime: "13:00" }] } : r))
    );
  }

  function updateBreak(day: number, index: number, patch: Partial<BreakRange>) {
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek === day ? { ...r, breaks: r.breaks.map((b, i) => (i === index ? { ...b, ...patch } : b)) } : r
      )
    );
  }

  function removeBreak(day: number, index: number) {
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, breaks: r.breaks.filter((_, i) => i !== index) } : r))
    );
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/working-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: rows.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            isOpen: r.isOpen,
            startTime: r.isOpen ? r.startTime : null,
            endTime: r.isOpen ? r.endTime : null,
            breaks: r.isOpen ? r.breaks : [],
          })),
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
        {rows.map((row) => (
          <div key={row.dayOfWeek} className="flex flex-col gap-3 p-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex w-28 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isOpen}
                  onChange={(e) => updateRow(row.dayOfWeek, { isOpen: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-burgundy)]"
                />
                {DAY_LABELS[row.dayOfWeek]}
              </label>
              {row.isOpen ? (
                <div className="flex items-center gap-2 text-sm text-charcoal-soft">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { startTime: e.target.value })}
                    className="rounded-lg border border-charcoal/15 bg-ivory px-2 py-1"
                  />
                  <span>עד</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { endTime: e.target.value })}
                    className="rounded-lg border border-charcoal/15 bg-ivory px-2 py-1"
                  />
                </div>
              ) : (
                <span className="text-sm text-charcoal-soft/60">סגור</span>
              )}
            </div>

            {row.isOpen && (
              <div className="flex flex-col gap-2 border-r-2 border-cream pr-4">
                {row.breaks.map((b, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-sm text-charcoal-soft">
                    <span className="text-xs text-charcoal-soft/70">הפסקה {i + 1}:</span>
                    <input
                      type="time"
                      value={b.startTime}
                      onChange={(e) => updateBreak(row.dayOfWeek, i, { startTime: e.target.value })}
                      className="rounded-lg border border-charcoal/15 bg-ivory px-2 py-1"
                    />
                    <span>עד</span>
                    <input
                      type="time"
                      value={b.endTime}
                      onChange={(e) => updateBreak(row.dayOfWeek, i, { endTime: e.target.value })}
                      className="rounded-lg border border-charcoal/15 bg-ivory px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeBreak(row.dayOfWeek, i)}
                      className="rounded-full px-2 py-1 text-xs text-burgundy hover:bg-cream"
                      aria-label="הסרת הפסקה"
                    >
                      הסרה ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBreak(row.dayOfWeek)}
                  className="w-fit rounded-full border border-charcoal/15 px-3 py-1 text-xs text-charcoal-soft hover:bg-cream"
                >
                  + הוספת הפסקה
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "שומר…" : "שמירת שעות עבודה"}
        </Button>
        {status === "saved" && <span className="text-sm text-burgundy">נשמר בהצלחה ✓</span>}
        {status === "error" && <span className="text-sm text-burgundy">שגיאה בשמירה, נא לנסות שוב.</span>}
      </div>
    </div>
  );
}
