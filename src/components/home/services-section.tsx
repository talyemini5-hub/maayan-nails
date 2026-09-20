import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPriceRange } from "@/lib/format";
import type { Service } from "@/types/database";

export function ServicesSection({ services }: { services: Service[] }) {
  const treatments = services.filter((s) => s.kind === "treatment");

  return (
    <section id="services" className="py-20 sm:py-28 bg-cream/60">
      <Container>
        <SectionHeading eyebrow="הטיפולים שלנו" title="השירותים שלנו" description="כל טיפול מותאם אישית, בדיוק ובאווירה נעימה." />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(treatments.length ? treatments : PLACEHOLDER).map((service) => (
            <article
              key={service.id ?? service.name}
              className="group bg-ivory rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <h3 className="font-brand text-xl text-charcoal mb-1">{service.name}</h3>
              {service.description && <p className="text-sm text-charcoal-soft mb-3">{service.description}</p>}
              <p className="text-burgundy font-medium">
                {formatPriceRange(service.price ?? 0, service.price_max ?? null, service.is_price_from ?? false)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/appointments/new" size="lg">קביעת תור</Button>
        </div>
      </Container>
    </section>
  );
}

const PLACEHOLDER: Partial<Service>[] = [
  { name: "לק ג׳ל מבנה אנטומי", price: 140, is_price_from: false },
  { name: "מילוי אקריל", price: 140, is_price_from: false },
  { name: "בניית ציפורניים בפוליג׳ל", price: 350, is_price_from: false },
];
