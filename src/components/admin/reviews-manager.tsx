"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/admin/review-form";
import type { Review, ReviewStatus } from "@/types/database";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "טיוטה",
  approved: "מאושר",
  published: "מפורסם",
  hidden: "מוסתר",
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  draft: "bg-charcoal/10 text-charcoal-soft",
  approved: "bg-rose-gold/20 text-charcoal",
  published: "bg-burgundy/15 text-burgundy",
  hidden: "bg-charcoal/10 text-charcoal-soft line-through",
};

export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: ReviewStatus) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function refresh() {
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        {!adding && <Button size="md" onClick={() => setAdding(true)}>הוספת ביקורת</Button>}
      </div>

      {adding && <ReviewForm onSaved={refresh} onCancel={() => setAdding(false)} />}

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-3 rounded-2xl border border-charcoal/10 bg-ivory p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-charcoal">
                  {review.customer_name} {review.rating && <span className="text-rose-gold">{"★".repeat(review.rating)}</span>}
                </p>
                <p className="mt-1 text-sm text-charcoal-soft">{review.content}</p>
              </div>
              <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs " + STATUS_STYLES[review.status]}>
                {STATUS_LABELS[review.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {review.status !== "published" && (
                <Button
                  size="md"
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  onClick={() => setStatus(review.id, "published")}
                  disabled={busyId === review.id}
                >
                  פרסום
                </Button>
              )}
              {review.status !== "hidden" && (
                <Button
                  size="md"
                  variant="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={() => setStatus(review.id, "hidden")}
                  disabled={busyId === review.id}
                >
                  הסתרה
                </Button>
              )}
              <Button
                size="md"
                variant="ghost"
                className="h-9 px-3 text-xs text-burgundy"
                onClick={() => remove(review.id)}
                disabled={busyId === review.id}
              >
                מחיקה
              </Button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && !adding && <p className="text-sm text-charcoal-soft">אין עדיין ביקורות.</p>}
      </div>
    </div>
  );
}
