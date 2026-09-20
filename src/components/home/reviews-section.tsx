import { Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import type { Review } from "@/types/database";

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="לקוחות מספרות" title="מה אומרות עלינו" />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {reviews.map((review) => (
            <figure key={review.id} className="bg-ivory border border-nude/40 rounded-[var(--radius-card)] p-6">
              {review.rating && (
                <div className="flex gap-0.5 text-rose-gold mb-3" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4" fill={i < review.rating! ? "currentColor" : "none"} />
                  ))}
                </div>
              )}
              <blockquote className="text-sm text-charcoal-soft leading-relaxed">&ldquo;{review.content}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm font-medium text-charcoal">{review.customer_name}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
