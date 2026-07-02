import { describe, it, expect, vi } from "vitest";
import { SellerNudgeCard } from "@/components/onboarding/seller-nudge-card";

describe("SellerNudgeCard", () => {
  it("renders the heading", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Want to sell on MDFLD");
  });

  it("renders a Get started button", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Get started");
  });

  it("renders a Dismiss option", () => {
    const result = SellerNudgeCard({ onGetStarted: vi.fn(), onDismiss: vi.fn() });
    expect(JSON.stringify(result)).toContain("Dismiss");
  });
});
