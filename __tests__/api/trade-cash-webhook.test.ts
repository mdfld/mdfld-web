import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockTradeOfferFindUnique,
  mockTradeOfferUpdate,
  mockProductUpdate,
  mockNotificationCreate,
} = vi.hoisted(() => ({
  mockTradeOfferFindUnique: vi.fn(),
  mockTradeOfferUpdate: vi.fn().mockResolvedValue({ id: "offer-1" }),
  mockProductUpdate: vi.fn().mockResolvedValue({}),
  mockNotificationCreate: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate },
    product: { update: mockProductUpdate },
    notification: { create: mockNotificationCreate },
  },
}));

import { handleTradeCashPayment } from "@/lib/trade-webhook";

const baseSession = {
  id: "sess_test",
  metadata: {
    type: "TRADE_CASH_PAYMENT",
    tradeOfferId: "offer-1",
    conversationId: "conv-1",
  },
} as any;

describe("handleTradeCashPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("advances AWAITING_PAYMENT offer to ACCEPTED and deactivates offered product", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", status: "AWAITING_PAYMENT",
      proposerId: "user-1", recipientId: "seller-1",
      offeredProductId: "product-offered",
      conversationId: "conv-1",
    });
    await handleTradeCashPayment(baseSession);
    expect(mockTradeOfferUpdate).toHaveBeenCalledWith({ where: { id: "offer-1" }, data: { status: "ACCEPTED" } });
    expect(mockProductUpdate).toHaveBeenCalledWith({ where: { id: "product-offered" }, data: { isActive: false } });
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });

  it("is a no-op if trade is not AWAITING_PAYMENT (idempotent)", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", status: "ACCEPTED",
      proposerId: "user-1", recipientId: "seller-1",
      offeredProductId: null, conversationId: "conv-1",
    });
    await handleTradeCashPayment(baseSession);
    expect(mockTradeOfferUpdate).not.toHaveBeenCalled();
  });

  it("is a no-op if offer not found", async () => {
    mockTradeOfferFindUnique.mockResolvedValue(null);
    await handleTradeCashPayment(baseSession);
    expect(mockTradeOfferUpdate).not.toHaveBeenCalled();
  });

  it("skips product.update when no offeredProductId", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", status: "AWAITING_PAYMENT",
      proposerId: "user-1", recipientId: "seller-1",
      offeredProductId: null, conversationId: "conv-1",
    });
    await handleTradeCashPayment(baseSession);
    expect(mockTradeOfferUpdate).toHaveBeenCalled();
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });
});
