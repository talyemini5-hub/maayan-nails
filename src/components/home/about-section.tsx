import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import type { AboutSettings } from "@/lib/data/business-settings";

export function AboutSection({ about }: { about: AboutSettings }) {
  return (
    <section id="about" className="py-14 sm:py-20 bg-cream/60">
      <Container className="grid gap-10 md:grid-cols-2 items-center">
        <div className="relative aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden order-2 md:order-1">
          <Image
            src={about.image_url ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80"}
            alt="מעיין, בעלת הסטודיו"
            fill
            sizes="(min-width: 768px) 40vw, 90vw"
            className="object-cover"
          />
        </div>
        <div className="order-1 md:order-2">
          <SectionHeading eyebrow="נעים להכיר" title={about.title} align="start" />
          <p className="mt-6 text-charcoal-soft leading-relaxed">{about.intro}</p>
          <ul className="mt-8 grid grid-cols-3 gap-4 text-center">
            {about.values.map((value) => (
              <li key={value} className="bg-ivory rounded-xl py-4 px-2 text-sm font-medium text-burgundy shadow-[var(--shadow-soft)]">
                {value}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
