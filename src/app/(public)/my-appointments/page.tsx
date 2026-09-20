import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/my-appointments/appointment-card";
import { getCustomerAppointments, getMyCustomerId } from "@/lib/data/appointments";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { isUpcoming } from "@/lib/appointment-status";

export const metadata: Metadata = {
  title: "התורים שלי",
  description: "צפייה, שינוי מועד וביטול של התורים שלך.",
};

export default async function MyAppointmentsPage() {
  const [customerId, { availability }] = await Promise.all([getMyCustomerId(), getBusinessSettings()]);

  if (customerId === null) {
    redirect("/auth?next=/my-appointments");
  }

  const appointments = await getCustomerAppointments(customerId);
  const upcoming = appointments.filter((a) => isUpcoming(a.appointment_status, a.start_at));
  const past = appointments.filter((a) => !isUpcoming(a.appointment_status, a.start_at));

  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-charcoal">התורים שלי</h1>
          <p className="mt-1 text-sm text-charcoal-soft">כאן אפשר לראות, לשנות מועד או לבטל תור.</p>
        </div>
        <Button href="/appointments/new">קביעת תור חדש</Button>
      </div>

      {appointments.length === 0 ? (
        <p className="rounded-[var(--radius-card)] bg-cream/60 p-8 text-center text-charcoal-soft">
          עדיין לא קבעת תורים. מוכנה להתחיל?
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-charcoal-soft">תורים קרובים</h2>
              {upcoming.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  bookingHorizonDays={availability.booking_horizon_days}
                />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-charcoal-soft">היסטוריה</h2>
              {past.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  bookingHorizonDays={availability.booking_horizon_days}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
