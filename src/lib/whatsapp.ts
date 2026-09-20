const WHATSAPP_INTL_NUMBER = "972523298003"; // no leading + or 0, per wa.me format

export function buildWhatsAppUrl(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_INTL_NUMBER}?text=${encoded}`;
}

export function whatsAppMessageForAppointment(params: { dateLabel: string; timeLabel: string }) {
  return `היי מעיין 😊\nאני פונה אלייך לגבי התור שלי ב-Maayan Nails בתאריך ${params.dateLabel} בשעה ${params.timeLabel}.`;
}

export function whatsAppGeneralInquiry() {
  return `היי מעיין 😊\nאשמח לקבל פרטים נוספים על טיפולים ב-Maayan Nails.`;
}
