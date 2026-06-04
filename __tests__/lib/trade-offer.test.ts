import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const {
  mockProductFindUnique,
  mockTradeOfferFindFirst,
  mockNotificationCreate,
  mockTransaction,
  mockMessageCreate,
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
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findUnique: mockProductFindUnique },
    tradeOffer: { findFirst: mockTradeOfferFindFirst },
    notification: { create: mockNotificationCreate },
    message: { create: mockMessageCreate },
    $transaction: mockTransaction,
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
