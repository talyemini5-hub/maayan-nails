import type { Metadata } from "next";
import { AdminAppointmentRowCard } from "@/components/admin/admin-appointment-row";
import { Button } from "@/components/ui/button";
import { getAdminAppointments } from "@/lib/data/admin-appointments";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "תורים | ניהול", robots: { index: false, follow: false } };

export default async function AdminAppointmentsPage() {
  const appointments = await getAdminAppointments();
  const now = nowMs();

  const pending = appointments.filter((a) => a.appointment_status === "pending_approval");
  const upcoming = appointments.filter(
    (a) => a.appointment_status !== "pending_approval" && new Date(a.start_at).getTime() >= now && !isFinal(a.appointment_status)
  );
  const past = appointments.filter((a) => new Date(a.start_at).getTime() < now || isFinal(a.appointment_status));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl text-charcoal">תורים</h1>
          <p className="mt-1 text-sm text-charcoal-soft">{appointments.length} תורים בסך הכל</p>
        </div>
        <Button href="/admin/appointments/new">+ תור חדש</Button>
      </div>

      {pending.length > 0 && (
        <Section title={`ממתינות לאישור (${pending.length})`} items={pending} />
      )}
      <Section title={`תורים קרובים (${upcoming.length})`} items={upcoming} empty="אין תורים קרובים כרגע." />
      <Section title={`היסטוריה (${past.length})`} items={past.slice(0, 30)} empty="אין היסטוריית תורים עדיין." />
    </div>
  );
}

function isFinal(status: string) {
  return ["completed", "cancelled", "declined", "no_show"].includes(status);
}

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: Awaited<ReturnType<typeof getAdminAppointments>>;
  empty?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-charcoal-soft">{title}</h2>
      {items.length === 0 && empty ? (
        <p className="text-sm text-charcoal-soft/70">{empty}</p>
      ) : (
        items.map((appointment) => <AdminAppointmentRowCard key={appointment.id} appointment={appointment} />)
      )}
    </section>
  );
}
