import { vi, describe, it, expect, beforeEach } from "vitest";

describe("sendPaypalPayout", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    process.env.PAYPAL_CLIENT_ID     = "test_client_id";
    process.env.PAYPAL_CLIENT_SECRET = "test_client_secret";
    process.env.PAYPAL_API_URL       = "https://api-m.sandbox.paypal.com";
    vi.stubGlobal("fetch", vi.fn());
  });

  it("gets OAuth token then posts payout and returns payoutItemId", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({ access_token: "TESTTOKEN123" }),
      } as any)
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          batch_header: { payout_batch_id: "BATCHID123", batch_status: "PENDING" },
          links: [],
        }),
      } as any);

    const { sendPaypalPayout } = await import("@/lib/paypal-payouts");
    const result = await sendPaypalPayout({
      paypalEmail:  "seller@example.com",
      amountUsd:    "42.50",
      senderItemId: "seller-abc-1717000000000",
    });

    expect(result).toEqual({ payoutBatchId: "BATCHID123" });

    // Verify OAuth was called with correct credentials
    const [oauthUrl, oauthInit] = vi.mocked(fetch).mock.calls[0];
    expect(oauthUrl).toContain("/v1/oauth2/token");
    expect((oauthInit as RequestInit).headers).toMatchObject({
      Authorization: expect.stringContaining("Basic "),
    });

    // Verify payout was called with correct body
    const [payoutUrl, payoutInit] = vi.mocked(fetch).mock.calls[1];
    expect(payoutUrl).toContain("/v1/payments/payouts");
    const body = JSON.parse((payoutInit as RequestInit).body as string);
    expect(body.items[0].receiver).toBe("seller@example.com");
    expect(body.items[0].amount.value).toBe("42.50");
    expect(body.items[0].amount.currency).toBe("USD");
  });

  it("throws when OAuth token request fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as any);

    const { sendPaypalPayout } = await import("@/lib/paypal-payouts");
    await expect(
      sendPaypalPayout({ paypalEmail: "a@b.com", amountUsd: "10.00", senderItemId: "x" })
    ).rejects.toThrow("PayPal OAuth failed");
  });

  it("throws when payouts API call fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "TOKEN" }) } as any)
      .mockResolvedValueOnce({ ok: false, status: 400 } as any);

    const { sendPaypalPayout } = await import("@/lib/paypal-payouts");
    await expect(
      sendPaypalPayout({ paypalEmail: "a@b.com", amountUsd: "10.00", senderItemId: "x" })
    ).rejects.toThrow("PayPal payout failed");
  });

  it("throws when PAYPAL_CLIENT_ID is not set", async () => {
    delete process.env.PAYPAL_CLIENT_ID;

    const { sendPaypalPayout } = await import("@/lib/paypal-payouts");
    await expect(
      sendPaypalPayout({ paypalEmail: "a@b.com", amountUsd: "10.00", senderItemId: "x" })
    ).rejects.toThrow("PAYPAL_CLIENT_ID");
  });
});
