import { describe, it, expect } from "vitest";
import {
  EMPTY_ONBOARDING_STATE,
  BUYER_CHECKLIST,
  SELLER_CHECKLIST,
} from "@/types/onboarding";

describe("EMPTY_ONBOARDING_STATE", () => {
  it("has sellerOptIn as false", () => {
    expect(EMPTY_ONBOARDING_STATE.sellerOptIn).toBe(false);
  });

  it("has empty buyer, seller, and tours arrays", () => {
    expect(EMPTY_ONBOARDING_STATE.buyer).toEqual([]);
    expect(EMPTY_ONBOARDING_STATE.seller).toEqual([]);
    expect(EMPTY_ONBOARDING_STATE.tours).toEqual([]);
  });
});

describe("BUYER_CHECKLIST", () => {
  it("every step has an href", () => {
    for (const step of BUYER_CHECKLIST) {
      expect(step.href).toBeTruthy();
    }
  });

  it("complete-profile href points to profile settings", () => {
    const step = BUYER_CHECKLIST.find((s) => s.id === "complete-profile")!;
    expect(step.href).toBe("/dashboard/settings?tab=profile");
  });
});

describe("SELLER_CHECKLIST", () => {
  it("contains payout-details step (not payout-method)", () => {
    const ids = SELLER_CHECKLIST.map((s) => s.id);
    expect(ids).toContain("payout-details");
    expect(ids).not.toContain("payout-method");
  });

  it("list-product is the last step", () => {
    expect(SELLER_CHECKLIST[SELLER_CHECKLIST.length - 1].id).toBe("list-product");
  });

  it("org-logo is marked optional", () => {
    const step = SELLER_CHECKLIST.find((s) => s.id === "org-logo")!;
    expect(step.optional).toBe(true);
  });
});
