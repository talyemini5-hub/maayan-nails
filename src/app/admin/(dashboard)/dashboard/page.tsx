import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateHe, formatILS, formatTimeHe } from "@/lib/format";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_STYLES } from "@/lib/appointment-status";
import { cn } from "@/lib/utils/cn";
import { getAdminAppointments } from "@/lib/data/admin-appointments";

export const metadata: Metadata = { title: "דשבורד | ניהול", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const appointments = await getAdminAppointments();

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = appointments.filter((a) => a.start_at.slice(0, 10) === todayStr && a.appointment_status !== "cancelled");
  const pending = appointments.filter((a) => a.appointment_status === "pending_approval");
  const thisMonth = appointments.filter((a) => a.start_at.slice(0, 7) === todayStr.slice(0, 7));
  const monthRevenue = thisMonth
    .filter((a) => a.appointment_status === "completed")
    .reduce((sum, a) => sum + a.final_price, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">בוקר טוב, מעיין ✨</h1>
        <p className="mt-1 text-sm text-charcoal-soft">{formatDateHe(new Date())}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="תורים היום" value={String(today.length)} href="/admin/appointments" />
        <StatCard label="ממתינות לאישור" value={String(pending.length)} href="/admin/appointments" highlight={pending.length > 0} />
        <StatCard label="הכנסה החודש (הושלמו)" value={formatILS(monthRevenue)} href="/admin/stats" />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-charcoal-soft">התורים של היום</h2>
          <Button href="/admin/appointments" variant="ghost" size="md">
            כל התורים
          </Button>
        </div>
        {today.length === 0 ? (
          <p className="rounded-2xl bg-ivory p-6 text-center text-sm text-charcoal-soft">אין תורים היום.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {today.map((a) => (
              <Link
                key={a.id}
                href="/admin/appointments"
                className="flex items-center justify-between rounded-2xl border border-charcoal/10 bg-ivory p-4 transition-colors hover:border-burgundy/30"
              >
                <div>
                  <p className="font-medium text-charcoal">{a.customers?.full_name}</p>
                  <p className="text-sm text-charcoal-soft">
                    {a.services?.name} · {formatTimeHe(a.start_at)}
                  </p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", APPOINTMENT_STATUS_STYLES[a.appointment_status])}>
                  {APPOINTMENT_STATUS_LABELS[a.appointment_status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: string; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-[var(--radius-card)] border p-5 transition-colors",
        highlight ? "border-burgundy bg-burgundy/5" : "border-charcoal/10 bg-ivory hover:border-charcoal/25"
      )}
    >
      <p className="text-sm text-charcoal-soft">{label}</p>
      <p className="mt-1 font-brand text-3xl text-charcoal">{value}</p>
    </Link>
  );
}
