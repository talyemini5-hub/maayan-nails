import type { Metadata } from "next";
import { CustomersTable, type CustomerWithStats } from "@/components/admin/customers-table";
import { getAllCustomersForAdmin } from "@/lib/data/admin-customers";
import { getAdminAppointments } from "@/lib/data/admin-appointments";
import { formatDateShortHe } from "@/lib/format";

export const metadata: Metadata = { title: "לקוחות | ניהול", robots: { index: false, follow: false } };

export default async function AdminCustomersPage() {
  const [customers, appointments] = await Promise.all([getAllCustomersForAdmin(), getAdminAppointments()]);

  const withStats: CustomerWithStats[] = customers.map((customer) => {
    const own = appointments.filter((a) => a.customer_id === customer.id);
    const completed = own.filter((a) => a.appointment_status === "completed");
    const lastVisit = completed
      .slice()
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())[0];
    return {
      ...customer,
      appointmentCount: own.length,
      completedCount: completed.length,
      totalSpent: completed.reduce((sum, a) => sum + a.final_price, 0),
      lastVisit: lastVisit ? formatDateShortHe(lastVisit.start_at) : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">לקוחות</h1>
        <p className="mt-1 text-sm text-charcoal-soft">{customers.length} לקוחות רשומות במערכת.</p>
      </div>
      <CustomersTable customers={withStats} />
    </div>
  );
}
