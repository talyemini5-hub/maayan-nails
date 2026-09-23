import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/ui/icons";
import type { GalleryItem } from "@/types/database";

/**
 * Compact gallery preview: small thumbnail grid (not full-size images) linking
 * to the full gallery, plus a link to the real Instagram account. Replaces the
 * previous FeaturedWork + BeforeAfterSection + InstagramSection trio to keep
 * the home page short.
 */
export function GalleryPreviewSection({ items, instagramUrl }: { items: GalleryItem[]; instagramUrl: string }) {
  const preview = items.slice(0, 8);
  if (!preview.length) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="עבודות" title="עבודות שאנחנו אוהבות" />

        <div className="mt-10 grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
          {preview.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden">
              <Image
                src={item.thumbnail_url ?? item.image_url}
                alt={item.title ?? "עבודה מהגלריה של Maayan Nails"}
                fill
                sizes="(min-width: 640px) 12vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/gallery" size="lg">לכל הגלריה</Button>
          <Button href={instagramUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
            <InstagramIcon className="size-5" /> maayan.nails.art@
          </Button>
        </div>
      </Container>
    </section>
  );
}
