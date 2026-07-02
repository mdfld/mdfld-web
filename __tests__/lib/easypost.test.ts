import { describe, it, expect, vi, beforeEach } from "vitest";
import { getShippingRates, buyShippingLabel } from "@/lib/easypost";

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

// ── buyShippingLabel helpers ──────────────────────────────────────────────────

const makeShipmentWithRates = (rates: any[]) => ({
  id: "shp_test",
  rates,
});

const makeBuyResponse = () => ({
  id: "shp_test",
  postage_label: { label_url: "https://cdn.easypost.com/label.pdf" },
  tracking_code: "9400111899223397861234",
  selected_rate: { carrier: "USPS", rate: "8.50" },
});

const mockBuyParams = {
  fromAddress: mockFrom,
  toAddress:   { name: "John Buyer", ...mockTo },
  parcel:      mockParcel,
  reference:   "order_abc123",
};

describe("buyShippingLabel", () => {
  it("buys cheapest rate and returns correct BuyLabelResult", async () => {
    const cheapRate = makeRate("r_cheap", 8.50, 5, "USPS", "GroundAdvantage");
    const expRate   = makeRate("r_exp",  18.00, 2, "UPS",  "2ndDayAir");

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeShipmentWithRates([expRate, cheapRate]),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeBuyResponse(),
      } as any);

    const result = await buyShippingLabel(mockBuyParams);

    // Verify the buy call used the cheaper rate's ID
    const buyCall = vi.mocked(fetch).mock.calls[1];
    const buyBody = JSON.parse(buyCall[1]!.body as string);
    expect(buyBody.rate.id).toBe("r_cheap");

    // Verify returned fields
    expect(result.shipmentId).toBe("shp_test");
    expect(result.labelUrl).toBe("https://cdn.easypost.com/label.pdf");
    expect(result.trackingNumber).toBe("9400111899223397861234");
    expect(result.carrier).toBe("USPS");
    expect(result.rateCents).toBe(850);
  });

  it("uses fallback parcel when parcel is null and calls console.warn", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeShipmentWithRates([makeRate("r1", 8.50, 5)]),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeBuyResponse(),
      } as any);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await buyShippingLabel({ ...mockBuyParams, parcel: null });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("null parcel")
    );

    // Verify fallback dimensions were sent
    const shipCall = vi.mocked(fetch).mock.calls[0];
    const shipBody = JSON.parse(shipCall[1]!.body as string);
    expect(shipBody.shipment.parcel.weight).toBe(16);
    expect(shipBody.shipment.parcel.length).toBe(12);
    expect(shipBody.shipment.parcel.width).toBe(10);
    expect(shipBody.shipment.parcel.height).toBe(6);

    expect(result.shipmentId).toBe("shp_test");

    warnSpy.mockRestore();
  });

  it("throws when shipment creation returns non-ok (422)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 422 } as any);

    await expect(buyShippingLabel(mockBuyParams)).rejects.toThrow(
      "EasyPost API error creating shipment: 422"
    );
  });

  it("throws when buy call returns non-ok (402)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeShipmentWithRates([makeRate("r1", 8.50, 5)]),
      } as any)
      .mockResolvedValueOnce({ ok: false, status: 402 } as any);

    await expect(buyShippingLabel(mockBuyParams)).rejects.toThrow(
      "EasyPost API error buying label: 402"
    );
  });

  it("throws when shipment returns empty rates array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeShipmentWithRates([]),
    } as any);

    await expect(buyShippingLabel(mockBuyParams)).rejects.toThrow("No rates");
  });
});
