import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformSettings: {
      upsert: vi.fn().mockResolvedValue({
        shippingMarkupPct: 0.15,
        shippingFlatRateCents: 899,
      }),
    },
    product: { findMany: vi.fn() },
    sellerProfile: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
  },
}));

// Mock easypost
vi.mock("@/lib/easypost", () => ({
  getShippingRates: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getShippingRates } from "@/lib/easypost";
import { POST } from "@/app/api/shipping/rates/route";
import { NextRequest } from "next/server";

const makeReq = (body: object) =>
  new NextRequest("http://localhost/api/shipping/rates", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("POST /api/shipping/rates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns rates from EasyPost for a seller with complete address", async () => {
    vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue({
      id: "sp1",
      storeName: "Test Store",
      organizationId: "org1",
    } as any);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({
      addressStreet: "1 Seller St",
      addressCity: "Atlanta",
      addressState: "GA",
      addressZip: "30301",
      addressCountry: "US",
    } as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1", weight: 0.5, dimensions: { length: 30, width: 20, height: 10 }, shippingTerms: "CALCULATED", inventory: 1, quantity: 1 },
    ] as any);
    vi.mocked(getShippingRates).mockResolvedValue({
      standard: { easypostRateId: "r1", carrier: "USPS", service: "GroundAdvantage", rateCents: 850, totalCents: 978, deliveryDays: 5 },
      express: { easypostRateId: "r2", carrier: "UPS", service: "2ndDayAir", rateCents: 1800, totalCents: 2070, deliveryDays: 2 },
    });

    const res = await POST(makeReq({
      toAddress: { street: "2 Buyer Ave", city: "New York", state: "NY", zip: "10001", country: "US" },
      items: [{ productId: "p1", quantity: 1, sellerId: "sp1" }],
    }));

    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.shipments).toHaveLength(1);
    expect(json.shipments[0].standard.carrier).toBe("USPS");
    expect(json.shipments[0].express.carrier).toBe("UPS");
  });

  it("returns flat rate fallback when seller address is incomplete", async () => {
    vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue({ id: "sp1", storeName: "No Address Store", organizationId: "org1" } as any);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ addressStreet: null } as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1", weight: 0.5, dimensions: { length: 30, width: 20, height: 10 }, shippingTerms: "CALCULATED" },
    ] as any);

    const res = await POST(makeReq({
      toAddress: { street: "2 Buyer Ave", city: "New York", state: "NY", zip: "10001", country: "US" },
      items: [{ productId: "p1", quantity: 1, sellerId: "sp1" }],
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.shipments[0].standard.service).toBe("FALLBACK");
    expect(json.shipments[0].standard.totalCents).toBe(899);
    expect(json.shipments[0].express).toBeNull();
  });

  it("returns zero-cost shipment for DDP seller", async () => {
    vi.mocked(prisma.sellerProfile.findUnique).mockResolvedValue({ id: "sp1", storeName: "DDP Store", organizationId: "org1" } as any);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ addressStreet: "1 St", addressCity: "LA", addressState: "CA", addressZip: "90001", addressCountry: "US" } as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1", weight: 0.5, dimensions: { length: 10, width: 10, height: 10 }, shippingTerms: "INCLUDED_DDP" },
    ] as any);

    const res = await POST(makeReq({
      toAddress: { street: "2 Ave", city: "NY", state: "NY", zip: "10001", country: "US" },
      items: [{ productId: "p1", quantity: 1, sellerId: "sp1" }],
    }));
    const json = await res.json();

    expect(json.shipments[0].standard.totalCents).toBe(0);
    expect(json.shipments[0].standard.service).toBe("DDP");
    expect(json.shipments[0].express).toBeNull();
  });
});
