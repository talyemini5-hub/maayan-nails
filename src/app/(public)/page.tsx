import { Hero } from "@/components/home/hero";
import { FeaturedWork } from "@/components/home/featured-work";
import { ServicesSection } from "@/components/home/services-section";
import { AboutSection } from "@/components/home/about-section";
import { PricingSection } from "@/components/home/pricing-section";
import { BeforeAfterSection } from "@/components/home/before-after-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { BookingCtaSection } from "@/components/home/booking-cta-section";
import { InstagramSection } from "@/components/home/instagram-section";
import { LocationSection } from "@/components/home/location-section";
import { WhatsAppSection } from "@/components/home/whatsapp-section";
import { StickyBookingCta } from "@/components/sticky-booking-cta";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { getAllActiveServices } from "@/lib/data/services";
import { getPublishedGallery, getPublishedReviews } from "@/lib/data/gallery";

export default async function HomePage() {
  const [{ businessInfo, policies, about }, services, gallery, reviews] = await Promise.all([
    getBusinessSettings(),
    getAllActiveServices(),
    getPublishedGallery(),
    getPublishedReviews(),
  ]);

  return (
    <>
      <Hero business={businessInfo} />
      <FeaturedWork items={gallery} />
      <ServicesSection services={services} />
      <AboutSection about={about} />
      <PricingSection services={services} policies={policies} />
      <BeforeAfterSection items={gallery} />
      <ReviewsSection reviews={reviews} />
      <BookingCtaSection />
      <InstagramSection items={gallery} instagramUrl={businessInfo.instagram_url} />
      <LocationSection business={businessInfo} />
      <WhatsAppSection />
      <StickyBookingCta />
    </>
  );
}
