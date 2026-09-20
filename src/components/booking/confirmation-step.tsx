import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { formatDateHe, formatTimeHe } from "@/lib/format";
import type { Appointment } from "@/types/database";

export function ConfirmationStep({ appointment }: { appointment: Appointment }) {
  const isPending = appointment.appointment_status === "pending_approval";

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 text-3xl text-burgundy">
        {isPending ? "🕒" : "✓"}
      </span>

      <div>
        <h2 className="font-brand text-2xl text-charcoal">{isPending ? "הבקשה שלך התקבלה!" : "התור שלך נקבע!"}</h2>
        <p className="mt-2 text-sm text-charcoal-soft">
          {isPending
            ? "מעיין תאשר את הבקשה בהקדם ותקבלי עדכון באימייל."
            : "שלחנו לך אישור לאימייל. מחכות לך!"}
        </p>
      </div>

      <div className="rounded-2xl bg-cream/60 px-6 py-4 text-sm text-charcoal">
        <p className="font-medium">{formatDateHe(appointment.start_at)}</p>
        <p className="text-charcoal-soft">{formatTimeHe(appointment.start_at)}</p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button href="/" size="lg" variant="secondary">
          חזרה לעמוד הבית
        </Button>
        <Button href="/my-appointments" size="lg">
          התורים שלי
        </Button>
      </div>

      <WhatsAppButton message="שלום! יש לי שאלה לגבי התור שקבעתי עכשיו." label="שאלה? דברי איתנו בוואטסאפ" />
    </div>
  );
}
