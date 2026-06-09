import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

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

const baseSeller = {
  id:               "sp-1",
  userId:           "user-1",
  pendingBalance:   100,
  settledBalance:   0,
  totalSales:       5,
  payoutMethod:     null,
  paypalEmail:      null,
  stripeBankLast4:  null,
  stripeAccountId:  null,
  payoutSetupAt:    null,
  payoutRequestedAt: null,
  commissionRate:   0.10,
  storeName:        "Test Store",
};

describe("setupStripePayout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates Stripe Connected Account + bank account and updates SellerProfile", async () => {
    mockSellerFindUnique.mockResolvedValue({ id: "sp-1", stripeAccountId: null });
    const caller = createCaller(sellerCtx);

    const result = await caller.setupStripePayout({
      routingNumber:      "110000000",
      accountNumber:      "000123456789",
      accountHolderName:  "John Seller",
    });

    expect(result).toEqual({ last4: "4242" });
    expect(mockAccountCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: "custom", country: "US" })
    );
    expect(mockCreateExternalAccount).toHaveBeenCalledWith(
      "acct_test123",
      expect.objectContaining({
        external_account: expect.objectContaining({
          object:           "bank_account",
          routing_number:   "110000000",
          account_number:   "000123456789",
          account_holder_name: "John Seller",
        }),
      })
    );
    expect(mockSellerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeAccountId:  "acct_test123",
          stripeBankLast4:  "4242",
          payoutMethod:     "STRIPE_BANK",
          payoutSetupAt:    expect.any(Date),
        }),
      })
    );
  });

  it("reuses existing stripeAccountId if already set", async () => {
    mockSellerFindUnique.mockResolvedValue({ id: "sp-1", stripeAccountId: "acct_existing" });
    const caller = createCaller(sellerCtx);

    await caller.setupStripePayout({
      routingNumber:     "110000000",
      accountNumber:     "000123456789",
      accountHolderName: "John Seller",
    });

    expect(mockAccountCreate).not.toHaveBeenCalled();
    expect(mockCreateExternalAccount).toHaveBeenCalledWith("acct_existing", expect.anything());
  });
});

describe("setupPaypalPayout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores PayPal email, method, and timestamp", async () => {
    mockSellerFindUnique.mockResolvedValue({ id: "sp-1" });
    const caller = createCaller(sellerCtx);

    const result = await caller.setupPaypalPayout({ paypalEmail: "seller@paypal.com" });

    expect(result).toEqual({ paypalEmail: "seller@paypal.com" });
    expect(mockSellerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paypalEmail:   "seller@paypal.com",
          payoutMethod:  "PAYPAL",
          payoutSetupAt: expect.any(Date),
        }),
      })
    );
  });

  it("throws BAD_REQUEST for invalid email format", async () => {
    const caller = createCaller(sellerCtx);
    await expect(caller.setupPaypalPayout({ paypalEmail: "not-an-email" })).rejects.toThrow(TRPCError);
  });
});

describe("getPayoutSetup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when payout method is not configured", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: null });
    const caller = createCaller(sellerCtx);
    const result = await caller.getPayoutSetup();
    expect(result).toBeNull();
  });

  it("returns STRIPE_BANK with masked bank display", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: "STRIPE_BANK", stripeBankLast4: "6789" });
    const caller = createCaller(sellerCtx);
    const result = await caller.getPayoutSetup();
    expect(result).toEqual({ payoutMethod: "STRIPE_BANK", displayDetail: "••••6789" });
  });

  it("returns PAYPAL with email display", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: "PAYPAL", paypalEmail: "seller@paypal.com" });
    const caller = createCaller(sellerCtx);
    const result = await caller.getPayoutSetup();
    expect(result).toEqual({ payoutMethod: "PAYPAL", displayDetail: "seller@paypal.com" });
  });
});

describe("requestPayout (updated)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("succeeds when payoutMethod is set and amount is within balance", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: "PAYPAL", pendingBalance: 100 });
    const caller = createCaller(sellerCtx);
    const result = await caller.requestPayout({ amount: 50 });
    expect(result).toEqual({ success: true });
    expect(mockSellerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ payoutRequestedAt: expect.any(Date) }) })
    );
  });

  it("throws PRECONDITION_FAILED when payoutMethod is null", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: null });
    const caller = createCaller(sellerCtx);
    await expect(caller.requestPayout({ amount: 50 })).rejects.toThrow(TRPCError);
  });

  it("throws BAD_REQUEST when amount exceeds pendingBalance", async () => {
    mockSellerFindUnique.mockResolvedValue({ ...baseSeller, payoutMethod: "PAYPAL", pendingBalance: 30 });
    const caller = createCaller(sellerCtx);
    await expect(caller.requestPayout({ amount: 50 })).rejects.toThrow(TRPCError);
  });
});
