import type { Metadata } from "next";
import { getAdminAppointments } from "@/lib/data/admin-appointments";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status";
import { formatILS } from "@/lib/format";
import type { AppointmentStatus } from "@/types/database";

export const metadata: Metadata = { title: "סטטיסטיקות | ניהול", robots: { index: false, follow: false } };

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5">
      <p className="text-sm text-charcoal-soft">{label}</p>
      <p className="mt-1 font-brand text-2xl text-charcoal">{value}</p>
    </div>
  );
}

export default async function AdminStatsPage() {
  const appointments = await getAdminAppointments();
  const completed = appointments.filter((a) => a.appointment_status === "completed");
  const totalRevenue = completed.reduce((sum, a) => sum + a.final_price, 0);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCompleted = completed.filter((a) => a.start_at.startsWith(monthPrefix));
  const monthRevenue = monthCompleted.reduce((sum, a) => sum + a.final_price, 0);

  const byStatus = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.appointment_status] = (acc[a.appointment_status] ?? 0) + 1;
    return acc;
  }, {});

  const byService = new Map<string, { name: string; count: number; revenue: number }>();
  for (const a of completed) {
    const name = a.services?.name ?? "לא ידוע";
    const entry = byService.get(name) ?? { name, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += a.final_price;
    byService.set(name, entry);
  }
  const topServices = [...byService.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const statusOrder: AppointmentStatus[] = [
    "pending_approval",
    "scheduled",
    "confirmed",
    "completed",
    "no_show",
    "cancelled",
    "declined",
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">סטטיסטיקות</h1>
        <p className="mt-1 text-sm text-charcoal-soft">סיכום פעילות מבוסס על כלל התורים במערכת.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="סה״כ תורים" value={String(appointments.length)} />
        <StatCard label="תורים שהושלמו" value={String(completed.length)} />
        <StatCard label="הכנסה כוללת" value={formatILS(totalRevenue)} />
        <StatCard label="הכנסה החודש" value={formatILS(monthRevenue)} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-brand text-lg text-charcoal">תורים לפי סטטוס</h2>
        <div className="flex flex-wrap gap-3">
          {statusOrder.map((status) => (
            <div key={status} className="rounded-xl border border-charcoal/10 bg-ivory px-4 py-2 text-sm">
              <span className="text-charcoal-soft">{APPOINTMENT_STATUS_LABELS[status]}: </span>
              <span className="font-medium text-charcoal">{byStatus[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-brand text-lg text-charcoal">השירותים המובילים (לפי הכנסה)</h2>
        <div className="flex flex-col gap-2">
          {topServices.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-ivory px-4 py-3 text-sm">
              <span className="text-charcoal">{s.name}</span>
              <span className="text-charcoal-soft">{s.count} תורים · {formatILS(s.revenue)}</span>
            </div>
          ))}
          {topServices.length === 0 && <p className="text-sm text-charcoal-soft">אין עדיין תורים שהושלמו.</p>}
        </div>
      </section>
    </div>
  );
}
