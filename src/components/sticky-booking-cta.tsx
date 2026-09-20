import { Button } from "@/components/ui/button";

/**
 * Elegant sticky CTA shown above the mobile bottom nav on the homepage,
 * so booking is always one tap away without covering content.
 */
export function StickyBookingCta() {
  return (
    <div className="md:hidden fixed bottom-16 inset-x-0 z-30 px-4 pb-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-sm">
        <Button href="/appointments/new" size="lg" className="w-full shadow-lg">
          קביעת תור עכשיו
        </Button>
      </div>
    </div>
  );
}
