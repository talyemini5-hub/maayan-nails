import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl, whatsAppMessageForAppointment } from "@/lib/whatsapp";

describe("buildWhatsAppUrl", () => {
  it("points at the business international number", () => {
    expect(buildWhatsAppUrl("hi")).toContain("https://wa.me/972523298003");
  });

  it("url-encodes the message", () => {
    const url = buildWhatsAppUrl("שלום מעיין");
    expect(url).toContain(encodeURIComponent("שלום מעיין"));
  });
});

describe("whatsAppMessageForAppointment", () => {
  it("includes the date and time in the prefilled message", () => {
    const message = whatsAppMessageForAppointment({ dateLabel: "20.9.2026", timeLabel: "14:00" });
    expect(message).toContain("20.9.2026");
    expect(message).toContain("14:00");
    expect(message).toContain("Maayan Nails");
  });
});
