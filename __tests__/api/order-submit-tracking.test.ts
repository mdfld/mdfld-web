import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockOrderFindUnique,
  mockOrderUpdate,
  mockNotificationCreate,
  mockSellerProfileUpdate,
  mockOrgMemberFindFirst,
  mockCreateOrGetTracking,
} = vi.hoisted(() => ({
  mockOrderFindUnique:     vi.fn(),
  mockOrderUpdate:         vi.fn().mockResolvedValue({ id: "order-1" }),
  mockNotificationCreate:  vi.fn().mockResolvedValue({ id: "notification-1" }),
  mockSellerProfileUpdate: vi.fn().mockResolvedValue({ id: "seller-profile-1" }),
  mockOrgMemberFindFirst:  vi.fn().mockResolvedValue(null),
  mockCreateOrGetTracking: vi.fn().mockResolvedValue({ tag: "InfoReceived", carrierConfirmed: false }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: mockOrderFindUnique, update: mockOrderUpdate },
    notification: { create: mockNotificationCreate },
    sellerProfile: { update: mockSellerProfileUpdate },
    organizationMember: { findFirst: mockOrgMemberFindFirst },
  },
}));

vi.mock("@/lib/aftership", () => ({
  createOrGetTracking: mockCreateOrGetTracking,
}));

vi.mock("@/lib/easypost", () => ({
  buyShippingLabel: vi.fn(),
  createOrGetTracking: mockCreateOrGetTracking,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {},
}));

import { createCallerFactory } from "@/server/trpc";
import { orderRouter } from "@/server/routers/order";

const createCaller = createCallerFactory(orderRouter);

const sellerCtx = {
  req: {} as any,
  res: {} as any,
  session: { session: {} as any, user: { id: "seller-user-1", name: "Seller" } } as any,
  user: { id: "seller-user-1", name: "Seller" } as any,
  prisma: {
    order: { findUnique: mockOrderFindUnique, update: mockOrderUpdate },
    notification: { create: mockNotificationCreate },
    sellerProfile: { update: mockSellerProfileUpdate },
    organizationMember: { findFirst: mockOrgMemberFindFirst },
  } as any,
};

const baseOrder = {
  id: "order-1",
  orderNumber: "ORD-001",
  status: "CONFIRMED",
  subtotal: 100,
  applicationFeeAmount: 10,
  sellerProfileId: "seller-profile-1",
  carrierConfirmedAt: null as Date | null,
  trackingNumber: null,
  trackingCarrier: null,
  trackingStatus: null,
  seller: { userId: "seller-user-1", organizationId: null },
  buyer: { userId: "buyer-user-1", user: { id: "buyer-user-1" } },
};

describe("order.submitTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgMemberFindFirst.mockResolvedValue(null);
    mockOrderUpdate.mockResolvedValue({ id: "order-1" });
    mockNotificationCreate.mockResolvedValue({ id: "notification-1" });
    mockSellerProfileUpdate.mockResolvedValue({ id: "seller-profile-1" });
  });

  it("decrements lockedBalance by 90 on first carrier confirmation", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...baseOrder, carrierConfirmedAt: null });
    mockCreateOrGetTracking.mockResolvedValue({ tag: "InTransit", carrierConfirmed: true });

    const caller = createCaller(sellerCtx);
    const result = await caller.submitTracking({
      orderId: "order-1",
      trackingNumber: "9400111899223397861234",
      trackingCarrier: "USPS",
    });

    expect(mockSellerProfileUpdate).toHaveBeenCalledWith({
      where: { id: "seller-profile-1" },
      data: { lockedBalance: { decrement: 90 } },
    });

    expect(result.message).toBe(
      "Tracking confirmed. Your earnings for this order are now available for withdrawal.",
    );
  });

  it("does not decrement lockedBalance when carrier has not confirmed", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...baseOrder, carrierConfirmedAt: null });
    mockCreateOrGetTracking.mockResolvedValue({ tag: "InfoReceived", carrierConfirmed: false });

    const caller = createCaller(sellerCtx);
    const result = await caller.submitTracking({
      orderId: "order-1",
      trackingNumber: "9400111899223397861234",
      trackingCarrier: "USPS",
    });

    expect(mockSellerProfileUpdate).not.toHaveBeenCalled();

    expect(result.message).toBe(
      "Tracking saved. Earnings for this order will become available once the carrier confirms pickup.",
    );
  });

  it("does not double-decrement if carrier was already confirmed", async () => {
    mockOrderFindUnique.mockResolvedValue({
      ...baseOrder,
      carrierConfirmedAt: new Date("2026-01-01"),
    });
    mockCreateOrGetTracking.mockResolvedValue({ tag: "InTransit", carrierConfirmed: true });

    const caller = createCaller(sellerCtx);
    const result = await caller.submitTracking({
      orderId: "order-1",
      trackingNumber: "9400111899223397861234",
      trackingCarrier: "USPS",
    });

    expect(mockSellerProfileUpdate).not.toHaveBeenCalled();

    expect(result.message).toBe(
      "Tracking confirmed. Your earnings for this order are now available for withdrawal.",
    );
  });
});
