import type { Metadata } from "next";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { getAllReviewsForAdmin } from "@/lib/data/admin-reviews";

export const metadata: Metadata = { title: "ביקורות | ניהול", robots: { index: false, follow: false } };

export default async function AdminReviewsPage() {
  const reviews = await getAllReviewsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">ביקורות</h1>
        <p className="mt-1 text-sm text-charcoal-soft">רק ביקורות במצב &quot;מפורסם&quot; מוצגות באתר הציבורי.</p>
      </div>
      <ReviewsManager reviews={reviews} />
    </div>
  );
}
