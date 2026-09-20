"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { galleryItemFormSchema } from "@/lib/validation/admin";
import { GALLERY_CATEGORY_LABELS, GALLERY_CATEGORY_ORDER } from "@/lib/gallery-categories";
import type { GalleryItem } from "@/types/database";

type FormInput = z.input<typeof galleryItemFormSchema>;
type FormOutput = z.output<typeof galleryItemFormSchema>;

export function GalleryForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: GalleryItem;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(galleryItemFormSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      category: item?.category ?? "gel_polish",
      imageUrl: item?.image_url ?? "",
      thumbnailUrl: item?.thumbnail_url ?? "",
      orientation: item?.orientation ?? "square",
      isFeatured: item?.is_featured ?? false,
      isPublished: item?.is_published ?? true,
      sortOrder: item?.sort_order ?? 0,
    },
  });

  async function onSubmit(values: FormOutput) {
    setStatus("saving");
    try {
      const res = await fetch(item ? `/api/admin/gallery/${item.id}` : "/api/admin/gallery", {
        method: item ? "PATCH" : "POST",
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
      <TextField label="קישור לתמונה (URL)" error={errors.imageUrl?.message} {...register("imageUrl")} />
      <TextField label="קישור לתמונה ממוזערת (אופציונלי)" error={errors.thumbnailUrl?.message} {...register("thumbnailUrl")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="כותרת (אופציונלי)" error={errors.title?.message} {...register("title")} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal-soft">קטגוריה</span>
          <select
            {...register("category")}
            className="rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
          >
            {GALLERY_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {GALLERY_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TextAreaField label="תיאור (אופציונלי)" error={errors.description?.message} {...register("description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal-soft">כיוון תמונה</span>
          <select
            {...register("orientation")}
            className="rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-[0.95rem] text-charcoal"
          >
            <option value="square">מרובעת</option>
            <option value="portrait">לאורך</option>
            <option value="landscape">לרוחב</option>
          </select>
        </label>
        <TextField label="סדר הצגה" type="number" error={errors.sortOrder?.message} {...register("sortOrder")} />
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-burgundy)]" {...register("isPublished")} />
          מוצג באתר
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-burgundy)]" {...register("isFeatured")} />
          מומלץ
        </label>
      </div>

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
