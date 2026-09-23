import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPriceRange, formatDurationHe } from "@/lib/format";
import type { Service } from "@/types/database";
import type { PolicySettings } from "@/lib/data/business-settings";

export function ServicesSection({ services, policies }: { services: Service[]; policies: PolicySettings }) {
  const treatments = services.filter((s) => s.kind === "treatment");
  const addons = services.filter((s) => s.kind === "addon");
  const list = treatments.length ? treatments : (PLACEHOLDER as Service[]);

  return (
    <section id="services" className="py-20 sm:py-28 bg-cream/60">
      <Container>
        <SectionHeading eyebrow="מחירון ושירותים" title="השירותים שלנו" description="כל טיפול מותאם אישית, בדיוק ובאווירה נעימה." />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((service) => (
            <article
              key={service.id ?? service.name}
              className="group bg-ivory rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <h3 className="font-brand text-xl text-charcoal mb-1">{service.name}</h3>
              {service.description && <p className="text-sm text-charcoal-soft mb-3">{service.description}</p>}
              <div className="flex items-center justify-between gap-3">
                <p className="text-burgundy font-medium">
                  {formatPriceRange(service.price ?? 0, service.price_max ?? null, service.is_price_from ?? false)}
                </p>
                {service.duration_minutes ? (
                  <p className="text-sm text-charcoal-soft whitespace-nowrap">{formatDurationHe(service.duration_minutes)}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {addons.length > 0 && (
          <div className="mt-10">
            <h3 className="font-brand text-lg mb-4 text-burgundy text-center">תוספות</h3>
            <ul className="mx-auto max-w-2xl grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {addons.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-nude/40 py-2">
                  <span className="text-charcoal-soft text-sm">{s.name}</span>
                  <span className="font-medium text-sm whitespace-nowrap">
                    {formatPriceRange(s.price, s.price_max, s.is_price_from)}
                    {s.duration_minutes ? <span className="text-charcoal-soft"> · {formatDurationHe(s.duration_minutes)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 bg-ivory rounded-[var(--radius-card)] p-6 sm:p-8 space-y-3 text-sm text-charcoal-soft leading-relaxed">
          <p><strong className="text-charcoal">אחריות: </strong>{policies.warranty_text}</p>
          <p><strong className="text-charcoal">ציורים וקישוטים: </strong>{policies.nail_art_policy_text}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/appointments/new" size="lg">קביעת תור</Button>
        </div>
      </Container>
    </section>
  );
}

const PLACEHOLDER: Partial<Service>[] = [
  { name: "לק ג׳ל מבנה אנטומי", price: 140, is_price_from: false, duration_minutes: 60 },
  { name: "מילוי אקריל", price: 140, is_price_from: false, duration_minutes: 75 },
  { name: "בניית ציפורניים בפוליג׳ל", price: 350, is_price_from: false, duration_minutes: 120 },
];
