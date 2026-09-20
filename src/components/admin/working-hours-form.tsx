"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkingHours } from "@/types/database";

const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

type Row = { dayOfWeek: number; isOpen: boolean; startTime: string; endTime: string };

function toRows(hours: WorkingHours[]): Row[] {
  return Array.from({ length: 7 }, (_, day) => {
    const existing = hours.find((h) => h.day_of_week === day);
    return {
      dayOfWeek: day,
      isOpen: existing?.is_open ?? false,
      startTime: existing?.start_time?.slice(0, 5) ?? "09:00",
      endTime: existing?.end_time?.slice(0, 5) ?? "19:00",
    };
  });
}

export function WorkingHoursForm({ hours }: { hours: WorkingHours[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(hours));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function updateRow(day: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
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
          <div key={row.dayOfWeek} className="flex flex-wrap items-center gap-3 p-3.5">
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
