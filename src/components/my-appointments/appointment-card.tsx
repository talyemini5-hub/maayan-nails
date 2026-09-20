"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDateHe, formatILS, formatTimeHe } from "@/lib/format";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES, isUpcoming } from "@/lib/appointment-status";
import { DateStep } from "@/components/booking/date-step";
import { TimeStep } from "@/components/booking/time-step";
import type { AvailableSlot } from "@/components/booking/types";
import type { AppointmentWithDetails } from "@/lib/data/appointments";

type Mode = "idle" | "confirm-cancel" | "reschedule-date" | "reschedule-time";

export function AppointmentCard({
  appointment,
  bookingHorizonDays,
}: {
  appointment: AppointmentWithDetails;
  bookingHorizonDays: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<AvailableSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcoming = isUpcoming(appointment.appointment_status, appointment.start_at);
  const total = appointment.final_price ?? appointment.price;

  async function cancelAppointment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "לא ניתן היה לבטל את התור.");
        return;
      }
      setMode("idle");
      router.refresh();
    } catch {
      setError("בעיית תקשורת. נא לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReschedule() {
    if (!newSlot) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStartAt: newSlot.slot_start }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "לא ניתן היה לשנות את מועד התור.");
        return;
      }
      setMode("idle");
      setNewDate(null);
      setNewSlot(null);
      router.refresh();
    } catch {
      setError("בעיית תקשורת. נא לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-card)] border border-charcoal/10 bg-ivory p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-brand text-lg text-charcoal">{appointment.services?.name ?? "טיפול"}</h3>
          <p className="mt-0.5 text-sm text-charcoal-soft">
            {formatDateHe(appointment.start_at)} · {formatTimeHe(appointment.start_at)}–{formatTimeHe(appointment.end_at)}
          </p>
          {appointment.appointment_addons.length > 0 && (
            <p className="mt-1 text-xs text-charcoal-soft">
              תוספות: {appointment.appointment_addons.map((a) => a.name_snapshot).join(", ")}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              APPOINTMENT_STATUS_STYLES[appointment.appointment_status]
            )}
          >
            {APPOINTMENT_STATUS_LABELS[appointment.appointment_status]}
          </span>
          <span className="text-sm font-medium text-burgundy">{formatILS(total)}</span>
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl bg-burgundy/10 p-2.5 text-xs text-burgundy">{error}</p>}

      {upcoming && mode === "idle" && (
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="md" onClick={() => setMode("reschedule-date")}>
            שינוי מועד
          </Button>
          <Button variant="ghost" size="md" onClick={() => setMode("confirm-cancel")}>
            ביטול תור
          </Button>
        </div>
      )}

      {mode === "confirm-cancel" && (
        <div className="mt-4 rounded-2xl bg-cream/60 p-4">
          <p className="text-sm text-charcoal">לבטל את התור הזה? לא ניתן לשחזר לאחר הביטול.</p>
          <div className="mt-3 flex gap-2">
            <Button size="md" variant="secondary" onClick={() => setMode("idle")} disabled={busy}>
              חזרה
            </Button>
            <Button size="md" onClick={cancelAppointment} disabled={busy}>
              {busy ? "מבטל…" : "כן, לבטל את התור"}
            </Button>
          </div>
        </div>
      )}

      {mode === "reschedule-date" && (
        <div className="mt-4 border-t border-charcoal/10 pt-4">
          <DateStep
            serviceId={appointment.service_id}
            selectedDate={newDate}
            onSelect={setNewDate}
            onNext={() => setMode("reschedule-time")}
            onBack={() => setMode("idle")}
            horizonDays={bookingHorizonDays}
          />
        </div>
      )}

      {mode === "reschedule-time" && newDate && (
        <div className="mt-4 border-t border-charcoal/10 pt-4">
          <TimeStep
            serviceId={appointment.service_id}
            date={newDate}
            selectedSlot={newSlot}
            onSelect={setNewSlot}
            onNext={confirmReschedule}
            onBack={() => setMode("reschedule-date")}
            nextLabel="אישור שינוי המועד"
          />
          {busy && <p className="mt-2 text-center text-xs text-charcoal-soft">מעדכן את התור…</p>}
        </div>
      )}
    </article>
  );
}
