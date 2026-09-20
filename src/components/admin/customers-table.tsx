"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatILS } from "@/lib/format";
import type { Customer } from "@/types/database";

export type CustomerWithStats = Customer & {
  appointmentCount: number;
  completedCount: number;
  totalSpent: number;
  lastVisit: string | null;
};

export function CustomersTable({ customers }: { customers: CustomerWithStats[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(customer: CustomerWithStats) {
    setEditingId(customer.id);
    setDraftNotes(customer.notes ?? "");
  }

  async function saveNotes(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draftNotes }),
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {customers.map((customer) => (
        <div key={customer.id} className="flex flex-col gap-3 rounded-2xl border border-charcoal/10 bg-ivory p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-charcoal">{customer.full_name}</p>
              <p className="text-sm text-charcoal-soft">
                {[customer.phone, customer.email].filter(Boolean).join(" · ") || "אין פרטי קשר"}
              </p>
            </div>
            <div className="text-left text-sm text-charcoal-soft">
              <p>{customer.appointmentCount} תורים · {customer.completedCount} הושלמו</p>
              <p>סה&quot;כ הכנסה: {formatILS(customer.totalSpent)}</p>
              {customer.lastVisit && <p>ביקור אחרון: {customer.lastVisit}</p>}
            </div>
          </div>

          {editingId === customer.id ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={3}
                className="rounded-2xl border border-charcoal/15 bg-cream/40 px-4 py-3 text-sm text-charcoal"
                placeholder="הערות פנימיות על הלקוחה…"
              />
              <div className="flex gap-2">
                <Button size="md" variant="secondary" className="h-9 px-3 text-xs" onClick={() => setEditingId(null)} disabled={saving}>
                  ביטול
                </Button>
                <Button size="md" className="h-9 px-3 text-xs" onClick={() => saveNotes(customer.id)} disabled={saving}>
                  {saving ? "שומר…" : "שמירת הערות"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-charcoal-soft">{customer.notes || "אין הערות."}</p>
              <Button size="md" variant="ghost" className="h-9 shrink-0 px-3 text-xs" onClick={() => startEdit(customer)}>
                עריכת הערות
              </Button>
            </div>
          )}
        </div>
      ))}
      {customers.length === 0 && <p className="text-sm text-charcoal-soft">אין עדיין לקוחות רשומות.</p>}
    </div>
  );
}
