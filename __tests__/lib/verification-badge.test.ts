import { describe, it, expect } from "vitest";
import {
  getVerificationBadge,
  getVerificationStatusOption,
  VERIFICATION_BADGES,
  VERIFICATION_STATUS_OPTIONS,
} from "@/lib/verification-badge";

describe("getVerificationBadge", () => {
  it("returns Verified Authentic badge info for VERIFIED_AUTHENTIC", () => {
    expect(getVerificationBadge("VERIFIED_AUTHENTIC")).toEqual(
      VERIFICATION_BADGES.VERIFIED_AUTHENTIC,
    );
    expect(getVerificationBadge("VERIFIED_AUTHENTIC")?.label).toBe("Verified Authentic");
  });

  it("returns Verified Replica badge info for VERIFIED_REPLICA", () => {
    expect(getVerificationBadge("VERIFIED_REPLICA")?.label).toBe("Verified Replica");
  });

  it("returns undefined for UNVERIFIED", () => {
    expect(getVerificationBadge("UNVERIFIED")).toBeUndefined();
  });

  it("returns Fan-Made badge info for FAN_MADE", () => {
    const badge = getVerificationBadge("FAN_MADE");
    expect(badge?.label).toBe("Fan-Made");
    expect(badge?.icon).toBe("solar:question-circle-linear");
    expect(badge?.textClassName).toBe("text-default-400");
    expect(badge).toEqual(VERIFICATION_BADGES.FAN_MADE);
  });

  it("returns undefined for null or undefined input", () => {
    expect(getVerificationBadge(null)).toBeUndefined();
    expect(getVerificationBadge(undefined)).toBeUndefined();
  });
});

describe("getVerificationStatusOption", () => {
  it("returns the matching option for each known status", () => {
    expect(getVerificationStatusOption("UNVERIFIED")).toEqual(VERIFICATION_STATUS_OPTIONS[0]);
    expect(getVerificationStatusOption("VERIFIED_AUTHENTIC")?.label).toBe("Verified Authentic");
    expect(getVerificationStatusOption("VERIFIED_REPLICA")?.label).toBe("Verified Replica");
  });

  it("falls back to the UNVERIFIED option for unknown or missing status", () => {
    expect(getVerificationStatusOption(undefined)).toEqual(VERIFICATION_STATUS_OPTIONS[0]);
    expect(getVerificationStatusOption("garbage")).toEqual(VERIFICATION_STATUS_OPTIONS[0]);
  });

  it("keeps the admin label 'Unverified' for UNVERIFIED, independent of the storefront Fan-Made badge", () => {
    expect(getVerificationStatusOption("UNVERIFIED").label).toBe("Unverified");
  });

  it("returns the Fan-Made label for FAN_MADE", () => {
    expect(getVerificationStatusOption("FAN_MADE").label).toBe("Fan-Made");
  });
});
