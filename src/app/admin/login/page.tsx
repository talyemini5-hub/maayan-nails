import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "כניסת ניהול | Maayan Nails",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-5 py-16">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-ivory p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-8 text-center">
          <h1 className="font-brand text-2xl text-charcoal">אזור ניהול</h1>
          <p className="mt-1 text-sm text-charcoal-soft">Maayan Nails</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm defaultNext="/admin/dashboard" />
        </Suspense>
      </div>
    </div>
  );
}
