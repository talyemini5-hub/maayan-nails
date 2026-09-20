import { describe, it, expect } from "vitest";
import {
  israeliPhoneSchema,
  customerDetailsSchema,
  createAppointmentRequestSchema,
} from "@/lib/validation/booking";
import { serviceFormSchema } from "@/lib/validation/admin";

describe("israeliPhoneSchema", () => {
  it("accepts a valid mobile number with dashes", () => {
    expect(israeliPhoneSchema.parse("052-329-8003")).toBe("0523298003");
  });

  it("accepts a valid mobile number with spaces", () => {
    expect(israeliPhoneSchema.parse("050 123 4567")).toBe("0501234567");
  });

  it("rejects a number that is too short", () => {
    expect(israeliPhoneSchema.safeParse("0501234").success).toBe(false);
  });

  it("rejects a number without a leading 0", () => {
    expect(israeliPhoneSchema.safeParse("523298003").success).toBe(false);
  });

  it("rejects letters", () => {
    expect(israeliPhoneSchema.safeParse("05012345ab").success).toBe(false);
  });
});

describe("customerDetailsSchema", () => {
  it("accepts valid customer details", () => {
    const result = customerDetailsSchema.safeParse({
      fullName: "מעיין כהן",
      phone: "0523298003",
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = customerDetailsSchema.safeParse({
      fullName: "מעיין כהן",
      phone: "0523298003",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a one-character name", () => {
    const result = customerDetailsSchema.safeParse({
      fullName: "מ",
      phone: "0523298003",
      email: "test@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAppointmentRequestSchema", () => {
  const base = {
    serviceId: "11111111-1111-4111-8111-111111111111",
    addonIds: [] as string[],
    startAt: new Date(Date.now() + 86_400_000).toISOString(),
    customer: {
      fullName: "מעיין כהן",
      phone: "0523298003",
      email: "test@example.com",
    },
    acceptedCancellationPolicy: true as const,
  };

  it("accepts a valid booking request", () => {
    expect(createAppointmentRequestSchema.safeParse(base).success).toBe(true);
  });

  it("rejects when the cancellation policy checkbox was not checked", () => {
    const result = createAppointmentRequestSchema.safeParse({ ...base, acceptedCancellationPolicy: false });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed service id", () => {
    const result = createAppointmentRequestSchema.safeParse({ ...base, serviceId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("serviceFormSchema", () => {
  it("accepts a valid treatment", () => {
    const result = serviceFormSchema.safeParse({
      kind: "treatment",
      name: "לק ג׳ל מבנה אנטומי",
      price: 140,
      durationMinutes: 60,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a priceMax lower than the base price", () => {
    const result = serviceFormSchema.safeParse({
      kind: "addon",
      name: "ציור",
      price: 50,
      priceMax: 10,
    });
    expect(result.success).toBe(false);
  });
});
