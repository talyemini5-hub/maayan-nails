import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDurationHe, formatPriceRange } from "@/lib/format";
import type { Service } from "@/types/database";

export function TreatmentStep({
  treatments,
  selectedId,
  onSelect,
  onNext,
}: {
  treatments: Service[];
  selectedId: string | null;
  onSelect: (treatment: Service) => void;
  onNext: () => void;
}) {
  if (treatments.length === 0) {
    return (
      <p className="py-10 text-center text-charcoal-soft">
        לא נמצאו טיפולים זמינים כרגע. נא ליצור קשר ישירות בוואטסאפ לקביעת תור.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-brand text-2xl text-charcoal">איזה טיפול תרצי?</h2>
        <p className="mt-1 text-sm text-charcoal-soft">בחרי את הטיפול המרכזי — תוספות אפשר להוסיף בשלב הבא.</p>
      </div>

      <div role="radiogroup" aria-label="בחירת טיפול" className="grid gap-3 sm:grid-cols-2">
        {treatments.map((treatment) => {
          const isSelected = treatment.id === selectedId;
          return (
            <button
              key={treatment.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(treatment)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-[var(--radius-card)] border p-4 text-start transition-all focus-visible:ring-2 focus-visible:ring-burgundy/40",
                isSelected
                  ? "border-burgundy bg-burgundy/5 shadow-[var(--shadow-soft)]"
                  : "border-charcoal/10 bg-ivory hover:border-charcoal/25"
              )}
            >
              <span className="font-brand text-lg text-charcoal">{treatment.name}</span>
              {treatment.description && <span className="text-sm text-charcoal-soft">{treatment.description}</span>}
              <span className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-medium text-burgundy">
                  {formatPriceRange(treatment.price, treatment.price_max, treatment.is_price_from)}
                </span>
                {treatment.duration_minutes && (
                  <span className="text-charcoal-soft/70">· {formatDurationHe(treatment.duration_minutes)}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button size="lg" disabled={!selectedId} onClick={onNext}>
          המשך
        </Button>
      </div>
    </div>
  );
}
