import { describe, it, expect, vi, beforeEach } from "vitest";
import { getShippingRates } from "@/lib/easypost";

const mockFrom = { street: "1 Seller St", city: "Atlanta", state: "GA", zip: "30301", country: "US" };
const mockTo   = { street: "2 Buyer Ave", city: "New York", state: "NY", zip: "10001", country: "US" };
const mockParcel = { weightOz: 16, length: 30, width: 20, height: 10 };

const makeRate = (id: string, rate: number, days: number, carrier = "USPS", service = "GroundAdvantage") => ({
  id, rate: String(rate), delivery_days: days, carrier, service,
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  process.env.EASYPOST_API_KEY = "test_key";
});

describe("getShippingRates", () => {
  it("returns standard=cheapest and express=fastest when two distinct rates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: [
          makeRate("r1", 8.50, 5, "USPS", "GroundAdvantage"),
          makeRate("r2", 18.00, 2, "UPS",  "2ndDayAir"),
        ],
      }),
    } as any);

    const result = await getShippingRates({ fromAddress: mockFrom, toAddress: mockTo, parcel: mockParcel, markupPct: 0.15 });

    expect(result.standard.easypostRateId).toBe("r1");
    expect(result.standard.rateCents).toBe(850);
    expect(result.standard.totalCents).toBe(Math.ceil(850 * 1.15));
    expect(result.express!.easypostRateId).toBe("r2");
    expect(result.express!.totalCents).toBe(Math.ceil(1800 * 1.15));
  });

  it("returns express=null when all rates have same delivery_days", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: [makeRate("r1", 8.50, 5), makeRate("r2", 9.00, 5)] }),
    } as any);

    const result = await getShippingRates({ fromAddress: mockFrom, toAddress: mockTo, parcel: mockParcel, markupPct: 0.15 });

    expect(result.standard.easypostRateId).toBe("r1");
    expect(result.express).toBeNull();
  });

  it("throws when EasyPost API returns non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 422 } as any);

    await expect(
      getShippingRates({ fromAddress: mockFrom, toAddress: mockTo, parcel: mockParcel, markupPct: 0.15 })
    ).rejects.toThrow("EasyPost API error");
  });

  it("throws when EASYPOST_API_KEY is not set", async () => {
    delete process.env.EASYPOST_API_KEY;

    await expect(
      getShippingRates({ fromAddress: mockFrom, toAddress: mockTo, parcel: mockParcel, markupPct: 0.15 })
    ).rejects.toThrow("EASYPOST_API_KEY");
  });
});
