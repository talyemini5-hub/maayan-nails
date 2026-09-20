import { cn } from "@/lib/utils/cn";
import { STEP_LABELS, STEP_ORDER, type WizardStep } from "./types";

export function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = STEP_ORDER.indexOf(current);

  return (
    <ol className="flex items-center justify-between gap-1 sm:gap-2" aria-label="שלבי קביעת התור">
      {STEP_ORDER.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-1 sm:gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-8 sm:w-8",
                  isDone && "bg-burgundy text-ivory",
                  isCurrent && "bg-burgundy/15 text-burgundy ring-2 ring-burgundy",
                  !isDone && !isCurrent && "bg-cream text-charcoal-soft/60"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[0.7rem] sm:block",
                  isCurrent ? "font-medium text-charcoal" : "text-charcoal-soft/60"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {index < STEP_ORDER.length - 1 && (
              <div className={cn("h-px flex-1 transition-colors", isDone ? "bg-burgundy" : "bg-charcoal/10")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
