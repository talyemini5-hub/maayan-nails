import * as React from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-2xl border bg-ivory px-4 py-3 text-[0.95rem] text-charcoal placeholder:text-charcoal-soft/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, className, id, ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-charcoal-soft">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={cn(fieldBase, error ? "border-burgundy/70" : "border-charcoal/15", className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-burgundy">
          {error}
        </p>
      )}
    </div>
  );
});

type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, className, id, ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-charcoal-soft">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={3}
        className={cn(fieldBase, "resize-none", error ? "border-burgundy/70" : "border-charcoal/15", className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-burgundy">
          {error}
        </p>
      )}
    </div>
  );
});
