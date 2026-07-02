import { describe, it, expect } from "vitest";
import { TaxTierBanner } from "@/components/onboarding/tax-tier-banner";

describe("TaxTierBanner", () => {
  it("renders the tax information required heading", () => {
    const result = TaxTierBanner({});
    expect(JSON.stringify(result)).toContain("Tax information required");
  });

  it("mentions payouts are paused", () => {
    const result = TaxTierBanner({});
    expect(JSON.stringify(result)).toContain("paused");
  });

  it("lists the three required fields", () => {
    const str = JSON.stringify(TaxTierBanner({}));
    expect(str).toContain("Legal name");
    expect(str).toContain("Business address");
    expect(str).toContain("EIN");
  });
});
