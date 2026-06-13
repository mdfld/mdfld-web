import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockSellerFindUnique,
  mockSellerUpdate,
  mockAuditLogCreate,
  mockTransactionFindMany,
  mockAccountCreate,
  mockCreateExternalAccount,
} = vi.hoisted(() => ({
  mockSellerFindUnique:       vi.fn(),
  mockSellerUpdate:           vi.fn().mockResolvedValue({}),
  mockAuditLogCreate:         vi.fn().mockResolvedValue({}),
  mockTransactionFindMany:    vi.fn().mockResolvedValue([]),
  mockAccountCreate:          vi.fn().mockResolvedValue({ id: "acct_test123" }),
  mockCreateExternalAccount:  vi.fn().mockResolvedValue({ last4: "4242" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sellerProfile: { findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    auditLog:      { create: mockAuditLogCreate },
    transaction:   { findMany: mockTransactionFindMany },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    accounts: {
      create:                mockAccountCreate,
      createExternalAccount: mockCreateExternalAccount,
    },
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
    encryptForConversation: vi.fn().mockReturnValue({}),
  },
}));

import { createCallerFactory } from "@/server/trpc";
import { organizationRouter } from "@/server/routers/organization";

const createCaller = createCallerFactory(organizationRouter);

const sellerCtx = {
  req:     {} as any,
  res:     {} as any,
  session: { session: {} as any, user: { id: "user-1", name: "Seller" } } as any,
  user:    { id: "user-1", name: "Seller" } as any,
  prisma: {
    sellerProfile: { findUnique: mockSellerFindUnique, update: mockSellerUpdate },
    auditLog:      { create: mockAuditLogCreate },
    transaction:   { findMany: mockTransactionFindMany },
  } as any,
};

describe("getEarnings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns lockedBalance and availableBalance", async () => {
    mockSellerFindUnique.mockResolvedValue({
      id:              "sp-1",
      pendingBalance:  100,
      lockedBalance:   30,
      settledBalance:  0,
      totalSales:      5,
      payoutMethod:    null,
      stripeBankLast4: null,
      paypalEmail:     null,
      payoutSetupAt:   null,
      commissionRate:  0.10,
    });
    mockTransactionFindMany.mockResolvedValue([]);

    const caller = createCaller(sellerCtx);
    const result = await caller.getEarnings();

    expect(result).toMatchObject({
      pendingBalance:   100,
      lockedBalance:    30,
      availableBalance: 70,
    });
  });

  it("availableBalance is clamped to 0 when lockedBalance exceeds pendingBalance", async () => {
    mockSellerFindUnique.mockResolvedValue({
      id:              "sp-1",
      pendingBalance:  50,
      lockedBalance:   80,
      settledBalance:  0,
      totalSales:      5,
      payoutMethod:    null,
      stripeBankLast4: null,
      paypalEmail:     null,
      payoutSetupAt:   null,
      commissionRate:  0.10,
    });
    mockTransactionFindMany.mockResolvedValue([]);

    const caller = createCaller(sellerCtx);
    const result = await caller.getEarnings();

    expect(result).toMatchObject({
      availableBalance: 0,
    });
  });
});
