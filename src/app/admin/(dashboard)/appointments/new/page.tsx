import type { Metadata } from "next";
import { NewAppointmentForm } from "@/components/admin/new-appointment-form";
import { getActiveAddonsFor, getActiveTreatments } from "@/lib/data/services";
import { getAllCustomersForAdmin } from "@/lib/data/admin-customers";
import { getBusinessSettings } from "@/lib/data/business-settings";
import type { Service } from "@/types/database";

export const metadata: Metadata = { title: "תור חדש | ניהול", robots: { index: false, follow: false } };

export default async function AdminNewAppointmentPage() {
  const [treatments, customers, { availability }] = await Promise.all([
    getActiveTreatments(),
    getAllCustomersForAdmin(),
    getBusinessSettings(),
  ]);

  const addonsByService: Record<string, Service[]> = {};
  await Promise.all(
    treatments.map(async (treatment) => {
      addonsByService[treatment.id] = await getActiveAddonsFor(treatment.id);
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">תור חדש</h1>
        <p className="mt-1 text-sm text-charcoal-soft">קביעת תור ידנית — למשל עבור מישהי שכתבה בוואטסאפ או התקשרה.</p>
      </div>
      <NewAppointmentForm
        treatments={treatments}
        addonsByService={addonsByService}
        customers={customers}
        bookingHorizonDays={availability.booking_horizon_days}
      />
    </div>
  );
}
