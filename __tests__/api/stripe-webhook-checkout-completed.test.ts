import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockOrderFindFirst,
  mockOrderCreate,
  mockOrderUpdate,
  mockBuyerProfileFindUnique,
  mockBuyerProfileUpdate,
  mockSellerProfileFindUnique,
  mockSellerProfileUpdate,
  mockProductUpdate,
  mockProductFindUnique,
  mockCartItemDeleteMany,
} = vi.hoisted(() => ({
  mockOrderFindFirst:         vi.fn().mockResolvedValue(null),
  mockOrderCreate:            vi.fn().mockResolvedValue({ id: "order-1" }),
  mockOrderUpdate:            vi.fn().mockResolvedValue({ id: "order-1" }),
  mockBuyerProfileFindUnique: vi.fn(),
  mockBuyerProfileUpdate:     vi.fn().mockResolvedValue({}),
  mockSellerProfileFindUnique: vi.fn(),
  mockSellerProfileUpdate:    vi.fn().mockResolvedValue({}),
  mockProductUpdate:          vi.fn().mockResolvedValue({}),
  mockProductFindUnique:      vi.fn().mockResolvedValue({ inventory: 5 }),
  mockCartItemDeleteMany:     vi.fn().mockResolvedValue({ count: 1 }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findFirst: mockOrderFindFirst,
      create: mockOrderCreate,
      update: mockOrderUpdate,
    },
    buyerProfile: {
      findUnique: mockBuyerProfileFindUnique,
      update: mockBuyerProfileUpdate,
    },
    sellerProfile: {
      findUnique: mockSellerProfileFindUnique,
      update: mockSellerProfileUpdate,
    },
    product: {
      update: mockProductUpdate,
      findUnique: mockProductFindUnique,
    },
    cartItem: {
      deleteMany: mockCartItemDeleteMany,
    },
  },
}));

vi.mock("@/lib/trade-webhook", () => ({
  handleTradeCashPayment: vi.fn(),
}));

import { handleCheckoutSessionCompleted } from "@/lib/checkout-webhook";

const ITEM_PRICE = 50;
const ITEM_QUANTITY = 2;
const SUBTOTAL = ITEM_PRICE * ITEM_QUANTITY; // 100
const COMMISSION_RATE = 0.10;

const baseSession = {
  id: "sess_test",
  payment_intent: "pi_test",
  amount_total: SUBTOTAL * 100, // cents
  customer_details: null,
  metadata: {
    userId: "user-1",
    item_0: JSON.stringify({
      productId: "product-1",
      quantity: ITEM_QUANTITY,
      price: ITEM_PRICE,
      sellerId: "seller-1",
      applicationFee: 0,
    }),
  },
} as any;

describe("handleCheckoutSessionCompleted - lockedBalance increment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderFindFirst.mockResolvedValue(null);
    mockOrderCreate.mockResolvedValue({ id: "order-1" });
    mockOrderUpdate.mockResolvedValue({ id: "order-1" });
    mockBuyerProfileFindUnique.mockResolvedValue({ id: "buyer-1", userId: "user-1" });
    mockBuyerProfileUpdate.mockResolvedValue({});
    mockSellerProfileFindUnique.mockResolvedValue({ id: "seller-1", commissionRate: COMMISSION_RATE });
    mockProductUpdate.mockResolvedValue({});
    mockProductFindUnique.mockResolvedValue({ inventory: 5 });
    mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("increments pendingBalance and lockedBalance by the same sellerReceives amount", async () => {
    await handleCheckoutSessionCompleted(baseSession);

    expect(mockSellerProfileUpdate).toHaveBeenCalledTimes(1);
    const updateCall = mockSellerProfileUpdate.mock.calls[0][0];

    const expectedApplicationFee = SUBTOTAL * COMMISSION_RATE;
    const expectedSellerReceives = SUBTOTAL - expectedApplicationFee;

    expect(updateCall.where).toEqual({ id: "seller-1" });
    expect(updateCall.data.pendingBalance.increment).toBe(expectedSellerReceives);
    expect(updateCall.data.lockedBalance.increment).toBe(expectedSellerReceives);
    expect(updateCall.data.pendingBalance.increment).toBe(updateCall.data.lockedBalance.increment);
  });

  it("sets Order.applicationFeeAmount to subtotal * commissionRate", async () => {
    await handleCheckoutSessionCompleted(baseSession);

    const expectedApplicationFee = SUBTOTAL * COMMISSION_RATE;

    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { applicationFeeAmount: expectedApplicationFee },
    });
  });
});
