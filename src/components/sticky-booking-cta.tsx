import { Button } from "@/components/ui/button";

/**
 * Booking CTA that's always reachable while scrolling the site:
 * a full-width bar above the mobile bottom nav on small screens,
 * and a floating pill button in the bottom corner on larger screens.
 */
export function StickyBookingCta() {
  return (
    <>
      <div className="md:hidden fixed bottom-16 inset-x-0 z-30 px-4 pb-2 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-sm">
          <Button href="/appointments/new" size="lg" className="w-full shadow-lg">
            קביעת תור עכשיו
          </Button>
        </div>
      </div>

      <div className="hidden md:block fixed bottom-6 right-6 z-30">
        <Button href="/appointments/new" size="lg" className="shadow-lg">
          קביעת תור
        </Button>
      </div>
    </>
  );
}
