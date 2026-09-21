"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { createClient } from "@/lib/supabase/client";
import { magicLinkRequestSchema, otpVerifySchema } from "@/lib/validation/booking";

const ERROR_MESSAGES: Record<string, string> = {
  link_invalid: "הקישור פג תוקף או שכבר נעשה בו שימוש. נא לבקש קישור חדש.",
};

export function LoginForm({ defaultNext = "/my-appointments" }: { defaultNext?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? defaultNext;
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState<string | null>(urlError ? (ERROR_MESSAGES[urlError] ?? null) : null);

  async function handleSendLink(e: React.FormEvent) {
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
      setStatus("idle");
      setError("לא הצלחנו לשלוח את הקוד. נא לנסות שוב בעוד רגע.");
      return;
    }
    setStatus("sent");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const parsed = otpVerifySchema.safeParse({ otp });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "קוד לא תקין");
      return;
    }

    setStatus("verifying");
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: parsed.data.otp,
      type: "email",
    });

    if (verifyError) {
      setStatus("sent");
      setError("הקוד שגוי או שפג תוקפו. נא לבדוק שוב, או לבקש קוד חדש.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (status === "sent" || status === "verifying") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-cream/60 p-6 text-center">
          <span className="text-3xl">✉️</span>
          <h2 className="font-brand text-xl text-charcoal">שלחנו לך קוד וקישור!</h2>
          <p className="text-sm leading-relaxed text-charcoal-soft">
            בדקי את תיבת הדואר בכתובת <strong className="text-charcoal">{email}</strong>.
            <br />
            פותחת את המייל באותו מחשב/דפדפן? אפשר פשוט ללחוץ על הקישור שבמייל.
            <br />
            רואה את המייל במכשיר אחר (למשל בטלפון) אבל רוצה להתחבר כאן? הזיני למטה את
            הקוד בן 6 הספרות מתוך המייל.
          </p>
        </div>
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
          <TextField
            label="קוד בן 6 ספרות"
            type="text"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            error={error ?? undefined}
            autoFocus
          />
          <Button type="submit" size="lg" disabled={status === "verifying" || otp.length !== 6}>
            {status === "verifying" ? "מאמת…" : "אישור קוד וכניסה"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-charcoal-soft underline underline-offset-2"
            onClick={() => {
              setStatus("idle");
              setOtp("");
              setError(null);
            }}
          >
            לבקש קוד חדש / לשנות אימייל
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendLink} className="flex flex-col gap-4">
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
        {status === "sending" ? "שולח…" : "שליחת קוד/קישור התחברות"}
      </Button>
      <p className="text-center text-xs text-charcoal-soft">
        נשלח לך קוד וקישור התחברות מיידיים לאימייל — בלי צורך בסיסמה.
      </p>
    </form>
  );
}
