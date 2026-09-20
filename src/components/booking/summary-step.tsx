import { Button } from "@/components/ui/button";
import { formatDateHe, formatILS, formatTimeHe } from "@/lib/format";
import type { Service } from "@/types/database";
import type { BookingState } from "./types";

export function SummaryStep({
  state,
  addonsById,
  onConfirm,
  onBack,
  onEditDetails,
  isSubmitting,
  submitError,
}: {
  state: BookingState;
  addonsById: Map<string, Service>;
  onConfirm: () => void;
  onBack: () => void;
  onEditDetails: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const { treatment, selectedAddonIds, slot, customer } = state;
  if (!treatment || !slot || !customer) return null;

  const selectedAddons = selectedAddonIds.map((id) => addonsById.get(id)).filter((a): a is Service => !!a);
  const anyRequiresApproval = treatment.requires_approval || selectedAddons.some((a) => a.requires_approval);
  const total = treatment.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-brand text-2xl text-charcoal">בואי נוודא שהכל נכון</h2>
        <p className="mt-1 text-sm text-charcoal-soft">לפני שנשלח את הבקשה, תבדקי שהפרטים מדויקים.</p>
      </div>

      <dl className="flex flex-col divide-y divide-charcoal/10 rounded-[var(--radius-card)] border border-charcoal/10 bg-ivory p-5 text-sm">
        <Row label="טיפול" value={treatment.name} />
        {selectedAddons.length > 0 && (
          <Row label="תוספות" value={selectedAddons.map((a) => a.name).join(", ")} />
        )}
        <Row label="תאריך" value={formatDateHe(slot.slot_start)} />
        <Row label="שעה" value={`${formatTimeHe(slot.slot_start)}–${formatTimeHe(slot.slot_end)}`} />
        <Row label="שם" value={customer.fullName} />
        <Row label="טלפון" value={customer.phone} />
        <Row label="אימייל" value={customer.email} />
        {customer.note && <Row label="הערה" value={customer.note} />}
        <Row label="מחיר משוער" value={formatILS(total)} emphasize />
      </dl>

      {anyRequiresApproval && (
        <p className="rounded-xl bg-dusty-rose/20 p-3 text-xs text-charcoal-soft">
          חלק מהבחירות שלך דורשות אישור ידני ממעיין — הבקשה תישלח לאישור ותקבלי עדכון בהקדם.
        </p>
      )}

      {submitError && <p className="rounded-xl bg-burgundy/10 p-3 text-sm text-burgundy">{submitError}</p>}

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={isSubmitting}>
          חזרה
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" size="lg" onClick={onEditDetails} disabled={isSubmitting}>
            עריכת פרטים
          </Button>
          <Button type="button" size="lg" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "שולח…" : "קביעת התור"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-charcoal-soft">{label}</dt>
      <dd className={emphasize ? "font-medium text-burgundy" : "text-charcoal"}>{value}</dd>
    </div>
  );
}
