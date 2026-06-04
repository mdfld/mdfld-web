import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const {
  mockProductFindUnique,
  mockTradeOfferFindFirst,
  mockNotificationCreate,
  mockTransaction,
  mockMessageCreate,
  mockTradeOfferFindUnique,
  mockTradeOfferUpdate,
  mockTradeOfferFindMany,
  mockConversationParticipantFindUnique,
} = vi.hoisted(() => {
  const convCreate = vi.fn().mockResolvedValue({ id: "conv-1" });
  const offerCreate = vi.fn().mockResolvedValue({ id: "offer-1", conversationId: "conv-1" });
  return {
    mockProductFindUnique: vi.fn(),
    mockTradeOfferFindFirst: vi.fn().mockResolvedValue(null),
    mockNotificationCreate: vi.fn().mockResolvedValue({}),
    mockMessageCreate: vi.fn().mockResolvedValue({ id: "msg-1" }),
    mockTransaction: vi.fn().mockImplementation(async (fn: any) =>
      fn({ conversation: { create: convCreate }, tradeOffer: { create: offerCreate } })
    ),
    mockTradeOfferFindUnique: vi.fn(),
    mockTradeOfferUpdate: vi.fn().mockResolvedValue({ id: "offer-1", status: "ACCEPTED" }),
    mockTradeOfferFindMany: vi.fn().mockResolvedValue([]),
    mockConversationParticipantFindUnique: vi.fn().mockResolvedValue({ userId: "user-1" }),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: mockProductFindUnique },
    tradeOffer: { findFirst: mockTradeOfferFindFirst, findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate, findMany: mockTradeOfferFindMany },
    notification: { create: mockNotificationCreate },
    message: { create: mockMessageCreate },
    $transaction: mockTransaction,
    conversationParticipant: { findUnique: mockConversationParticipantFindUnique },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/redis", () => ({
  publishMessage: vi.fn(),
  publishMessageStatus: vi.fn(),
  publishTypingStatus: vi.fn(),
  cacheMessage: vi.fn(),
  setUserPresence: vi.fn(),
  redis: null,
}));
vi.mock("@/lib/aes-e2ee", () => ({
  AES256E2EE: {
    encryptForConversation: vi.fn().mockReturnValue({ "user-1": "enc", "seller-1": "enc" }),
  },
}));

import { createCallerFactory } from "@/server/trpc";
import { tradeRouter } from "@/server/routers/trade";

const createCaller = createCallerFactory(tradeRouter);

const buyerCtx = {
  req: {} as any,
  res: {} as any,
  session: { session: {} as any, user: { id: "user-1", name: "Buyer" } } as any,
  user: { id: "user-1", name: "Buyer" } as any,
  prisma: {
    product: { findUnique: mockProductFindUnique },
    tradeOffer: { findFirst: mockTradeOfferFindFirst },
    notification: { create: mockNotificationCreate },
    message: { create: mockMessageCreate },
    $transaction: mockTransaction,
  } as any,
};

const tradeEnabledProduct = {
  id: "product-1",
  tradeEnabled: true,
  seller: { userId: "seller-1", organizationId: null },
};

const offeredProduct = {
  id: "offered-1",
  tradeEnabled: true,
  seller: { userId: "user-1" },
};

describe("trade.proposeOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTradeOfferFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: any) =>
      fn({
        conversation: { create: vi.fn().mockResolvedValue({ id: "conv-1" }) },
        tradeOffer: {
          create: vi.fn().mockResolvedValue({ id: "offer-1", conversationId: "conv-1" }),
        },
      })
    );
  });

  it("succeeds with a straight item swap", async () => {
    mockProductFindUnique
      .mockResolvedValueOnce(tradeEnabledProduct)
      .mockResolvedValueOnce(offeredProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      offeredProductId: "offered-1",
    });
    expect(result).toHaveProperty("conversationId");
    expect(result).toHaveProperty("tradeOfferId");
  });

  it("succeeds with cash-only offer", async () => {
    mockProductFindUnique.mockResolvedValueOnce(tradeEnabledProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      cashAmount: 25,
    });
    expect(result).toHaveProperty("conversationId");
  });

  it("succeeds with item + cash sweetener", async () => {
    mockProductFindUnique
      .mockResolvedValueOnce(tradeEnabledProduct)
      .mockResolvedValueOnce(offeredProduct);
    const caller = createCaller(buyerCtx);
    const result = await caller.proposeOffer({
      requestedProductId: "product-1",
      offeredProductId: "offered-1",
      cashAmount: 10,
    });
    expect(result).toHaveProperty("tradeOfferId");
  });

  it("throws BAD_REQUEST when tradeEnabled is false", async () => {
    mockProductFindUnique.mockResolvedValueOnce({
      ...tradeEnabledProduct,
      tradeEnabled: false,
    });
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1", cashAmount: 10 })
    ).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when proposer is the seller", async () => {
    mockProductFindUnique.mockResolvedValueOnce({
      ...tradeEnabledProduct,
      seller: { userId: "user-1" },
    });
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1", cashAmount: 10 })
    ).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when neither item nor cash provided", async () => {
    mockProductFindUnique.mockResolvedValueOnce(tradeEnabledProduct);
    const caller = createCaller(buyerCtx);
    await expect(
      caller.proposeOffer({ requestedProductId: "product-1" })
    ).rejects.toThrow(TRPCError);
  });
});

