import { formatDateHe, formatILS, formatTimeHe } from "@/lib/format";
import type { NotificationType } from "@/types/database";

export interface AppointmentEmailData {
  customerName: string;
  serviceName: string;
  startAt: string;
  price: number;
  address: string;
  reason?: string | null;
}

const WRAPPER_STYLE =
  "font-family: Heebo, Arial, sans-serif; direction: rtl; text-align: right; background:#fbf8f4; padding:32px 16px; color:#2c2725;";
const CARD_STYLE =
  "max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px -12px rgba(44,39,37,0.18);";
const BRAND_STYLE = "font-size:22px;letter-spacing:2px;color:#6e2b3a;margin:0 0 24px;text-align:center;";
const BUTTON_STYLE =
  "display:inline-block;background:#6e2b3a;color:#fbf8f4;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;margin-top:16px;";

function wrap(bodyHtml: string) {
  return `<!DOCTYPE html><html lang="he" dir="rtl"><body style="${WRAPPER_STYLE}"><div style="${CARD_STYLE}"><p style="${BRAND_STYLE}">MAAYAN NAILS</p>${bodyHtml}</div></body></html>`;
}

function detailsTable(data: AppointmentEmailData) {
  return `
    <table style="width:100%;font-size:14px;color:#4a423d;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;">טיפול:</td><td style="padding:6px 0;font-weight:600;">${data.serviceName}</td></tr>
      <tr><td style="padding:6px 0;">תאריך:</td><td style="padding:6px 0;font-weight:600;">${formatDateHe(data.startAt)}</td></tr>
      <tr><td style="padding:6px 0;">שעה:</td><td style="padding:6px 0;font-weight:600;">${formatTimeHe(data.startAt)}</td></tr>
      <tr><td style="padding:6px 0;">מחיר:</td><td style="padding:6px 0;font-weight:600;">${formatILS(data.price)}</td></tr>
      <tr><td style="padding:6px 0;">כתובת:</td><td style="padding:6px 0;font-weight:600;">${data.address}</td></tr>
    </table>`;
}

export function buildEmailForNotification(type: NotificationType, data: AppointmentEmailData): { subject: string; html: string } {
  switch (type) {
    case "appointment_requested":
      return {
        subject: "בקשת התור שלך התקבלה — Maayan Nails",
        html: wrap(
          `<p>היי ${data.customerName},</p><p>בקשת התור שלך התקבלה וממתינה לאישור מעיין. נעדכן אותך ברגע שהתור יאושר.</p>${detailsTable(data)}`
        ),
      };
    case "appointment_confirmed":
      return {
        subject: "התור שלך אושר! — Maayan Nails",
        html: wrap(`<p>היי ${data.customerName},</p><p>התור שלך אושר ומחכה לך ביומן 💅</p>${detailsTable(data)}`),
      };
    case "appointment_declined":
      return {
        subject: "עדכון לגבי בקשת התור — Maayan Nails",
        html: wrap(
          `<p>היי ${data.customerName},</p><p>לצערנו לא ניתן לאשר את בקשת התור למועד שביקשת${data.reason ? `: ${data.reason}` : "."}</p><p>נשמח לראותך במועד אחר — אפשר לתאם תור חדש דרך האתר.</p>`
        ),
      };
    case "appointment_rescheduled":
      return {
        subject: "התור שלך עודכן — Maayan Nails",
        html: wrap(`<p>היי ${data.customerName},</p><p>התור שלך עודכן למועד הבא:</p>${detailsTable(data)}`),
      };
    case "appointment_cancelled":
      return {
        subject: "התור שלך בוטל — Maayan Nails",
        html: wrap(`<p>היי ${data.customerName},</p><p>התור הבא בוטל בהצלחה:</p>${detailsTable(data)}`),
      };
    case "appointment_reminder":
      return {
        subject: "תזכורת לתור מחר — Maayan Nails",
        html: wrap(
          `<p>היי ${data.customerName},</p><p>רק להזכיר שמחכה לך תור מחר 😊</p>${detailsTable(data)}<div style="text-align:center"><a style="${BUTTON_STYLE}" href="https://wa.me/972523298003">כתבי לנו בוואטסאפ</a></div>`
        ),
      };
  }
}
