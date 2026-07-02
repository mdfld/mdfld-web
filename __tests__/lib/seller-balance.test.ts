import { describe, it, expect } from "vitest";
import { getAvailableBalance } from "@/lib/seller-balance";

describe("getAvailableBalance", () => {
  it("returns pendingBalance minus lockedBalance", () => {
    expect(getAvailableBalance({ pendingBalance: 100, lockedBalance: 30 })).toBe(70);
  });

  it("returns 0 when lockedBalance exceeds pendingBalance", () => {
    expect(getAvailableBalance({ pendingBalance: 30, lockedBalance: 100 })).toBe(0);
  });

  it("returns full pendingBalance when lockedBalance is 0", () => {
    expect(getAvailableBalance({ pendingBalance: 50, lockedBalance: 0 })).toBe(50);
  });

  it("handles Decimal-like values with toString()", () => {
    const decimalLike = (value: string) => ({ toString: () => value });
    expect(
      getAvailableBalance({
        pendingBalance: decimalLike("100.50"),
        lockedBalance: decimalLike("25.25"),
      }),
    ).toBe(75.25);
  });
});
