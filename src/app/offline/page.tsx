import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אין חיבור לאינטרנט",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
      <span className="text-4xl">📶</span>
      <h1 className="font-brand text-2xl text-charcoal">אין חיבור לאינטרנט כרגע</h1>
      <p className="max-w-sm text-sm text-charcoal-soft">
        לצפייה בזמינות תורים ולקביעת תור צריך חיבור לאינטרנט. נא לבדוק את החיבור ולנסות שוב.
      </p>
    </div>
  );
}
