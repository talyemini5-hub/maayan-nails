import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getActiveAddonsFor, getActiveTreatments } from "@/lib/data/services";
import { getBusinessSettings } from "@/lib/data/business-settings";
import type { Service } from "@/types/database";

export const metadata: Metadata = {
  title: "קביעת תור",
  description: "קביעת תור אונליין למניקור, פדיקור ובניית ציפורניים אצל מעיין, אופקים.",
};

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [{ service: preselectedTreatmentId }, treatments, { availability, policies }] = await Promise.all([
    searchParams,
    getActiveTreatments(),
    getBusinessSettings(),
  ]);

  const addonsByService: Record<string, Service[]> = {};
  await Promise.all(
    treatments.map(async (treatment) => {
      addonsByService[treatment.id] = await getActiveAddonsFor(treatment.id);
    })
  );

  return (
    <BookingWizard
      treatments={treatments}
      addonsByService={addonsByService}
      cancellationPolicyText={policies.cancellation_policy_text}
      bookingHorizonDays={availability.booking_horizon_days}
      preselectedTreatmentId={preselectedTreatmentId}
    />
  );
}
