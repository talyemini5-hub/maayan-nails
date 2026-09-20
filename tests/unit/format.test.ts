import { describe, it, expect } from "vitest";
import { formatILS, formatPriceRange, formatDurationHe } from "@/lib/format";

describe("formatILS", () => {
  it("formats a whole-shekel amount", () => {
    expect(formatILS(140)).toContain("140");
  });
});

describe("formatPriceRange", () => {
  it("shows a single price when there is no range and it's not a 'from' price", () => {
    expect(formatPriceRange(140, null, false)).toBe(formatILS(140));
  });

  it("shows a range when priceMax is greater than price", () => {
    const result = formatPriceRange(10, 50, false);
    expect(result).toContain(formatILS(10));
    expect(result).toContain(formatILS(50));
  });

  it("shows a 'starting from' price when isFrom is true", () => {
    expect(formatPriceRange(140, null, true)).toContain("החל מ-");
  });
});

describe("formatDurationHe", () => {
  it("formats minutes only", () => {
    expect(formatDurationHe(45)).toBe("45 דקות");
  });

  it("formats exactly one hour", () => {
    expect(formatDurationHe(60)).toBe("שעה");
  });

  it("formats hours and minutes", () => {
    expect(formatDurationHe(90)).toBe("שעה ו-30 דקות");
  });

  it("formats multiple hours and minutes", () => {
    expect(formatDurationHe(150)).toBe("2 שעות ו-30 דקות");
  });

  it("formats multiple whole hours", () => {
    expect(formatDurationHe(120)).toBe("2 שעות");
  });
});
