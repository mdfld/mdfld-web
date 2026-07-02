import { describe, it, expect, vi } from "vitest";

// Mock react useState so the component can be called as a plain function
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (initial: unknown) => [initial, vi.fn()],
  };
});

// Mock trpc mutations
vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    trade: {
      respondToOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      cancelOffer: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      uploadTracking: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPaymentLink: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock @heroui/react components to simple pass-through elements
vi.mock("@heroui/react", () => {
  const React = require("react");
  const make =
    (tag: string) =>
    (props: Record<string, unknown>) =>
      React.createElement(tag, {}, props.children ?? props.label ?? null);
  return {
    Button: (props: Record<string, unknown>) =>
      React.createElement("button", {}, props.children),
    Chip: (props: Record<string, unknown>) =>
      React.createElement("span", {}, props.children),
    Image: (props: Record<string, unknown>) =>
      React.createElement("img", { alt: props.alt }),
    Input: make("input"),
  };
});

// Mock @iconify/react
vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("span", { "data-icon": props.icon });
  },
}));

import TradeOfferCard from "@/components/dashboard/inbox/trade-offer-card";

const baseOffer = {
  id: "offer-1",
  proposerId: "user-1",
  recipientId: "seller-1",
  status: "PENDING",
  cashAmount: null,
  offeredProductId: "prod-offered",
  requestedProductId: "prod-requested",
  conversationId: "conv-1",
  proposerTrackingNumber: null,
  recipientTrackingNumber: null,
  requestedProduct: { id: "prod-requested", title: "Mbappe Sticker", price: 15, images: [] },
  offeredProduct: { id: "prod-offered", title: "Ronaldo Sticker", price: 12, images: [] },
  proposer: { id: "user-1", name: "Buyer" },
  recipient: { id: "seller-1", name: "Seller" },
};

describe("TradeOfferCard", () => {
  it("recipient sees Accept and Decline when PENDING", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: baseOffer as any, currentUserId: "seller-1" }),
    );
    expect(result).toContain("Accept");
    expect(result).toContain("Decline");
  });

  it("proposer sees Cancel when PENDING", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: baseOffer as any, currentUserId: "user-1" }),
    );
    expect(result).toContain("Cancel Offer");
    expect(result).not.toContain('"Accept"');
  });

  it("shows Upload Tracking button when ACCEPTED", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: { ...baseOffer, status: "ACCEPTED" } as any, currentUserId: "user-1" }),
    );
    expect(result).toContain("Upload Tracking");
  });

  it("shows Trade Complete banner when COMPLETED", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: { ...baseOffer, status: "COMPLETED" } as any, currentUserId: "user-1" }),
    );
    expect(result).toContain("Trade Complete");
    expect(result).not.toContain("Upload Tracking");
  });

  it("proposer sees Complete Payment when AWAITING_PAYMENT", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: { ...baseOffer, status: "AWAITING_PAYMENT" } as any, currentUserId: "user-1" }),
    );
    expect(result).toContain("Complete Payment");
  });

  it("recipient sees waiting label when AWAITING_PAYMENT", () => {
    const result = JSON.stringify(
      TradeOfferCard({ offer: { ...baseOffer, status: "AWAITING_PAYMENT" } as any, currentUserId: "seller-1" }),
    );
    expect(result).toContain("Waiting for buyer payment");
  });
});
