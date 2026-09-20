"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { BUSINESS_TIMEZONE } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function todayStr() {
  return formatInTimeZone(new Date(), BUSINESS_TIMEZONE, "yyyy-MM-dd");
}

export function DateStep({
  serviceId,
  selectedDate,
  onSelect,
  onNext,
  onBack,
  horizonDays,
}: {
  serviceId: string;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
  horizonDays: number;
}) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [availableDates, setAvailableDates] = useState<Set<string> | null>(null);
  const [error, setError] = useState(false);
  const loading = availableDates === null && !error;

  const today = useMemo(() => todayStr(), []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + horizonDays);
    return formatInTimeZone(d, BUSINESS_TIMEZONE, "yyyy-MM-dd");
  }, [horizonDays]);

  // Changing months resets the availability state right here, in the click
  // handler — not inside the effect below — so the effect only ever
  // *populates* state from the fetch response instead of resetting it too.
  function changeMonth(deltaMonths: number) {
    setMonthCursor((m) => addMonths(m, deltaMonths));
    setAvailableDates(null);
    setError(false);
  }

  useEffect(() => {
    let cancelled = false;
    const monthStart = format(monthCursor, "yyyy-MM-01");
    fetch(`/api/appointments/availability?serviceId=${serviceId}&month=${monthStart}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { dates: string[] }) => {
        if (!cancelled) setAvailableDates(new Set(data.dates));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, monthCursor]);

  const days = eachDayOfInterval({ start: startOfMonth(monthCursor), end: endOfMonth(monthCursor) });
  const leadingBlanks = getDay(startOfMonth(monthCursor));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-brand text-2xl text-charcoal">באיזה תאריך נוח לך?</h2>
        <p className="mt-1 text-sm text-charcoal-soft">תאריכים מודגשים הם כאלה שיש בהם שעות פנויות.</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-charcoal/10 bg-ivory p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={format(monthCursor, "yyyy-MM") <= format(new Date(), "yyyy-MM")}
            className="rounded-full p-2 text-charcoal-soft transition-colors hover:bg-cream disabled:opacity-30"
            aria-label="חודש קודם"
          >
            ‹
          </button>
          <span className="font-brand text-lg text-charcoal">{format(monthCursor, "MMMM yyyy", { locale: he })}</span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full p-2 text-charcoal-soft transition-colors hover:bg-cream"
            aria-label="חודש הבא"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-charcoal-soft/70">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isPast = dateStr < today;
            const isBeyondHorizon = dateStr > maxDateStr;
            const isAvailable = !loading && !error && availableDates?.has(dateStr);
            const isDisabled = isPast || isBeyondHorizon || !isAvailable;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelect(dateStr)}
                className={cn(
                  "aspect-square rounded-xl text-sm transition-colors focus-visible:ring-2 focus-visible:ring-burgundy/40",
                  isSelected && "bg-burgundy text-ivory font-medium",
                  !isSelected && !isDisabled && "bg-cream text-charcoal hover:bg-dusty-rose/40 font-medium",
                  isDisabled && "text-charcoal-soft/30"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {loading && <p className="mt-3 text-center text-xs text-charcoal-soft">טוען זמינות…</p>}
        {error && <p className="mt-3 text-center text-xs text-burgundy">שגיאה בטעינת זמינות. נא לנסות שוב.</p>}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" size="lg" onClick={onBack}>
          חזרה
        </Button>
        <Button size="lg" disabled={!selectedDate} onClick={onNext}>
          המשך
        </Button>
      </div>
    </div>
  );
}
