import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/types/database";

/** Editorial-style featured grid — mixed image sizes, not a generic 6-square grid. */
export function FeaturedWork({ items }: { items: GalleryItem[] }) {
  const featured = items.filter((i) => i.is_featured).slice(0, 5);
  if (!featured.length) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="עבודות נבחרות" title="עבודות שאנחנו אוהבות" />

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[140px] sm:auto-rows-[220px]">
          {featured.map((item, i) => (
            <div
              key={item.id}
              className={
                "relative rounded-2xl overflow-hidden " +
                (i === 0 ? "col-span-2 row-span-2" : i === 3 ? "row-span-2" : "")
              }
            >
              <Image
                src={item.image_url}
                alt={item.title ?? "עבודה מהגלריה של Maayan Nails"}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/gallery" variant="secondary" size="lg">לכל הגלריה</Button>
        </div>
      </Container>
    </section>
  );
}
