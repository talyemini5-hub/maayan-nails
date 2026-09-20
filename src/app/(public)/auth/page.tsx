import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחברות מהירה עם קישור לאימייל, בלי סיסמה.",
};

export default function AuthPage() {
  return (
    <Container className="max-w-md py-16 sm:py-24">
      <div className="mb-8 text-center">
        <h1 className="font-brand text-3xl text-charcoal">התחברות</h1>
        <p className="mt-2 text-sm text-charcoal-soft">לצפייה וניהול התורים שלך.</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
