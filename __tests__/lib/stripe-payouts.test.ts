import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTransferCreate } = vi.hoisted(() => ({
  mockTransferCreate: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    transfers: {
      create: mockTransferCreate,
    },
  },
}));

import { transferToSeller } from "@/lib/stripe-payouts";

describe("transferToSeller", () => {
  const params = {
    stripeAccountId: "acct_test123",
    amountCents:     5000,
    reference:       "seller-profile-abc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Stripe transfer and returns the transfer ID", async () => {
    mockTransferCreate.mockResolvedValue({ id: "tr_test456" });

    const result = await transferToSeller(params);

    expect(result).toEqual({ transferId: "tr_test456" });
    expect(mockTransferCreate).toHaveBeenCalledWith({
      amount:         5000,
      currency:       "usd",
      destination:    "acct_test123",
      transfer_group: "seller-profile-abc",
    });
  });

  it("throws a descriptive error when Stripe API fails", async () => {
    mockTransferCreate.mockRejectedValue(new Error("Your account does not have sufficient funds"));

    await expect(transferToSeller(params)).rejects.toThrow("Stripe transfer failed");
  });

  it("passes idempotencyKey as request options when provided", async () => {
    mockTransferCreate.mockResolvedValue({ id: "tr_test789" });

    await transferToSeller({ ...params, idempotencyKey: "payout-seller-profile-abc-5000-manual" });

    expect(mockTransferCreate).toHaveBeenCalledWith(
      {
        amount:         5000,
        currency:       "usd",
        destination:    "acct_test123",
        transfer_group: "seller-profile-abc",
      },
      { idempotencyKey: "payout-seller-profile-abc-5000-manual" }
    );
  });
});
