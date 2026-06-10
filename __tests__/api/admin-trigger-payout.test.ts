import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const {
  mockSellerFindUnique,
  mockTransactionCreate,
  mockSellerUpdate,
  mockAuditLogCreate,
  mockNotificationCreate,
  mockTransaction,
  mockTransferToSeller,
  mockSendPaypalPayout,
} = vi.hoisted(() => ({
  mockSellerFindUnique:    vi.fn(),
  mockTransactionCreate:   vi.fn().mockResolvedValue({ id: "txn-1" }),
  mockSellerUpdate:        vi.fn().mockResolvedValue({}),
  mockAuditLogCreate:      vi.fn().mockResolvedValue({}),
  mockNotificationCreate:  vi.fn().mockResolvedValue({}),
  mockTransaction:         vi.fn().mockImplementation(async (fn: any) => fn({
    transaction: { create: vi.fn().mockResolvedValue({ id: "txn-1" }) },
    sellerProfile: { update: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    notification: { create: vi.fn().mockResolvedValue({}) },
  })),
  mockTransferToSeller:    vi.fn().mockResolvedValue({ transferId: "tr_test123" }),
  mockSendPaypalPayout:    vi.fn().mockResolvedValue({ payoutBatchId: "BATCH123" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sellerProfile:  { findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    transaction:    { create: mockTransactionCreate },
    auditLog:       { create: mockAuditLogCreate },
    notification:   { create: mockNotificationCreate },
    $transaction:   mockTransaction,
  },
}));

vi.mock("@/lib/stripe-payouts", () => ({
  transferToSeller: mockTransferToSeller,
}));

vi.mock("@/lib/paypal-payouts", () => ({
  sendPaypalPayout: mockSendPaypalPayout,
}));

vi.mock("@/lib/stripe", () => ({ stripe: {} }));

import { createCallerFactory } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";

const createCaller = createCallerFactory(adminRouter);

const adminCtx = {
  req:     {} as any,
  res:     {} as any,
  session: { session: {} as any, user: { id: "admin-1", name: "Admin", role: "ADMIN" } } as any,
  user:    { id: "admin-1", name: "Admin", role: "ADMIN" } as any,
  prisma: {
    sellerProfile: { findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    transaction:   { create: mockTransactionCreate },
    auditLog:      { create: mockAuditLogCreate },
    notification:  { create: mockNotificationCreate },
    $transaction:  mockTransaction,
  } as any,
};

const baseStripeSeller = {
  id:              "sp-1",
  userId:          "user-seller-1",
  storeName:       "Test Store",
  pendingBalance:  200,
  settledBalance:  0,
  payoutMethod:    "STRIPE_BANK",
  stripeAccountId: "acct_test123",
  stripeBankLast4: "6789",
  paypalEmail:     null,
  payoutRequestedAt: null,
  user:            { id: "user-seller-1", name: "Test Seller" },
};

const basePaypalSeller = {
  ...baseStripeSeller,
  payoutMethod:    "PAYPAL",
  stripeAccountId: null,
  stripeBankLast4: null,
  paypalEmail:     "seller@paypal.com",
};

describe("admin.triggerPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransferToSeller.mockResolvedValue({ transferId: "tr_test123" });
    mockSendPaypalPayout.mockResolvedValue({ payoutBatchId: "BATCH123" });
  });

  it("STRIPE_BANK: calls transferToSeller with correct params and returns PayoutSummary", async () => {
    mockSellerFindUnique.mockResolvedValue(baseStripeSeller);
    const caller = createCaller(adminCtx);

    const result = await caller.triggerPayout({ sellerProfileId: "sp-1", amount: 100 });

    expect(mockTransferToSeller).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeAccountId: "acct_test123",
        amountCents:     10000,
        reference:       "sp-1",
      })
    );
    expect(result).toMatchObject({
      sellerName:  "Test Store",
      amount:      100,
      method:      "STRIPE_BANK",
      destination: "••••6789",
      transferId:  "tr_test123",
    });
  });

  it("PAYPAL: calls sendPaypalPayout with correct params and returns PayoutSummary", async () => {
    mockSellerFindUnique.mockResolvedValue(basePaypalSeller);
    mockSendPaypalPayout.mockResolvedValue({ payoutBatchId: "BATCH456" });
    const caller = createCaller(adminCtx);

    const result = await caller.triggerPayout({ sellerProfileId: "sp-1", amount: 75 });

    expect(mockSendPaypalPayout).toHaveBeenCalledWith(
      expect.objectContaining({
        paypalEmail: "seller@paypal.com",
        amountUsd:   "75.00",
      })
    );
    expect(result).toMatchObject({
      method:     "PAYPAL",
      destination: "seller@paypal.com",
      transferId:  "BATCH456",
    });
  });

  it("throws BAD_REQUEST when amount exceeds pendingBalance", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseStripeSeller, pendingBalance: 50 });
    const caller = createCaller(adminCtx);
    await expect(caller.triggerPayout({ sellerProfileId: "sp-1", amount: 100 })).rejects.toThrow(TRPCError);
  });

  it("throws PRECONDITION_FAILED when payoutMethod is null", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseStripeSeller, payoutMethod: null });
    const caller = createCaller(adminCtx);
    await expect(caller.triggerPayout({ sellerProfileId: "sp-1", amount: 50 })).rejects.toThrow(TRPCError);
  });

  it("does not decrement balance when Stripe transfer throws", async () => {
    mockSellerFindUnique.mockResolvedValue(baseStripeSeller);
    mockTransferToSeller.mockRejectedValue(new Error("Stripe transfer failed: insufficient funds"));
    const caller = createCaller(adminCtx);
    await expect(caller.triggerPayout({ sellerProfileId: "sp-1", amount: 50 })).rejects.toThrow();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("derives a stable Stripe idempotency key from sellerProfileId, amount, and payoutRequestedAt", async () => {
    const requestedAt = new Date("2026-06-01T00:00:00.000Z");
    mockSellerFindUnique.mockResolvedValue({ ...baseStripeSeller, payoutRequestedAt: requestedAt });
    const caller = createCaller(adminCtx);

    await caller.triggerPayout({ sellerProfileId: "sp-1", amount: 100 });

    expect(mockTransferToSeller).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: `payout-sp-1-10000-${requestedAt.getTime()}`,
      })
    );
  });

  it("uses distinct idempotency keys for two manual payouts (no payoutRequestedAt)", async () => {
    mockSellerFindUnique.mockResolvedValue(baseStripeSeller);
    const caller = createCaller(adminCtx);

    await caller.triggerPayout({ sellerProfileId: "sp-1", amount: 100 });
    const firstKey = mockTransferToSeller.mock.calls[0][0].idempotencyKey;

    await caller.triggerPayout({ sellerProfileId: "sp-1", amount: 100 });
    const secondKey = mockTransferToSeller.mock.calls[1][0].idempotencyKey;

    expect(firstKey).toMatch(/^payout-sp-1-10000-manual-[0-9a-f-]+$/);
    expect(secondKey).toMatch(/^payout-sp-1-10000-manual-[0-9a-f-]+$/);
    expect(firstKey).not.toBe(secondKey);
  });
});
