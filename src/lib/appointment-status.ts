import type { AppointmentStatus } from "@/types/database";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_approval: "ממתין לאישור",
  scheduled: "נקבע",
  confirmed: "מאושר",
  declined: "נדחה",
  arrived: "הגיעה",
  in_progress: "בטיפול",
  completed: "הושלם",
  cancelled: "בוטל",
  no_show: "לא הגיעה",
};

export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending_approval: "bg-dusty-rose/25 text-charcoal",
  scheduled: "bg-burgundy/10 text-burgundy",
  confirmed: "bg-burgundy/10 text-burgundy",
  declined: "bg-charcoal/10 text-charcoal-soft",
  arrived: "bg-burgundy/10 text-burgundy",
  in_progress: "bg-burgundy/10 text-burgundy",
  completed: "bg-charcoal/10 text-charcoal-soft",
  cancelled: "bg-charcoal/10 text-charcoal-soft line-through decoration-1",
  no_show: "bg-charcoal/10 text-charcoal-soft",
};

const ACTIVE_STATUSES: AppointmentStatus[] = ["pending_approval", "scheduled", "confirmed", "arrived", "in_progress"];

export function isActiveAppointment(status: AppointmentStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export function isUpcoming(status: AppointmentStatus, startAt: string) {
  return isActiveAppointment(status) && new Date(startAt).getTime() > Date.now();
}
