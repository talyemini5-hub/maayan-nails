import type { Appointment, Service } from "@/types/database";
import type { CustomerDetailsInput } from "@/lib/validation/booking";

export type WizardStep = "treatment" | "addons" | "date" | "time" | "details" | "summary" | "done";

export const STEP_ORDER: WizardStep[] = ["treatment", "addons", "date", "time", "details", "summary"];

export const STEP_LABELS: Record<WizardStep, string> = {
  treatment: "טיפול",
  addons: "תוספות",
  date: "תאריך",
  time: "שעה",
  details: "פרטים",
  summary: "סיכום",
  done: "הושלם",
};

export type AvailableSlot = { slot_start: string; slot_end: string };

export type BookingState = {
  treatment: Service | null;
  selectedAddonIds: string[];
  date: string | null; // YYYY-MM-DD
  slot: AvailableSlot | null;
  customer: CustomerDetailsInput | null;
  acceptedPolicy: boolean;
};

export const initialBookingState: BookingState = {
  treatment: null,
  selectedAddonIds: [],
  date: null,
  slot: null,
  customer: null,
  acceptedPolicy: false,
};

export type SubmitResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: string; message: string };
