import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
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
          <Image
            src="/brand/logo-full.png"
            alt="Maayan Nails"
            width={827}
            height={548}
            className="mx-auto h-24 w-auto"
            priority
          />
          <h1 className="mt-3 font-brand text-2xl text-charcoal">אזור ניהול</h1>
        </div>
        <Suspense fallback={null}>
          <LoginForm defaultNext="/admin/dashboard" />
        </Suspense>
      </div>
    </div>
  );
}
