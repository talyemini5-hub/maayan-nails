"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDateHe, formatILS, formatTimeHe } from "@/lib/format";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from "@/lib/appointment-status";
import type { AdminAppointmentRow } from "@/lib/data/admin-appointments";
import type { AppointmentStatus } from "@/types/database";

export function AdminAppointmentRowCard({ appointment }: { appointment: AdminAppointmentRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: AppointmentStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "אירעה שגיאה.");
        return;
      }
      router.refresh();
    } catch {
      setError("בעיית תקשורת. נא לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  const isPending = appointment.appointment_status === "pending_approval";
  const isFinal = ["completed", "cancelled", "declined", "no_show"].includes(appointment.appointment_status);

  return (
    <article className="rounded-2xl border border-charcoal/10 bg-ivory p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-charcoal">{appointment.customers?.full_name ?? "לקוחה"}</p>
          <p className="text-sm text-charcoal-soft">
            {appointment.services?.name} · {formatDateHe(appointment.start_at)} · {formatTimeHe(appointment.start_at)}–
            {formatTimeHe(appointment.end_at)}
          </p>
          {appointment.appointment_addons.length > 0 && (
            <p className="text-xs text-charcoal-soft">
              תוספות: {appointment.appointment_addons.map((a) => a.name_snapshot).join(", ")}
            </p>
          )}
          <p className="text-xs text-charcoal-soft">
            {appointment.customers?.phone} · {appointment.customers?.email}
          </p>
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
          <span className="text-sm font-medium text-burgundy">{formatILS(appointment.final_price)}</span>
        </div>
      </div>

      {appointment.notes && <p className="mt-2 rounded-lg bg-cream/60 p-2 text-xs text-charcoal-soft">{appointment.notes}</p>}
      {error && <p className="mt-2 text-xs text-burgundy">{error}</p>}

      {!isFinal && (
        <div className="mt-3 flex flex-wrap gap-2">
          {isPending ? (
            <>
              <Button size="md" onClick={() => setStatus("confirmed")} disabled={busy}>
                אישור הבקשה
              </Button>
              <Button size="md" variant="ghost" onClick={() => setStatus("declined")} disabled={busy}>
                דחיית הבקשה
              </Button>
            </>
          ) : (
            <>
              <Button size="md" variant="secondary" onClick={() => setStatus("completed")} disabled={busy}>
                סימון כהושלם
              </Button>
              <Button size="md" variant="ghost" onClick={() => setStatus("no_show")} disabled={busy}>
                לא הגיעה
              </Button>
              <Button size="md" variant="ghost" onClick={() => setStatus("cancelled")} disabled={busy}>
                ביטול
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
