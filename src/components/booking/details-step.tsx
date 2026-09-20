"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/form-field";
import { customerDetailsSchema, type CustomerDetailsInput } from "@/lib/validation/booking";

const detailsFormSchema = customerDetailsSchema.extend({
  acceptedCancellationPolicy: z.literal(true, { error: "יש לאשר את מדיניות הביטולים" }),
});
type DetailsFormValues = z.infer<typeof detailsFormSchema>;

export function DetailsStep({
  defaultValues,
  cancellationPolicyText,
  onSubmit,
  onBack,
}: {
  defaultValues: (CustomerDetailsInput & { acceptedCancellationPolicy?: boolean }) | null;
  cancellationPolicyText: string;
  onSubmit: (values: CustomerDetailsInput) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      note: defaultValues?.note ?? "",
      acceptedCancellationPolicy: defaultValues?.acceptedCancellationPolicy === true ? true : undefined,
    },
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) => {
        onSubmit({ fullName: values.fullName, phone: values.phone, email: values.email, note: values.note });
      })}
    >
      <div>
        <h2 className="font-brand text-2xl text-charcoal">כמה פרטים ליצירת קשר</h2>
        <p className="mt-1 text-sm text-charcoal-soft">נשתמש בהם רק כדי לאשר ולתזכר את התור.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="שם מלא" placeholder="לדוגמה: נועה כהן" error={errors.fullName?.message} {...register("fullName")} />
        <TextField
          label="טלפון"
          type="tel"
          inputMode="tel"
          placeholder="050-1234567"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>
      <TextField
        label="אימייל"
        type="email"
        placeholder="name@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextAreaField
        label="הערה (אופציונלי)"
        placeholder="יש לך משהו לספר לנו? צרפי כאן"
        error={errors.note?.message}
        {...register("note")}
      />

      <label className="flex items-start gap-2.5 rounded-2xl bg-cream/60 p-4 text-sm text-charcoal-soft">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-burgundy)]" {...register("acceptedCancellationPolicy")} />
        <span>{cancellationPolicyText}</span>
      </label>
      {errors.acceptedCancellationPolicy && (
        <p className="-mt-4 text-xs text-burgundy">{errors.acceptedCancellationPolicy.message}</p>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          חזרה
        </Button>
        <Button type="submit" size="lg">
          המשך לסיכום
        </Button>
      </div>
    </form>
  );
}
