import type { Metadata } from "next";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { getAllGalleryForAdmin } from "@/lib/data/admin-gallery";

export const metadata: Metadata = { title: "גלריה | ניהול", robots: { index: false, follow: false } };

export default async function AdminGalleryPage() {
  const items = await getAllGalleryForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">גלריה</h1>
        <p className="mt-1 text-sm text-charcoal-soft">
          הוספת תמונות מתבצעת כרגע דרך קישור (URL) לתמונה מאוחסנת בענן — ללא העלאת קבצים ישירה.
        </p>
      </div>
      <GalleryManager items={items} />
    </div>
  );
}
