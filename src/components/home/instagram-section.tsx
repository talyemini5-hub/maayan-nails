import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/ui/icons";
import type { GalleryItem } from "@/types/database";

/**
 * We deliberately do NOT scrape Instagram (fragile, breaks on API changes).
 * Instead we reuse the local gallery in a similar visual style, with a clear
 * link to the real Instagram account.
 */
export function InstagramSection({ items, instagramUrl }: { items: GalleryItem[]; instagramUrl: string }) {
  const preview = items.slice(0, 6);

  return (
    <section className="py-20 sm:py-28 bg-cream/60">
      <Container>
        <SectionHeading eyebrow="Instagram" title="עקבי אחרי Maayan Nails" />
        {preview.length > 0 && (
          <div className="mt-10 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {preview.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={item.id} src={item.thumbnail_url ?? item.image_url} alt="" className="aspect-square object-cover rounded-lg" />
            ))}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <Button href={instagramUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
            <InstagramIcon className="size-5" /> maayan.nails.art@
          </Button>
        </div>
      </Container>
    </section>
  );
}
