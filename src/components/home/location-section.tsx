import { MapPin, Navigation } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { whatsAppGeneralInquiry } from "@/lib/whatsapp";
import type { BusinessInfo } from "@/lib/data/business-settings";

const WORK_DAYS = [
  ["ראשון", "09:00–19:00"],
  ["שני", "09:00–19:00"],
  ["שלישי", "09:00–19:00"],
  ["רביעי", "09:00–19:00"],
  ["חמישי", "09:00–19:00"],
  ["שישי", "09:00–14:00"],
  ["שבת", "סגור"],
];

export function LocationSection({ business }: { business: BusinessInfo }) {
  const encodedAddress = encodeURIComponent(business.address);
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodedAddress}`;

  return (
    <section id="location" className="py-14 sm:py-20">
      <Container className="grid gap-10 md:grid-cols-2">
        <div>
          <SectionHeading eyebrow="מיקום ושעות" title="איך מגיעים" align="start" />
          <p className="mt-6 flex items-center gap-2 text-charcoal-soft">
            <MapPin className="size-5 shrink-0" aria-hidden /> {business.address}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={wazeUrl} target="_blank" rel="noopener noreferrer" variant="secondary">
              <Navigation className="size-4" aria-hidden /> Waze
            </Button>
            <Button href={googleMapsUrl} target="_blank" rel="noopener noreferrer" variant="secondary">
              Google Maps
            </Button>
            <Button href={appleMapsUrl} target="_blank" rel="noopener noreferrer" variant="secondary">
              Apple Maps
            </Button>
            <WhatsAppButton message={whatsAppGeneralInquiry()} />
          </div>

          <div className="mt-8 rounded-[var(--radius-card)] overflow-hidden border border-nude/40">
            <iframe
              title="מפת המיקום של הסטודיו"
              className="w-full h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
            />
          </div>
        </div>

        <div>
          <h3 className="font-brand text-lg mb-4 text-burgundy">שעות פעילות</h3>
          <ul className="divide-y divide-nude/30 border-y border-nude/30">
            {WORK_DAYS.map(([day, hours]) => (
              <li key={day} className="flex justify-between py-3 text-sm">
                <span className="text-charcoal">{day}</span>
                <span className="text-charcoal-soft">{hours}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-charcoal-soft">* ניתן לעדכן שעות אלו ושינויים מיוחדים באזור הניהול.</p>
        </div>
      </Container>
    </section>
  );
}
