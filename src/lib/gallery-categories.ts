import type { GalleryCategory } from "@/types/database";

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  gel_polish: "לק ג׳ל",
  extensions: "בנייה",
  french: "פרנץ׳",
  nail_art: "ציור וקישוט",
  before_after: "לפני / אחרי",
  special: "מיוחד",
};

export const GALLERY_CATEGORY_ORDER: GalleryCategory[] = [
  "gel_polish",
  "extensions",
  "french",
  "nail_art",
  "before_after",
  "special",
];
