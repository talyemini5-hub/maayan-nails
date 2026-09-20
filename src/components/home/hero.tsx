import Image from "next/image";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { whatsAppGeneralInquiry } from "@/lib/whatsapp";
import type { BusinessInfo } from "@/lib/data/business-settings";

export function Hero({ business }: { business: BusinessInfo }) {
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(business.address)}&navigate=yes`;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/30 to-charcoal/10" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-28 pb-20 sm:pt-40 sm:pb-32 flex flex-col items-center text-center text-ivory">
        <p className="font-brand text-4xl sm:text-6xl tracking-[0.15em] mb-4 animate-[fadeIn_0.8s_ease]">
          MAAYAN NAILS
        </p>
        <p className="text-base sm:text-lg text-ivory/90 mb-1">סטודיו לציפורניים באופקים</p>
        <p className="text-lg sm:text-2xl font-brand italic mb-8 max-w-md">
          הציפורניים שלך, בדיוק כמו שאת אוהבת.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button href="/appointments/new" size="lg" className="w-full sm:w-auto">
            קביעת תור
          </Button>
          <Button href="/gallery" size="lg" variant="secondary" className="w-full sm:w-auto !border-ivory/50 !text-ivory hover:!bg-ivory/10">
            צפייה בעבודות
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 bg-ivory/10 backdrop-blur px-3 py-1.5 rounded-full">
            <MapPin className="size-4" aria-hidden /> {business.address}
          </span>
          <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-ivory/10 backdrop-blur px-3 py-1.5 rounded-full hover:bg-ivory/20">
            <Navigation className="size-4" aria-hidden /> ניווט לסטודיו
          </a>
          <WhatsAppButton message={whatsAppGeneralInquiry()} label="וואטסאפ" />
        </div>
      </div>
    </section>
  );
}
