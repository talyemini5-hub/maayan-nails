import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { WorkingHoursForm } from "@/components/admin/working-hours-form";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { getWorkingHours } from "@/lib/data/working-hours";

export const metadata: Metadata = { title: "הגדרות | ניהול", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const [{ businessInfo, availability, policies }, hours] = await Promise.all([getBusinessSettings(), getWorkingHours()]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">הגדרות</h1>
        <p className="mt-1 text-sm text-charcoal-soft">פרטי העסק, מדיניות וזמינות — משפיע מיידית על האתר הציבורי.</p>
      </div>

      <SettingsForm businessInfo={businessInfo} availability={availability} policies={policies} />

      <div>
        <h2 className="mb-4 font-brand text-lg text-charcoal">שעות עבודה</h2>
        <WorkingHoursForm hours={hours} />
      </div>
    </div>
  );
}
