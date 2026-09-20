import { formatInTimeZone } from "date-fns-tz";
import { he } from "date-fns/locale";

export const BUSINESS_TIMEZONE = "Asia/Jerusalem";

export function formatILS(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceRange(price: number, priceMax: number | null, isFrom: boolean) {
  if (isFrom) return `החל מ-${formatILS(price)}`;
  if (priceMax && priceMax > price) return `${formatILS(price)}–${formatILS(priceMax)}`;
  return formatILS(price);
}

export function formatDateHe(isoDate: string | Date) {
  return formatInTimeZone(isoDate, BUSINESS_TIMEZONE, "EEEE, d בMMMM yyyy", { locale: he });
}

export function formatDateShortHe(isoDate: string | Date) {
  return formatInTimeZone(isoDate, BUSINESS_TIMEZONE, "d.M.yyyy", { locale: he });
}

export function formatTimeHe(isoDate: string | Date) {
  return formatInTimeZone(isoDate, BUSINESS_TIMEZONE, "HH:mm", { locale: he });
}

export function formatDurationHe(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} דקות`;
  if (mins === 0) return hours === 1 ? "שעה" : `${hours} שעות`;
  return `${hours === 1 ? "שעה" : `${hours} שעות`} ו-${mins} דקות`;
}
