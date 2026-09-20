import type { Metadata } from "next";
import { ServicesManager } from "@/components/admin/services-manager";
import { getAddonLinksByTreatment, getAllServicesForAdmin } from "@/lib/data/admin-services";

export const metadata: Metadata = { title: "שירותים ומחירים | ניהול", robots: { index: false, follow: false } };

export default async function AdminServicesPage() {
  const [services, linkedAddonsByService] = await Promise.all([getAllServicesForAdmin(), getAddonLinksByTreatment()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">שירותים ומחירים</h1>
        <p className="mt-1 text-sm text-charcoal-soft">עדכון כאן משפיע מיידית על אשף קביעת התור באתר.</p>
      </div>
      <ServicesManager services={services} linkedAddonsByService={linkedAddonsByService} />
    </div>
  );
}
