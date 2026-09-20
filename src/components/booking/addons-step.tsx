import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatPriceRange } from "@/lib/format";
import type { Service } from "@/types/database";

export function AddonsStep({
  addons,
  selectedIds,
  onToggle,
  onNext,
  onBack,
}: {
  addons: Service[];
  selectedIds: string[];
  onToggle: (addonId: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-brand text-2xl text-charcoal">רוצה להוסיף תוספות?</h2>
        <p className="mt-1 text-sm text-charcoal-soft">אפשר לבחור כמה שרוצים, או לדלג ולהמשיך בלי תוספות.</p>
      </div>

      {addons.length === 0 ? (
        <p className="text-sm text-charcoal-soft">אין תוספות זמינות לטיפול הזה.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addons.map((addon) => {
            const isSelected = selectedIds.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => onToggle(addon.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border p-4 text-start transition-all focus-visible:ring-2 focus-visible:ring-burgundy/40",
                  isSelected ? "border-burgundy bg-burgundy/5" : "border-charcoal/10 bg-ivory hover:border-charcoal/25"
                )}
              >
                <span>
                  <span className="block font-medium text-charcoal">{addon.name}</span>
                  {addon.description && <span className="block text-xs text-charcoal-soft">{addon.description}</span>}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-burgundy">
                    {formatPriceRange(addon.price, addon.price_max, addon.is_price_from)}
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border text-xs",
                      isSelected ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/25"
                    )}
                    aria-hidden
                  >
                    {isSelected && "✓"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" size="lg" onClick={onBack}>
          חזרה
        </Button>
        <Button size="lg" onClick={onNext}>
          המשך
        </Button>
      </div>
    </div>
  );
}
