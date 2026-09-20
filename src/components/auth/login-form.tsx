"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { createClient } from "@/lib/supabase/client";
import { magicLinkRequestSchema } from "@/lib/validation/booking";

const ERROR_MESSAGES: Record<string, string> = {
  link_invalid: "הקישור פג תוקף או שכבר נעשה בו שימוש. נא לבקש קישור חדש.",
};

export function LoginForm({ defaultNext = "/my-appointments" }: { defaultNext?: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? defaultNext;
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(urlError ? ERROR_MESSAGES[urlError] ?? null : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = magicLinkRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "כתובת אימייל לא תקינה");
      return;
    }

    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: redirectTo },
    });

    if (signInError) {
      setStatus("error");
      setError("לא הצלחנו לשלוח את הקישור. נא לנסות שוב בעוד רגע.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-cream/60 p-8 text-center">
        <span className="text-3xl">✉️</span>
        <h2 className="font-brand text-xl text-charcoal">שלחנו לך קישור!</h2>
        <p className="text-sm text-charcoal-soft">
          בדקי את תיבת הדואר בכתובת <strong className="text-charcoal">{email}</strong> ולחצי על הקישור כדי להתחבר.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="אימייל"
        type="email"
        name="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
        autoFocus
      />
      <Button type="submit" size="lg" disabled={status === "sending"}>
        {status === "sending" ? "שולח…" : "שליחת קישור התחברות"}
      </Button>
      <p className="text-center text-xs text-charcoal-soft">
        נשלח לך קישור התחברות מיידי לאימייל — בלי צורך בסיסמה.
      </p>
    </form>
  );
}
