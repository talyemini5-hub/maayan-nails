import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getPublishedGallery } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "גלריה",
  description: "גלריית עבודות — לק ג׳ל, בנייה, פרנץ׳, ציור וקישוט ולפני/אחרי — של Maayan Nails.",
};

export default async function GalleryPage() {
  const items = await getPublishedGallery();

  return (
    <div className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="הגלריה שלנו" title="עבודות שאנחנו גאות בהן" align="center" />
        <div className="mt-12">
          <GalleryGrid items={items} />
        </div>
      </Container>
    </div>
  );
}
