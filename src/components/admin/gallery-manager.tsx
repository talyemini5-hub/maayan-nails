"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GalleryForm } from "@/components/admin/gallery-form";
import { GALLERY_CATEGORY_LABELS } from "@/lib/gallery-categories";
import type { GalleryItem } from "@/types/database";

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }

  async function remove(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        {!adding && <Button size="md" onClick={() => setAdding(true)}>הוספת תמונה</Button>}
      </div>

      {adding && <GalleryForm onSaved={refresh} onCancel={() => setAdding(false)} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="col-span-full">
              <GalleryForm item={item} onSaved={refresh} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-charcoal/10 bg-ivory p-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered URLs can be any host, so next/image's remotePatterns allowlist doesn't fit here */}
                <img src={item.image_url} alt={item.title ?? ""} className="h-full w-full object-cover" />
                {!item.is_published && (
                  <span className="absolute right-2 top-2 rounded-full bg-charcoal/70 px-2 py-0.5 text-[0.65rem] text-ivory">
                    מוסתר
                  </span>
                )}
                {item.is_featured && (
                  <span className="absolute left-2 top-2 rounded-full bg-rose-gold px-2 py-0.5 text-[0.65rem] text-charcoal">
                    מומלץ
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-charcoal-soft">{GALLERY_CATEGORY_LABELS[item.category]}</p>
              <div className="flex gap-1.5">
                <Button size="md" variant="secondary" className="h-8 flex-1 px-2 text-xs" onClick={() => setEditingId(item.id)}>
                  עריכה
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  className="h-8 flex-1 px-2 text-xs"
                  onClick={() => remove(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? "מוחק…" : "מחיקה"}
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {items.length === 0 && !adding && <p className="text-sm text-charcoal-soft">אין עדיין תמונות בגלריה.</p>}
    </div>
  );
}
