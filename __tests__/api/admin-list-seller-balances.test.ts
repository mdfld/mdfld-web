import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockSellerFindMany,
  mockSellerFindUnique,
  mockSellerUpdate,
  mockTransactionCreate,
  mockAuditLogCreate,
  mockNotificationCreate,
  mockTransaction,
  mockTransferToSeller,
  mockSendPaypalPayout,
} = vi.hoisted(() => ({
  mockSellerFindMany:      vi.fn(),
  mockSellerFindUnique:    vi.fn(),
  mockSellerUpdate:        vi.fn().mockResolvedValue({}),
  mockTransactionCreate:   vi.fn().mockResolvedValue({ id: "txn-1" }),
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
    sellerProfile: { findMany: mockSellerFindMany, findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    transaction:   { create: mockTransactionCreate },
    auditLog:      { create: mockAuditLogCreate },
    notification:  { create: mockNotificationCreate },
    $transaction:  mockTransaction,
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
    sellerProfile: { findMany: mockSellerFindMany, findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    transaction:   { create: mockTransactionCreate },
    auditLog:      { create: mockAuditLogCreate },
    notification:  { create: mockNotificationCreate },
    $transaction:  mockTransaction,
  } as any,
};

const baseSellers = [
  {
    id: "sp-1",
    storeName: "Store A",
    businessEmail: "a@x.com",
    pendingBalance: 100,
    lockedBalance: 30,
    settledBalance: 0,
    payoutMethod: null,
    stripeBankLast4: null,
    paypalEmail: null,
    payoutSetupAt: null,
    payoutRequestedAt: null,
    user: { name: "A", email: "a@x.com" },
  },
  {
    id: "sp-2",
    storeName: "Store B",
    businessEmail: "b@x.com",
    pendingBalance: 50,
    lockedBalance: 80,
    settledBalance: 0,
    payoutMethod: null,
    stripeBankLast4: null,
    paypalEmail: null,
    payoutSetupAt: null,
    payoutRequestedAt: null,
    user: { name: "B", email: "b@x.com" },
  },
];

describe("admin.listSellerBalances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns availableBalance for each seller", async () => {
    mockSellerFindMany.mockResolvedValue(baseSellers.map((s) => ({ ...s })));
    const caller = createCaller(adminCtx);

    const result = await caller.listSellerBalances({ limit: 20 });

    expect(result.sellers[0].availableBalance).toBe(70);
    expect(result.sellers[1].availableBalance).toBe(0);
  });

  it("preserves existing seller fields alongside availableBalance", async () => {
    mockSellerFindMany.mockResolvedValue(baseSellers.map((s) => ({ ...s })));
    const caller = createCaller(adminCtx);

    const result = await caller.listSellerBalances({ limit: 20 });

    expect(result.sellers[0]).toMatchObject({
      storeName: "Store A",
      pendingBalance: 100,
      lockedBalance: 30,
    });
  });
});
