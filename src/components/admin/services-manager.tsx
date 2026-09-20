"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceForm } from "@/components/admin/service-form";
import { formatPriceRange } from "@/lib/format";
import type { Service } from "@/types/database";

export function ServicesManager({
  services,
  linkedAddonsByService,
}: {
  services: Service[];
  linkedAddonsByService: Record<string, string[]>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);

  const addons = services.filter((s) => s.kind === "addon" && s.is_active);
  const treatments = services.filter((s) => s.kind === "treatment");
  const otherAddons = services.filter((s) => s.kind === "addon");

  function refresh() {
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }

  async function archive(id: string) {
    setArchiving(id);
    try {
      await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        {!adding && <Button size="md" onClick={() => setAdding(true)}>הוספת שירות חדש</Button>}
      </div>

      {adding && (
        <ServiceForm availableAddons={addons} onSaved={refresh} onCancel={() => setAdding(false)} />
      )}

      <ServiceGroup
        title="טיפולים"
        items={treatments}
        editingId={editingId}
        onEdit={setEditingId}
        addons={addons}
        linkedAddonsByService={linkedAddonsByService}
        onSaved={refresh}
        onCancel={() => setEditingId(null)}
        onArchive={archive}
        archivingId={archiving}
      />

      <ServiceGroup
        title="תוספות"
        items={otherAddons}
        editingId={editingId}
        onEdit={setEditingId}
        addons={addons}
        linkedAddonsByService={linkedAddonsByService}
        onSaved={refresh}
        onCancel={() => setEditingId(null)}
        onArchive={archive}
        archivingId={archiving}
      />
    </div>
  );
}

function ServiceGroup({
  title,
  items,
  editingId,
  onEdit,
  addons,
  linkedAddonsByService,
  onSaved,
  onCancel,
  onArchive,
  archivingId,
}: {
  title: string;
  items: Service[];
  editingId: string | null;
  onEdit: (id: string) => void;
  addons: Service[];
  linkedAddonsByService: Record<string, string[]>;
  onSaved: () => void;
  onCancel: () => void;
  onArchive: (id: string) => void;
  archivingId: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-brand text-lg text-charcoal">{title}</h2>
      {items.map((service) =>
        editingId === service.id ? (
          <ServiceForm
            key={service.id}
            service={service}
            linkedAddonIds={linkedAddonsByService[service.id] ?? []}
            availableAddons={addons}
            onSaved={onSaved}
            onCancel={onCancel}
          />
        ) : (
          <div
            key={service.id}
            className={
              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 " +
              (service.is_active ? "border-charcoal/10 bg-ivory" : "border-charcoal/10 bg-charcoal/5 opacity-60")
            }
          >
            <div>
              <p className="font-medium text-charcoal">
                {service.name} {!service.is_active && <span className="text-xs text-charcoal-soft">(לא פעיל)</span>}
              </p>
              <p className="text-sm text-charcoal-soft">
                {formatPriceRange(service.price, service.price_max, service.is_price_from)}
                {service.requires_approval && " · דורש אישור"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="md" variant="secondary" onClick={() => onEdit(service.id)}>
                עריכה
              </Button>
              {service.is_active && (
                <Button size="md" variant="ghost" onClick={() => onArchive(service.id)} disabled={archivingId === service.id}>
                  {archivingId === service.id ? "מסיר…" : "הסרה"}
                </Button>
              )}
            </div>
          </div>
        )
      )}
    </section>
  );
}
