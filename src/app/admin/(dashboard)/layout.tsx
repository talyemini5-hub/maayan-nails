import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

/**
 * Chrome for the authenticated admin area. Every route under here is already
 * guarded server-side by proxy.ts (updateSession) — unauthenticated or
 * non-admin requests never reach this layout, they're redirected before
 * rendering starts.
 */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream/40">
      <header className="border-b border-charcoal/10 bg-ivory">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-brand text-lg text-charcoal">Maayan Nails · ניהול</span>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
