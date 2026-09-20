"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { reviewFormSchema } from "@/lib/validation/admin";

type FormInput = z.input<typeof reviewFormSchema>;
type FormOutput = z.output<typeof reviewFormSchema>;

export function ReviewForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { customerName: "", rating: 5, content: "", status: "draft", sortOrder: 0 },
  });

  async function onSubmit(values: FormOutput) {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
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
        <TextField label="שם הלקוחה" error={errors.customerName?.message} {...register("customerName")} />
        <TextField label="דירוג (1-5, אופציונלי)" type="number" min={1} max={5} error={errors.rating?.message} {...register("rating")} />
      </div>
      <TextAreaField label="תוכן הביקורת" error={errors.content?.message} {...register("content")} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-charcoal-soft">סטטוס</span>
        <select
          {...register("status")}
          className="rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
        >
          <option value="draft">טיוטה</option>
          <option value="approved">מאושר</option>
          <option value="published">מפורסם</option>
          <option value="hidden">מוסתר</option>
        </select>
      </label>

      {status === "error" && <p className="text-sm text-burgundy">אירעה שגיאה בשמירה. נא לנסות שוב.</p>}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={status === "saving"}>
          ביטול
        </Button>
        <Button type="submit" size="md" disabled={status === "saving"}>
          {status === "saving" ? "שומר…" : "הוספה"}
        </Button>
      </div>
    </form>
  );
}
