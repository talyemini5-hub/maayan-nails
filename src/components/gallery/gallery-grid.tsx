"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GALLERY_CATEGORY_LABELS, GALLERY_CATEGORY_ORDER } from "@/lib/gallery-categories";
import type { GalleryCategory, GalleryItem } from "@/types/database";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const presentCategories = useMemo(
    () => GALLERY_CATEGORY_ORDER.filter((cat) => items.some((i) => i.category === cat)),
    [items]
  );
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | "all">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, filtered.length - 1)));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, filtered.length]);

  if (items.length === 0) {
    return <p className="py-16 text-center text-charcoal-soft">הגלריה מתעדכנת בקרוב — בינתיים אפשר לעקוב באינסטגרם.</p>;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <FilterChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
          הכל
        </FilterChip>
        {presentCategories.map((cat) => (
          <FilterChip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
            {GALLERY_CATEGORY_LABELS[cat]}
          </FilterChip>
        ))}
      </div>

      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
        {filtered.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className={cn(
              "group relative block w-full overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-burgundy/40",
              item.orientation === "portrait" ? "aspect-[3/4]" : item.orientation === "landscape" ? "aspect-[4/3]" : "aspect-square"
            )}
          >
            <Image
              src={item.image_url}
              alt={item.title ?? "עבודה מהגלריה של Maayan Nails"}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 left-4 rounded-full bg-ivory/10 p-2 text-ivory hover:bg-ivory/20"
            aria-label="סגירה"
          >
            <X className="size-6" />
          </button>

          {lightboxIndex < filtered.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? i : i + 1));
              }}
              className="absolute end-4 rounded-full bg-ivory/10 p-2 text-ivory hover:bg-ivory/20"
              aria-label="התמונה הקודמת"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? i : i - 1));
              }}
              className="absolute start-4 rounded-full bg-ivory/10 p-2 text-ivory hover:bg-ivory/20"
              aria-label="התמונה הבאה"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <div className="relative h-[80vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={filtered[lightboxIndex].image_url}
              alt={filtered[lightboxIndex].title ?? "עבודה מהגלריה של Maayan Nails"}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm transition-colors",
        active ? "bg-burgundy text-ivory" : "bg-cream text-charcoal-soft hover:bg-dusty-rose/30"
      )}
    >
      {children}
    </button>
  );
}
