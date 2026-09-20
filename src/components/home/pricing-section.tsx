import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { formatPriceRange } from "@/lib/format";
import type { Service } from "@/types/database";
import type { PolicySettings } from "@/lib/data/business-settings";

export function PricingSection({ services, policies }: { services: Service[]; policies: PolicySettings }) {
  const treatments = services.filter((s) => s.kind === "treatment");
  const addons = services.filter((s) => s.kind === "addon");

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <Container className="max-w-4xl">
        <SectionHeading eyebrow="מחירון" title="מחירון שקוף וברור" />

        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="font-brand text-lg mb-4 text-burgundy">טיפולים</h3>
            <ul className="space-y-3">
              {treatments.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-nude/40 pb-2">
                  <span className="text-charcoal-soft">{s.name}</span>
                  <span className="font-medium whitespace-nowrap">{formatPriceRange(s.price, s.price_max, s.is_price_from)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-brand text-lg mb-4 text-burgundy">תוספות</h3>
            <ul className="space-y-3">
              {addons.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-nude/40 pb-2">
                  <span className="text-charcoal-soft">{s.name}</span>
                  <span className="font-medium whitespace-nowrap">{formatPriceRange(s.price, s.price_max, s.is_price_from)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-cream/70 rounded-[var(--radius-card)] p-6 sm:p-8 space-y-4 text-sm text-charcoal-soft leading-relaxed">
          <p><strong className="text-charcoal">אחריות: </strong>{policies.warranty_text}</p>
          <p><strong className="text-charcoal">ציורים וקישוטים: </strong>{policies.nail_art_policy_text}</p>
        </div>
      </Container>
    </section>
  );
}
