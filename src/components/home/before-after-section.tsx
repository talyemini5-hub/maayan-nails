import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import type { GalleryItem } from "@/types/database";

export function BeforeAfterSection({ items }: { items: GalleryItem[] }) {
  const pairs = items.filter((i) => i.category === "before_after").slice(0, 4);
  if (!pairs.length) return null;

  return (
    <section className="py-20 sm:py-28 bg-cream/60">
      <Container>
        <SectionHeading eyebrow="לפני / אחרי" title="Before / After" description="שינוי אמיתי, בלי פילטרים." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {pairs.map((item) => (
            <div key={item.id} className="relative aspect-[16/10] rounded-[var(--radius-card)] overflow-hidden">
              <Image src={item.image_url} alt={item.title ?? "לפני ואחרי טיפול"} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
