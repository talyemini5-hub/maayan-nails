import { Hero } from "@/components/home/hero";
import { ServicesSection } from "@/components/home/services-section";
import { GalleryPreviewSection } from "@/components/home/gallery-preview-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { LocationSection } from "@/components/home/location-section";
import { WhatsAppSection } from "@/components/home/whatsapp-section";
import { StickyBookingCta } from "@/components/sticky-booking-cta";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { getAllActiveServices } from "@/lib/data/services";
import { getPublishedGallery, getPublishedReviews } from "@/lib/data/gallery";

export default async function HomePage() {
  const [{ businessInfo, policies }, services, gallery, reviews] = await Promise.all([
    getBusinessSettings(),
    getAllActiveServices(),
    getPublishedGallery(),
    getPublishedReviews(),
  ]);

  return (
    <>
      <Hero business={businessInfo} />
      <ServicesSection services={services} policies={policies} />
      <GalleryPreviewSection items={gallery} instagramUrl={businessInfo.instagram_url} />
      <ReviewsSection reviews={reviews} />
      <LocationSection business={businessInfo} />
      <WhatsAppSection />
      <StickyBookingCta />
    </>
  );
}
