"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { businessSettingsSchema } from "@/lib/validation/admin";
import type { z } from "zod";
import type { AvailabilitySettings, BusinessInfo, PolicySettings } from "@/lib/data/business-settings";

// `z.coerce.number()` fields (availability/policies) make the pre-parse
// ("input") shape differ from the post-parse ("output") shape — react-hook-form
// needs both: inputs type the form fields/defaultValues, output types what
// handleSubmit's callback actually receives after zod has coerced everything.
type FormInput = z.input<typeof businessSettingsSchema>;
type FormOutput = z.output<typeof businessSettingsSchema>;

export function SettingsForm({
  businessInfo,
  availability,
  policies,
}: {
  businessInfo: BusinessInfo;
  availability: AvailabilitySettings;
  policies: PolicySettings;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: { business_info: businessInfo, availability, policies },
  });

  async function onSubmit(values: FormOutput) {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-brand text-lg text-charcoal">פרטי העסק</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="שם העסק" error={errors.business_info?.name?.message} {...register("business_info.name")} />
          <TextField label="כתובת" error={errors.business_info?.address?.message} {...register("business_info.address")} />
          <TextField label="טלפון" error={errors.business_info?.phone?.message} {...register("business_info.phone")} />
          <TextField
            label="וואטסאפ (בפורמט בינלאומי, לדוגמה 972501234567+)"
            error={errors.business_info?.whatsapp_intl?.message}
            {...register("business_info.whatsapp_intl")}
          />
          <TextField
            label="קישור אינסטגרם"
            error={errors.business_info?.instagram_url?.message}
            {...register("business_info.instagram_url")}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-brand text-lg text-charcoal">זמינות</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="מרווח בין שעות (בדקות)"
            type="number"
            error={errors.availability?.slot_interval_minutes?.message}
            {...register("availability.slot_interval_minutes")}
          />
          <TextField
            label="עד כמה ימים קדימה ניתן לקבוע"
            type="number"
            error={errors.availability?.booking_horizon_days?.message}
            {...register("availability.booking_horizon_days")}
          />
          <TextField
            label="הודעה קצרה מדי (שעות) — מעבר לאישור ידני"
            type="number"
            error={errors.availability?.short_notice_hours?.message}
            {...register("availability.short_notice_hours")}
          />
          <TextField
            label="זמן החזקת שיבוץ זמני (בדקות)"
            type="number"
            error={errors.availability?.hold_duration_minutes?.message}
            {...register("availability.hold_duration_minutes")}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-brand text-lg text-charcoal">מדיניות</legend>
        <TextField
          label="חלון ביטול/שינוי מועד (שעות לפני התור)"
          type="number"
          className="sm:max-w-xs"
          error={errors.policies?.reschedule_cutoff_hours?.message}
          {...register("policies.reschedule_cutoff_hours")}
        />
        <TextAreaField label="טקסט אחריות" error={errors.policies?.warranty_text?.message} {...register("policies.warranty_text")} />
        <TextAreaField
          label="מדיניות ציור/קישוט"
          error={errors.policies?.nail_art_policy_text?.message}
          {...register("policies.nail_art_policy_text")}
        />
        <TextAreaField
          label="מדיניות ביטולים (מוצג ללקוחה בקביעת תור)"
          error={errors.policies?.cancellation_policy_text?.message}
          {...register("policies.cancellation_policy_text")}
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={status === "saving"}>
          {status === "saving" ? "שומר…" : "שמירת הגדרות"}
        </Button>
        {status === "saved" && <span className="text-sm text-burgundy">נשמר בהצלחה ✓</span>}
        {status === "error" && <span className="text-sm text-burgundy">שגיאה בשמירה, נא לנסות שוב.</span>}
      </div>
    </form>
  );
}
