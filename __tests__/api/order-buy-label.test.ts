import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const {
  mockOrderFindUnique,
  mockOrderUpdate,
  mockOrgMemberFindFirst,
  mockBuyShippingLabel,
  mockCreateOrGetTracking,
} = vi.hoisted(() => ({
  mockOrderFindUnique:     vi.fn(),
  mockOrderUpdate:         vi.fn().mockResolvedValue({ id: "order-1", labelUrl: "https://cdn.easypost.com/label.pdf" }),
  mockOrgMemberFindFirst:  vi.fn().mockResolvedValue(null),
  mockBuyShippingLabel:    vi.fn().mockResolvedValue({
    shipmentId:     "shp_test",
    labelUrl:       "https://cdn.easypost.com/label.pdf",
    trackingNumber: "9400111899223397861234",
    carrier:        "USPS",
    rateCents:      850,
  }),
  mockCreateOrGetTracking: vi.fn().mockResolvedValue({ tag: "InfoReceived", carrierConfirmed: false }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: mockOrderFindUnique, update: mockOrderUpdate },
    organizationMember: { findFirst: mockOrgMemberFindFirst },
  },
}));

vi.mock("@/lib/easypost", () => ({
  buyShippingLabel:     mockBuyShippingLabel,
  createOrGetTracking:  mockCreateOrGetTracking,
}));

vi.mock("@/lib/aftership", () => ({
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
    organizationMember: { findFirst: mockOrgMemberFindFirst },
  } as any,
};

const baseOrder = {
  id: "order-1",
  orderNumber: "ORD-001",
  status: "CONFIRMED",
  labelBoughtAt: null,
  labelUrl: null,
  seller: { userId: "seller-user-1", organizationId: null },
  organization: {
    addressStreet:  "1 Seller St",
    addressCity:    "Atlanta",
    addressState:   "GA",
    addressZip:     "30301",
    addressCountry: "US",
  },
  shippingAddress: {
    name:    "John Buyer",
    street:  "2 Buyer Ave",
    city:    "New York",
    state:   "NY",
    zip:     "10001",
    country: "US",
  },
  items: [
    {
      quantity: 1,
      product: {
        weight: 16,
        dimensions: { length: 12, width: 10, height: 6 },
      },
    },
  ],
  buyer: { userId: "buyer-user-1" },
};

describe("order.buyLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgMemberFindFirst.mockResolvedValue(null);
    mockOrderUpdate.mockResolvedValue({ id: "order-1", labelUrl: "https://cdn.easypost.com/label.pdf" });
    mockBuyShippingLabel.mockResolvedValue({
      shipmentId:     "shp_test",
      labelUrl:       "https://cdn.easypost.com/label.pdf",
      trackingNumber: "9400111899223397861234",
      carrier:        "USPS",
      rateCents:      850,
    });
    mockCreateOrGetTracking.mockResolvedValue({ tag: "InfoReceived", carrierConfirmed: false });
  });

  it("happy path: buys label, updates order, calls tracking", async () => {
    mockOrderFindUnique.mockResolvedValue(baseOrder);

    const caller = createCaller(sellerCtx);
    const result = await caller.buyLabel({ orderId: "order-1" });

    expect(result).toEqual({ labelUrl: "https://cdn.easypost.com/label.pdf" });

    expect(mockBuyShippingLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        fromAddress: expect.objectContaining({ street: "1 Seller St" }),
        toAddress:   expect.objectContaining({ street: "2 Buyer Ave" }),
        reference:   "ORD-001",
      }),
    );

    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          easypostShipmentId:  "shp_test",
          labelUrl:            "https://cdn.easypost.com/label.pdf",
          labelTrackingNumber: "9400111899223397861234",
          labelCarrier:        "USPS",
          labelBoughtAt:       expect.any(Date),
          trackingNumber:      "9400111899223397861234",
          trackingCarrier:     "USPS",
        }),
      }),
    );

    expect(mockCreateOrGetTracking).toHaveBeenCalledWith("9400111899223397861234", "USPS");
  });

  it("idempotency: returns existing label without calling buyShippingLabel", async () => {
    mockOrderFindUnique.mockResolvedValue({
      ...baseOrder,
      labelBoughtAt: new Date(),
      labelUrl:      "https://cdn.easypost.com/existing.pdf",
    });

    const caller = createCaller(sellerCtx);
    const result = await caller.buyLabel({ orderId: "order-1" });

    expect(result).toEqual({ labelUrl: "https://cdn.easypost.com/existing.pdf" });
    expect(mockBuyShippingLabel).not.toHaveBeenCalled();
  });

  it("wrong seller: throws FORBIDDEN", async () => {
    mockOrderFindUnique.mockResolvedValue({
      ...baseOrder,
      seller: { userId: "someone-else", organizationId: null },
    });

    const caller = createCaller(sellerCtx);
    await expect(caller.buyLabel({ orderId: "order-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("wrong status: throws BAD_REQUEST", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...baseOrder, status: "SHIPPED" });

    const caller = createCaller(sellerCtx);
    await expect(caller.buyLabel({ orderId: "order-1" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