const recipientCtx = {
  req: {} as any,
  res: {} as any,
  session: { session: {} as any, user: { id: "seller-1", name: "Seller" } } as any,
  user: { id: "seller-1", name: "Seller" } as any,
  prisma: {
    tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate, findFirst: mockTradeOfferFindFirst },
    notification: { create: mockNotificationCreate },
  } as any,
};

describe("trade.respondToOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recipient can accept — status becomes ACCEPTED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", recipientId: "seller-1", proposerId: "user-1", status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "ACCEPTED" });
    const caller = createCaller(recipientCtx);
    const result = await caller.respondToOffer({ tradeOfferId: "offer-1", response: "ACCEPTED" });
    expect(result.status).toBe("ACCEPTED");
  });

  it("recipient can decline — status becomes DECLINED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", recipientId: "seller-1", proposerId: "user-1", status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "DECLINED" });
    const caller = createCaller(recipientCtx);
    const result = await caller.respondToOffer({ tradeOfferId: "offer-1", response: "DECLINED" });
    expect(result.status).toBe("DECLINED");
  });

  it("proposer cannot call respondToOffer", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", recipientId: "seller-1", proposerId: "user-1", status: "PENDING",
    });
    const caller = createCaller(buyerCtx);
    await expect(
      caller.respondToOffer({ tradeOfferId: "offer-1", response: "ACCEPTED" })
    ).rejects.toThrow(TRPCError);
  });
});

describe("trade.cancelOffer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("proposer can cancel PENDING offer", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", proposerId: "user-1", recipientId: "seller-1", status: "PENDING",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "CANCELLED" });
    const caller = createCaller({
      ...buyerCtx,
      prisma: { ...buyerCtx.prisma, tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate } } as any,
    });
    const result = await caller.cancelOffer({ tradeOfferId: "offer-1" });
    expect(result.status).toBe("CANCELLED");
  });
});

describe("trade.uploadTracking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("proposer upload sets SHIPPING status", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", proposerId: "user-1", recipientId: "seller-1",
      status: "ACCEPTED", proposerTrackingNumber: null, recipientTrackingNumber: null,
      conversationId: "conv-1",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "SHIPPING", proposerTrackingNumber: "TRACK123" });
    const caller = createCaller({
      ...buyerCtx,
      prisma: { ...buyerCtx.prisma, tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate }, notification: { create: mockNotificationCreate } } as any,
    });
    const result = await caller.uploadTracking({ tradeOfferId: "offer-1", trackingNumber: "TRACK123" });
    expect(result.status).toBe("SHIPPING");
  });

  it("when both legs uploaded, status becomes COMPLETED", async () => {
    mockTradeOfferFindUnique.mockResolvedValue({
      id: "offer-1", proposerId: "user-1", recipientId: "seller-1",
      status: "SHIPPING", proposerTrackingNumber: "TRACK123", recipientTrackingNumber: null,
      conversationId: "conv-1",
    });
    mockTradeOfferUpdate.mockResolvedValue({ id: "offer-1", status: "COMPLETED", proposerTrackingNumber: "TRACK123", recipientTrackingNumber: "TRACK456" });
    const caller = createCaller({
      ...buyerCtx,
      user: { id: "seller-1", name: "Seller" } as any,
      session: { session: {} as any, user: { id: "seller-1", name: "Seller" } } as any,
      prisma: { ...buyerCtx.prisma, tradeOffer: { findUnique: mockTradeOfferFindUnique, update: mockTradeOfferUpdate }, notification: { create: mockNotificationCreate } } as any,
    });
    const result = await caller.uploadTracking({ tradeOfferId: "offer-1", trackingNumber: "TRACK456" });
    expect(result.status).toBe("COMPLETED");
  });
});

describe("trade.getMyOffers", () => {
  it("returns offers for current user as both proposer and recipient", async () => {
    mockTradeOfferFindMany.mockResolvedValue([
      { id: "offer-1", proposerId: "user-1" },
      { id: "offer-2", recipientId: "user-1" },
    ]);
    const caller = createCaller({
      ...buyerCtx,
      prisma: { ...buyerCtx.prisma, tradeOffer: { findMany: mockTradeOfferFindMany } } as any,
    });
    const result = await caller.getMyOffers();
    expect(mockTradeOfferFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ proposerId: "user-1" }, { recipientId: "user-1" }] } }),
    );
    expect(result).toHaveLength(2);
  });
});

describe("trade.getOfferByConversation", () => {
  it("returns trade offer for a participant", async () => {
    mockConversationParticipantFindUnique.mockResolvedValue({ userId: "user-1" });
    mockTradeOfferFindUnique.mockResolvedValue({ id: "offer-1", conversationId: "conv-1" });
    const caller = createCaller({
      ...buyerCtx,
      prisma: {
        ...buyerCtx.prisma,
        conversationParticipant: { findUnique: mockConversationParticipantFindUnique },
        tradeOffer: { findUnique: mockTradeOfferFindUnique },
      } as any,
    });
    const result = await caller.getOfferByConversation({ conversationId: "conv-1" });
    expect(result).toHaveProperty("id", "offer-1");
  });
});
