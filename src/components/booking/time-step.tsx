"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDateHe, formatTimeHe } from "@/lib/format";
import type { AvailableSlot } from "./types";

export function TimeStep({
  serviceId,
  date,
  selectedSlot,
  onSelect,
  onNext,
  onBack,
  nextLabel = "המשך",
}: {
  serviceId: string;
  date: string;
  selectedSlot: AvailableSlot | null;
  onSelect: (slot: AvailableSlot) => void;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
}) {
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // `date`/`serviceId` never change while this component stays mounted — the
    // parent wizard fully unmounts and remounts TimeStep whenever a different
    // date is chosen — so the initial `useState` values above already act as
    // the "reset", and this effect only ever needs to populate them once.
    let cancelled = false;
    fetch(`/api/appointments/availability?serviceId=${serviceId}&date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { slots: AvailableSlot[] }) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-brand text-2xl text-charcoal">באיזו שעה?</h2>
        <p className="mt-1 text-sm text-charcoal-soft">{formatDateHe(`${date}T00:00:00+02:00`)}</p>
      </div>

      {slots === null && !error && <p className="text-sm text-charcoal-soft">טוען שעות פנויות…</p>}
      {error && <p className="text-sm text-burgundy">שגיאה בטעינת השעות. נא לנסות שוב.</p>}
      {slots !== null && slots.length === 0 && (
        <p className="text-sm text-charcoal-soft">אין שעות פנויות בתאריך הזה. נא לבחור תאריך אחר.</p>
      )}

      {slots && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.slot_start === slot.slot_start;
            return (
              <button
                key={slot.slot_start}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-burgundy/40",
                  isSelected
                    ? "border-burgundy bg-burgundy text-ivory"
                    : "border-charcoal/10 bg-ivory text-charcoal hover:border-burgundy/40"
                )}
              >
                {formatTimeHe(slot.slot_start)}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" size="lg" onClick={onBack}>
          חזרה
        </Button>
        <Button size="lg" disabled={!selectedSlot} onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
