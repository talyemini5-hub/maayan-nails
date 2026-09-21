"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";
import { formatILS, formatTimeHe, BUSINESS_TIMEZONE } from "@/lib/format";
import type { Customer, Service } from "@/types/database";

type AvailableSlot = { slot_start: string; slot_end: string };

function todayStr() {
  return formatInTimeZone(new Date(), BUSINESS_TIMEZONE, "yyyy-MM-dd");
}

export function NewAppointmentForm({
  treatments,
  addonsByService,
  customers,
  bookingHorizonDays,
}: {
  treatments: Service[];
  addonsByService: Record<string, Service[]>;
  customers: Customer[];
  bookingHorizonDays: number;
}) {
  const router = useRouter();

  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [treatmentId, setTreatmentId] = useState<string>("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = useMemo(() => todayStr(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + bookingHorizonDays);
    return formatInTimeZone(d, BUSINESS_TIMEZONE, "yyyy-MM-dd");
  }, [bookingHorizonDays]);

  const selectedTreatment = treatments.find((t) => t.id === treatmentId) ?? null;
  const availableAddons = treatmentId ? (addonsByService[treatmentId] ?? []) : [];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim();
    if (!q) return customers.slice(0, 20);
    return customers
      .filter((c) => c.full_name.includes(q) || (c.phone ?? "").includes(q) || (c.email ?? "").includes(q))
      .slice(0, 20);
  }, [customers, customerSearch]);

  const total =
    (selectedTreatment?.price ?? 0) +
    addonIds.reduce((sum, id) => sum + (availableAddons.find((a) => a.id === id)?.price ?? 0), 0);

  function onSelectTreatment(id: string) {
    setTreatmentId(id);
    setAddonIds([]);
    setDate("");
    setSlots(null);
    setSelectedSlot(null);
  }

  function onSelectDate(value: string) {
    setDate(value);
    setSelectedSlot(null);
    setSlots(null);
    setSlotsError(false);
    if (!value || !treatmentId) return;
    fetch(`/api/appointments/availability?serviceId=${treatmentId}&date=${value}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { slots: AvailableSlot[] }) => setSlots(data.slots))
      .catch(() => setSlotsError(true));
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  const canSubmit =
    !!selectedSlot &&
    !!treatmentId &&
    (customerMode === "existing" ? !!selectedCustomerId : newFullName.trim().length >= 2 && newPhone.trim().length >= 9);

  async function handleSubmit() {
    if (!canSubmit || !selectedSlot) return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerMode === "existing" ? selectedCustomerId : null,
          newCustomer:
            customerMode === "new" ? { fullName: newFullName, phone: newPhone, email: newEmail || null } : null,
          serviceId: treatmentId,
          addonIds,
          startAt: selectedSlot.slot_start,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.message ?? "אירעה שגיאה. נא לנסות שוב.");
        return;
      }
      router.push("/admin/appointments");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("בעיית תקשורת. נא לנסות שוב.");
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-charcoal/10 bg-ivory p-5">
      {/* Customer */}
      <section className="flex flex-col gap-3">
        <h2 className="font-brand text-lg text-charcoal">לקוחה</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCustomerMode("existing")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              customerMode === "existing" ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/15 text-charcoal-soft"
            )}
          >
            לקוחה קיימת
          </button>
          <button
            type="button"
            onClick={() => setCustomerMode("new")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              customerMode === "new" ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/15 text-charcoal-soft"
            )}
          >
            לקוחה חדשה
          </button>
        </div>

        {customerMode === "existing" ? (
          selectedCustomer ? (
            <div className="flex items-center justify-between rounded-xl bg-cream/60 p-3 text-sm">
              <span>
                <strong className="text-charcoal">{selectedCustomer.full_name}</strong>
                {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="text-xs text-burgundy hover:underline"
              >
                שינוי
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <TextField
                label="חיפוש לפי שם או טלפון"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="הקלידי שם או טלפון…"
              />
              <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-xl border border-charcoal/10 p-1.5">
                {filteredCustomers.length === 0 && (
                  <p className="p-2 text-xs text-charcoal-soft">לא נמצאו לקוחות. אפשר לעבור ל&quot;לקוחה חדשה&quot;.</p>
                )}
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="rounded-lg px-3 py-2 text-right text-sm hover:bg-cream"
                  >
                    <span className="font-medium text-charcoal">{c.full_name}</span>
                    <span className="text-charcoal-soft"> · {c.phone ?? "אין טלפון"}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="שם מלא" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
            <TextField label="טלפון" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <TextField
              label="אימייל (אופציונלי)"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Treatment + addons */}
      <section className="flex flex-col gap-3">
        <h2 className="font-brand text-lg text-charcoal">טיפול</h2>
        <select
          value={treatmentId}
          onChange={(e) => onSelectTreatment(e.target.value)}
          className="rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
        >
          <option value="">בחירת טיפול…</option>
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {formatILS(t.price)}
            </option>
          ))}
        </select>

        {treatmentId && availableAddons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableAddons.map((addon) => {
              const checked = addonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    checked ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/15 bg-ivory text-charcoal-soft"
                  )}
                >
                  {addon.name} (+{formatILS(addon.price)})
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Date + time */}
      {treatmentId && (
        <section className="flex flex-col gap-3">
          <h2 className="font-brand text-lg text-charcoal">תאריך ושעה</h2>
          <input
            type="date"
            min={today}
            max={maxDate}
            value={date}
            onChange={(e) => onSelectDate(e.target.value)}
            className="w-fit rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
          />

          {date && slots === null && !slotsError && <p className="text-sm text-charcoal-soft">טוען שעות פנויות…</p>}
          {slotsError && <p className="text-sm text-burgundy">שגיאה בטעינת שעות פנויות.</p>}
          {slots !== null && slots.length === 0 && (
            <p className="text-sm text-charcoal-soft">אין שעות פנויות בתאריך הזה.</p>
          )}
          {slots && slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.slot_start === slot.slot_start;
                return (
                  <button
                    key={slot.slot_start}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "rounded-xl border py-2 text-sm font-medium transition-colors",
                      isSelected ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/10 bg-ivory text-charcoal hover:border-burgundy/40"
                    )}
                  >
                    {formatTimeHe(slot.slot_start)}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <TextAreaField label="הערות (אופציונלי)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {selectedTreatment && (
        <p className="text-sm text-charcoal-soft">
          סה&quot;כ: <span className="font-medium text-burgundy">{formatILS(total)}</span>
        </p>
      )}

      {errorMessage && <p className="text-sm text-burgundy">{errorMessage}</p>}

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={() => router.push("/admin/appointments")}>
          ביטול
        </Button>
        <Button size="lg" disabled={!canSubmit || status === "submitting"} onClick={handleSubmit}>
          {status === "submitting" ? "קובעת…" : "קביעת התור"}
        </Button>
      </div>
    </div>
  );
}
