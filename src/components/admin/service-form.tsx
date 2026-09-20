"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { serviceFormSchema } from "@/lib/validation/admin";
import type { Service } from "@/types/database";

type FormInput = z.input<typeof serviceFormSchema>;
type FormOutput = z.output<typeof serviceFormSchema>;

export function ServiceForm({
  service,
  linkedAddonIds = [],
  availableAddons,
  onSaved,
  onCancel,
}: {
  service?: Service;
  linkedAddonIds?: string[];
  availableAddons: Service[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      kind: service?.kind ?? "treatment",
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service?.price ?? 0,
      priceMax: service?.price_max ?? undefined,
      isPriceFrom: service?.is_price_from ?? false,
      durationMinutes: service?.duration_minutes ?? undefined,
      prepBufferMinutes: service?.prep_buffer_minutes ?? 0,
      isActive: service?.is_active ?? true,
      requiresApproval: service?.requires_approval ?? false,
      sortOrder: service?.sort_order ?? 0,
      allowedAddonIds: linkedAddonIds,
    },
  });

  const kind = watch("kind");
  const selectedAddonIds = watch("allowedAddonIds") ?? [];

  async function onSubmit(values: FormOutput) {
    setStatus("saving");
    try {
      const res = await fetch(service ? `/api/admin/services/${service.id}` : "/api/admin/services", {
        method: service ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-2xl border border-charcoal/10 bg-cream/40 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal-soft">סוג</span>
          <select
            {...register("kind")}
            className="rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
          >
            <option value="treatment">טיפול</option>
            <option value="addon">תוספת</option>
          </select>
        </label>
        <TextField label="שם" error={errors.name?.message} {...register("name")} />
      </div>

      <TextAreaField label="תיאור (אופציונלי)" error={errors.description?.message} {...register("description")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="מחיר (₪)" type="number" error={errors.price?.message} {...register("price")} />
        <TextField label="מחיר מקסימלי (אופציונלי)" type="number" error={errors.priceMax?.message} {...register("priceMax")} />
        <TextField
          label="משך (דקות, אופציונלי לתוספת)"
          type="number"
          error={errors.durationMinutes?.message}
          {...register("durationMinutes")}
        />
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-burgundy)]" {...register("isPriceFrom")} />
          מחיר &quot;החל מ-&quot;
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-burgundy)]" {...register("isActive")} />
          פעיל (מוצג באתר)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-burgundy)]" {...register("requiresApproval")} />
          דורש אישור ידני
        </label>
      </div>

      {kind === "treatment" && availableAddons.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-charcoal-soft">תוספות זמינות לטיפול הזה</p>
          <div className="flex flex-wrap gap-2">
            {availableAddons.map((addon) => {
              const isChecked = selectedAddonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() =>
                    setValue(
                      "allowedAddonIds",
                      isChecked ? selectedAddonIds.filter((id) => id !== addon.id) : [...selectedAddonIds, addon.id]
                    )
                  }
                  className={
                    "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (isChecked ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/15 bg-ivory text-charcoal-soft")
                  }
                >
                  {addon.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {status === "error" && <p className="text-sm text-burgundy">אירעה שגיאה בשמירה. נא לנסות שוב.</p>}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={status === "saving"}>
          ביטול
        </Button>
        <Button type="submit" size="md" disabled={status === "saving"}>
          {status === "saving" ? "שומר…" : "שמירה"}
        </Button>
      </div>
    </form>
  );
}
