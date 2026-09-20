import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-start", className)}>
      {eyebrow && (
        <p className="text-xs tracking-[0.25em] uppercase text-rose-gold font-medium mb-3">{eyebrow}</p>
      )}
      <h2 className="font-brand text-3xl sm:text-4xl text-charcoal">{title}</h2>
      {description && <p className="mt-4 text-charcoal-soft leading-relaxed">{description}</p>}
    </div>
  );
}
