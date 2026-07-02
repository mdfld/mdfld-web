# Pre-Checkout Shipping Rate Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a 3-step checkout wizard (address → shipping tier → review) before Stripe, using EasyPost to calculate real carrier rates with MDFLD markup baked in as a line item.

**Architecture:** The existing `/checkout` page becomes a 3-step wizard. A new `/api/shipping/rates` route calls EasyPost per seller shipment and returns Standard/Express options. The locked rate is passed to `create-checkout-session` as a shipping line item; the webhook reads it back and writes `shipping`, `shippingMarkup`, and `shippingService` onto the Order.

**Tech Stack:** Next.js App Router, tRPC, Prisma (PostgreSQL), HeroUI, EasyPost REST API, Stripe PaymentIntents, Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `shippingMarkup`, `shippingService` to Order; `shippingMarkupPct`, `shippingFlatRateCents` to PlatformSettings |
| `lib/easypost.ts` | Create | `getShippingRates()` — calls EasyPost Shipment API, returns Standard + Express options with markup |
| `__tests__/lib/easypost.test.ts` | Create | Unit tests for rate sorting, markup calc, error fallback |
| `app/api/shipping/rates/route.ts` | Create | POST endpoint — fetches seller address + product dims from DB, calls `getShippingRates`, applies fallbacks |
| `__tests__/api/shippingRates.test.ts` | Create | Tests for fallback logic, DDP handling, multi-seller |
| `components/dashboard/organizations/products/create/product-details-form.tsx` | Modify | Remove weight + dimensions fields |
| `components/dashboard/organizations/products/create/product-pricing-form.tsx` | Modify | Add weight + dimensions fields (required) in a "Shipping" card above existing shipping terms |
| `server/routers/admin.ts` | Modify | Add `shippingMarkupPct` + `shippingFlatRateCents` to `updatePlatformSettings` input |
| `app/admin/settings/page.tsx` | Modify | Add markup % and flat rate fallback inputs to fees section |
| `app/(main)/checkout/page.tsx` | Rewrite | 3-step wizard: address → shipping → review |
| `app/api/stripe/create-checkout-session/route.ts` | Modify | Accept `shippingSelections`, append shipping line items + metadata |
| `app/api/stripe/webhook/route.ts` | Modify | Parse `shipping_${sellerId}` metadata, write shipping fields to Order |

---

## Task 1: DB Migration — New Schema Fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to schema**

In `prisma/schema.prisma`, add to the `Order` model after the `notes String?` line:

```prisma
shippingMarkup   Decimal  @default(0)
shippingService  String?
```

Add to `PlatformSettings` model after `buyerMarketplaceFee Float @default(0.00)`:

```prisma
shippingMarkupPct     Float  @default(0.15)
shippingFlatRateCents Int    @default(899)
```

- [ ] **Step 2: Generate and run migration**

```bash
cd /Users/ayoola/mdfld-web
npx prisma migrate dev --name add_shipping_fields
```

Expected: `✔  Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add shipping markup and service fields to Order and PlatformSettings"
```

---

## Task 2: EasyPost Rate Fetching Library

**Files:**
- Create: `lib/easypost.ts`
- Create: `__tests__/lib/easypost.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/easypost.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run __tests__/lib/easypost.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/easypost'`

- [ ] **Step 3: Implement `lib/easypost.ts`**

Create `lib/easypost.ts`:

```ts
const EASYPOST_API_URL = "https://api.easypost.com/v2";

export type RateOption = {
  easypostRateId: string
  carrier: string
  service: string
  rateCents: number
  totalCents: number
  deliveryDays: number | null
}

export type ShippingRatesResult = {
  standard: RateOption
  express: RateOption | null
}

export async function getShippingRates(params: {
  fromAddress: { street: string; city: string; state: string; zip: string; country: string }
  toAddress:   { street: string; city: string; state: string; zip: string; country: string }
  parcel:      { weightOz: number; length: number; width: number; height: number }
  markupPct:   number
}): Promise<ShippingRatesResult> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) throw new Error("EASYPOST_API_KEY is not set");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const res = await fetch(`${EASYPOST_API_URL}/shipments`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      shipment: {
        from_address: {
          street1: params.fromAddress.street,
          city:    params.fromAddress.city,
          state:   params.fromAddress.state,
          zip:     params.fromAddress.zip,
          country: params.fromAddress.country,
        },
        to_address: {
          street1: params.toAddress.street,
          city:    params.toAddress.city,
          state:   params.toAddress.state,
          zip:     params.toAddress.zip,
          country: params.toAddress.country,
        },
        parcel: {
          weight: params.parcel.weightOz,
          length: params.parcel.length,
          width:  params.parcel.width,
          height: params.parcel.height,
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`EasyPost API error: ${res.status}`);

  const data = await res.json();
  const rates: any[] = data.rates ?? [];

  const withCents = rates.map((r) => ({
    easypostRateId: r.id as string,
    carrier:        r.carrier as string,
    service:        r.service as string,
    rateCents:      Math.round(parseFloat(r.rate) * 100),
    totalCents:     Math.ceil(Math.round(parseFloat(r.rate) * 100) * (1 + params.markupPct)),
    deliveryDays:   r.delivery_days as number | null,
  }));

  const byCost = [...withCents].sort((a, b) => a.rateCents - b.rateCents);
  const standard = byCost[0];

  const bySpeed = [...withCents].sort((a, b) => {
    if (a.deliveryDays == null) return 1;
    if (b.deliveryDays == null) return -1;
    return a.deliveryDays - b.deliveryDays;
  });
  const fastest = bySpeed[0];

  const express =
    fastest.easypostRateId !== standard.easypostRateId ? fastest : null;

  return { standard, express };
}

// Re-export tracking function so lib/aftership.ts can be replaced gradually
export { createOrGetTracking } from "./aftership";
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx vitest run __tests__/lib/easypost.test.ts
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/easypost.ts __tests__/lib/easypost.test.ts
git commit -m "feat: add EasyPost getShippingRates with Standard/Express tier logic"
```

---

## Task 3: Shipping Rates API Route

**Files:**
- Create: `app/api/shipping/rates/route.ts`
- Create: `__tests__/api/shippingRates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/shippingRates.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run __tests__/api/shippingRates.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/shipping/rates/route'`

- [ ] **Step 3: Implement the route**

Create `app/api/shipping/rates/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShippingRates, type RateOption } from "@/lib/easypost";

type ShipmentResult = {
  sellerId: string
  sellerName: string
  standard: RateOption & { service: string }
  express: (RateOption & { service: string }) | null
}

export async function POST(request: NextRequest) {
  try {
    const { toAddress, items } = await request.json();

    if (!toAddress?.street || !toAddress?.city || !toAddress?.state || !toAddress?.zip || !toAddress?.country) {
      return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 });
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
      select: { shippingMarkupPct: true, shippingFlatRateCents: true },
    });

    const { shippingMarkupPct, shippingFlatRateCents } = settings;

    // Group items by sellerId
    const bySeller: Record<string, typeof items> = {};
    for (const item of items) {
      if (!bySeller[item.sellerId]) bySeller[item.sellerId] = [];
      bySeller[item.sellerId].push(item);
    }

    const shipments: ShipmentResult[] = [];

    for (const [sellerId, sellerItems] of Object.entries(bySeller)) {
      const productIds = sellerItems.map((i: any) => i.productId);

      const [sellerProfile, products] = await Promise.all([
        prisma.sellerProfile.findUnique({
          where: { id: sellerId },
          select: { storeName: true, organizationId: true },
        }),
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, weight: true, dimensions: true, shippingTerms: true },
        }),
      ]);

      const sellerName = sellerProfile?.storeName ?? "Seller";
      const fallback = (svc: string): ShipmentResult => ({
        sellerId,
        sellerName,
        standard: { easypostRateId: "", carrier: "", service: svc, rateCents: svc === "DDP" ? 0 : shippingFlatRateCents, totalCents: svc === "DDP" ? 0 : shippingFlatRateCents, deliveryDays: null },
        express: null,
      });

      // DDP check — all items must be DDP
      const allDdp = products.every((p) => p.shippingTerms === "INCLUDED_DDP");
      if (allDdp) { shipments.push(fallback("DDP")); continue; }

      // Seller address check
      const org = sellerProfile?.organizationId
        ? await prisma.organization.findUnique({
            where: { id: sellerProfile.organizationId },
            select: { addressStreet: true, addressCity: true, addressState: true, addressZip: true, addressCountry: true },
          })
        : null;

      const fromAddress = org?.addressStreet && org?.addressCity && org?.addressState && org?.addressZip && org?.addressCountry
        ? { street: org.addressStreet, city: org.addressCity, state: org.addressState, zip: org.addressZip, country: org.addressCountry }
        : null;

      if (!fromAddress) { shipments.push(fallback("FALLBACK")); continue; }

      // Build parcel — sum weights, largest dimensions
      let totalWeightOz = 0;
      let maxL = 0, maxW = 0, maxH = 0;

      for (const item of sellerItems) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const qty = item.quantity ?? 1;
        totalWeightOz += (product.weight ?? 0.5) * 35.274 * qty;
        const dims = product.dimensions as { length?: number; width?: number; height?: number } | null;
        maxL = Math.max(maxL, dims?.length ?? 10);
        maxW = Math.max(maxW, dims?.width ?? 10);
        maxH = Math.max(maxH, dims?.height ?? 10);
      }

      if (totalWeightOz === 0) totalWeightOz = 16; // 1 lb fallback

      try {
        const rates = await getShippingRates({
          fromAddress,
          toAddress,
          parcel: { weightOz: totalWeightOz, length: maxL, width: maxW, height: maxH },
          markupPct: shippingMarkupPct,
        });
        shipments.push({ sellerId, sellerName, ...rates });
      } catch {
        shipments.push(fallback("FALLBACK"));
      }
    }

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error("[shipping/rates] error:", error);
    return NextResponse.json({ error: "Failed to calculate shipping rates" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx vitest run __tests__/api/shippingRates.test.ts
```

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add app/api/shipping/rates/route.ts __tests__/api/shippingRates.test.ts
git commit -m "feat: add /api/shipping/rates EasyPost rate calculation endpoint"
```

---

## Task 4: Move Weight + Dimensions to Pricing Form (Mandatory)

**Files:**
- Modify: `components/dashboard/organizations/products/create/product-details-form.tsx`
- Modify: `components/dashboard/organizations/products/create/product-pricing-form.tsx`

- [ ] **Step 1: Remove weight + dimensions from `product-details-form.tsx`**

Open `components/dashboard/organizations/products/create/product-details-form.tsx`.

Remove the entire `Weight (kg)` input block and the `Dimensions (cm)` block (length/width/height inputs). These are the fields that reference `data.weight` and `data.dimensions?.length/width/height`. Keep all other fields (brand, model, size, color, material, tags) unchanged.

- [ ] **Step 2: Add weight + dimensions to `product-pricing-form.tsx` in a Shipping card**

Open `components/dashboard/organizations/products/create/product-pricing-form.tsx`.

Add the following import at the top if not already present:
```ts
import { Input, RadioGroup, Radio, Select, SelectItem, Divider } from "@heroui/react";
```

Insert a new card section **above** the existing "Shipping" radio group (before the `shippingTerms` block). The new block renders inside the existing return JSX:

```tsx
{/* Shipping dimensions — required for rate calculation */}
<div className="space-y-4">
  <div>
    <p className="text-sm font-medium">Shipping Details</p>
    <p className="text-xs text-default-400 mt-0.5">Required for calculating shipping rates at checkout</p>
  </div>

  <Input
    label="Weight (kg)"
    placeholder="e.g., 0.5"
    type="number"
    min="0.01"
    step="0.01"
    isRequired
    value={data.weight ? String(data.weight) : ""}
    onValueChange={(v) => onUpdate({ weight: parseFloat(v) || 0 })}
    description="Total item weight including packaging"
    isInvalid={!data.weight || data.weight <= 0}
    errorMessage={!data.weight || data.weight <= 0 ? "Weight is required" : undefined}
  />

  <div>
    <p className="text-sm font-medium mb-2">Dimensions (cm) <span className="text-danger">*</span></p>
    <div className="grid grid-cols-3 gap-3">
      <Input
        label="Length"
        placeholder="e.g., 30"
        type="number"
        min="1"
        isRequired
        value={data.dimensions?.length ? String(data.dimensions.length) : ""}
        onValueChange={(v) =>
          onUpdate({ dimensions: { ...data.dimensions, length: parseFloat(v) || 0, width: data.dimensions?.width || 0, height: data.dimensions?.height || 0 } })
        }
        isInvalid={!data.dimensions?.length || data.dimensions.length <= 0}
      />
      <Input
        label="Width"
        placeholder="e.g., 20"
        type="number"
        min="1"
        isRequired
        value={data.dimensions?.width ? String(data.dimensions.width) : ""}
        onValueChange={(v) =>
          onUpdate({ dimensions: { ...data.dimensions, length: data.dimensions?.length || 0, width: parseFloat(v) || 0, height: data.dimensions?.height || 0 } })
        }
        isInvalid={!data.dimensions?.width || data.dimensions.width <= 0}
      />
      <Input
        label="Height"
        placeholder="e.g., 10"
        type="number"
        min="1"
        isRequired
        value={data.dimensions?.height ? String(data.dimensions.height) : ""}
        onValueChange={(v) =>
          onUpdate({ dimensions: { ...data.dimensions, length: data.dimensions?.length || 0, width: data.dimensions?.width || 0, height: parseFloat(v) || 0 } })
        }
        isInvalid={!data.dimensions?.height || data.dimensions.height <= 0}
      />
    </div>
  </div>
</div>

<Divider />
```

- [ ] **Step 3: Gate the Continue button on valid dimensions**

In `product-pricing-form.tsx`, find where the Continue/Next button is rendered (or where validation is exported). Add a check:

```ts
const shippingValid =
  (data.weight ?? 0) > 0 &&
  (data.dimensions?.length ?? 0) > 0 &&
  (data.dimensions?.width ?? 0) > 0 &&
  (data.dimensions?.height ?? 0) > 0;
```

Pass `isDisabled={!shippingValid}` to the Continue button (or export `shippingValid` and gate it in `product-creation.tsx` — whichever pattern the existing code uses).

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "team/app.tsx"
```

Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/organizations/products/create/product-details-form.tsx \
        components/dashboard/organizations/products/create/product-pricing-form.tsx
git commit -m "feat: move weight/dimensions to Shipping section in pricing step, make required"
```

---

## Task 5: Admin Settings — Shipping Markup + Flat Rate

**Files:**
- Modify: `server/routers/admin.ts`
- Modify: `app/admin/settings/page.tsx`

- [ ] **Step 1: Extend `updatePlatformSettings` in admin router**

In `server/routers/admin.ts`, find the `updatePlatformSettings` input schema and extend it:

```ts
// Before:
.input(z.object({
  sellerCommissionPct: z.number().min(0).max(1),
  buyerMarketplaceFee: z.number().min(0).max(1),
}))

// After:
.input(z.object({
  sellerCommissionPct:   z.number().min(0).max(1),
  buyerMarketplaceFee:   z.number().min(0).max(1),
  shippingMarkupPct:     z.number().min(0).max(2),
  shippingFlatRateCents: z.number().int().min(0),
}))
```

The `upsert` call already spreads `...input`, so no further change needed.

- [ ] **Step 2: Add inputs to the admin settings page**

In `app/admin/settings/page.tsx`, alongside the existing `commissionPct` and `marketplaceFee` state, add:

```ts
const [shippingMarkup, setShippingMarkup] = useState<string>("");
const [shippingFlat,   setShippingFlat]   = useState<string>("");

const shippingMarkupValue = shippingMarkup !== "" ? shippingMarkup
  : platformSettings ? String(Math.round(platformSettings.shippingMarkupPct * 100)) : "";
const shippingFlatValue = shippingFlat !== "" ? shippingFlat
  : platformSettings ? String(platformSettings.shippingFlatRateCents) : "";
```

Update `handleSaveFees` to include the new fields:

```ts
const handleSaveFees = () => {
  const commission = parseFloat(commissionValue) / 100;
  const fee        = parseFloat(marketplaceValue) / 100;
  const markup     = parseFloat(shippingMarkupValue) / 100;
  const flatRate   = parseInt(shippingFlatValue, 10);
  if (isNaN(commission) || isNaN(fee) || isNaN(markup) || isNaN(flatRate)) return;
  updateSettings.mutate(
    { sellerCommissionPct: commission, buyerMarketplaceFee: fee, shippingMarkupPct: markup, shippingFlatRateCents: flatRate },
    { onSuccess: () => { setFeesSaved(true); setTimeout(() => setFeesSaved(false), 2000); } }
  );
};
```

Add two new inputs in the fees section JSX (below the existing marketplace fee input):

```tsx
<div className="flex gap-3 mt-3">
  <div className="flex-1">
    <label className="text-xs text-gray-400">Shipping Markup (%)</label>
    <input
      type="number" min="0" max="200" step="1"
      value={shippingMarkupValue}
      onChange={(e) => setShippingMarkup(e.target.value)}
      className="w-full mt-1 bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm text-white"
      placeholder="15"
    />
    <p className="text-xs text-gray-500 mt-1">% added on top of EasyPost rate</p>
  </div>
  <div className="flex-1">
    <label className="text-xs text-gray-400">Shipping Fallback Rate (cents)</label>
    <input
      type="number" min="0" step="1"
      value={shippingFlatValue}
      onChange={(e) => setShippingFlat(e.target.value)}
      className="w-full mt-1 bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm text-white"
      placeholder="899"
    />
    <p className="text-xs text-gray-500 mt-1">Used when seller address or EasyPost is unavailable</p>
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "team/app.tsx"
```

Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add server/routers/admin.ts app/admin/settings/page.tsx
git commit -m "feat: add shipping markup and flat rate fallback to admin platform settings"
```

---

## Task 6: Checkout Page — 3-Step Wizard

**Files:**
- Rewrite: `app/(main)/checkout/page.tsx`

- [ ] **Step 1: Replace the checkout page**

Replace the entire contents of `app/(main)/checkout/page.tsx` with:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Button, Card, CardBody, Divider, Input, Select, SelectItem,
  RadioGroup, Radio, Spinner, Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useOnboarding } from "@/contexts/onboarding-context";

type Address = {
  name: string; street: string; apt: string;
  city: string; state: string; zip: string; country: string;
};

type RateOption = {
  easypostRateId: string; carrier: string; service: string;
  rateCents: number; totalCents: number; deliveryDays: number | null;
};

type Shipment = {
  sellerId: string; sellerName: string;
  standard: RateOption; express: RateOption | null;
};

type ShippingSelection = {
  sellerId: string; tier: "standard" | "express";
  rate: RateOption;
};

const COUNTRIES = [
  { key: "US", label: "United States" },
  { key: "CA", label: "Canada" },
  { key: "GB", label: "United Kingdom" },
  { key: "AU", label: "Australia" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

function fmt(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { completeStep } = useOnboarding();
  const guestCart = useGuestCart();
  const { data: fees } = trpc.admin.getPublicFees.useQuery();

  const { data: authCartData, isLoading: cartLoading } = trpc.cart.get.useQuery(
    undefined, { enabled: !!session?.user }
  );

  const cartData = session?.user ? authCartData : guestCart.getCartData();
  const isLoading = isPending || (!!session?.user && cartLoading);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<Address>({
    name: "", street: "", apt: "", city: "", state: "", zip: "", country: "US",
  });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selections, setSelections] = useState<Record<string, ShippingSelection>>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error("Please log in to continue with checkout");
      router.push("/auth/login?redirect=/checkout");
    }
  }, [session, isPending, router]);

  if (isPending || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!session?.user) return null;

  if (!cartData?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto"><CardBody className="text-center py-12">
          <Icon icon="solar:bag-4-linear" className="w-16 h-16 mx-auto mb-4 text-default-400" />
          <h2 className="text-xl font-medium mb-2">Your bag is empty</h2>
          <Button color="primary" onPress={() => router.push("/products")}>Continue Shopping</Button>
        </CardBody></Card>
      </div>
    );
  }

  const subtotal: number = cartData?.subtotal || 0;
  const marketplaceFee: number = subtotal * (fees?.buyerMarketplaceFee ?? 0);
  const shippingTotal = Object.values(selections).reduce((sum, s) => sum + s.rate.totalCents, 0) / 100;
  const total = subtotal + marketplaceFee + shippingTotal;

  const addressValid =
    address.name.trim() && address.street.trim() && address.city.trim() &&
    address.state.trim() && address.zip.trim() && address.country.trim();

  const allSelected = shipments.length > 0 && shipments.every((s) => selections[s.sellerId]);

  const handleFetchRates = async () => {
    if (!addressValid) return;
    setFetchingRates(true);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: { street: address.street + (address.apt ? ` ${address.apt}` : ""), city: address.city, state: address.state, zip: address.zip, country: address.country },
          items: cartData.items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            sellerId: item.product.seller?.id,
          })),
        }),
      });
      if (!res.ok) throw new Error("Rate fetch failed");
      const { shipments: fetched } = await res.json();
      setShipments(fetched);
      // Pre-select standard for each
      const defaults: Record<string, ShippingSelection> = {};
      for (const s of fetched) {
        defaults[s.sellerId] = { sellerId: s.sellerId, tier: "standard", rate: s.standard };
      }
      setSelections(defaults);
      setStep(2);
    } catch {
      toast.error("Failed to calculate shipping rates. Please try again.");
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const shippingSelections = Object.values(selections).map((s) => ({
        sellerId: s.sellerId,
        easypostRateId: s.rate.easypostRateId,
        carrier: s.rate.carrier,
        service: s.rate.service,
        rateCents: s.rate.rateCents,
        totalCents: s.rate.totalCents,
        deliveryDays: s.rate.deliveryDays,
      }));

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartData.items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            price: item.variant?.price || item.product.price,
            name: item.product.title,
            image: item.product.images?.[0],
            sellerId: item.product.seller?.id,
            sellerName: item.product.seller?.storeName,
          })),
          shippingSelections,
        }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      await completeStep("place-order", "buyer");
      window.location.href = url;
    } catch {
      toast.error("Failed to process checkout");
      setIsProcessing(false);
    }
  };

  // ─── Sidebar ───────────────────────────────────────────────────────────────
  const OrderSummary = () => (
    <Card>
      <CardBody className="gap-4">
        <p className="text-sm font-medium">Order Summary</p>
        <div className="space-y-3 max-h-[260px] overflow-y-auto">
          {cartData.items.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative flex-shrink-0">
                <Image src={item.product.images?.[0] || "/placeholder-product.jpg"} alt={item.product.title} className="w-14 h-14 object-cover rounded-lg" />
                <div className="absolute -top-1.5 -right-1.5 bg-default-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{item.quantity}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.title}</p>
                <p className="text-sm text-default-500">${Number(item.variant?.price || item.product.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <Divider />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-default-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span className="text-default-500">Shipping</span>
            <span>{step === 1 ? "Calculated next" : fmt(Object.values(selections).reduce((s, sel) => s + sel.rate.totalCents, 0))}</span>
          </div>
          {marketplaceFee > 0 && <div className="flex justify-between"><span className="text-default-500">Marketplace Fee</span><span>${marketplaceFee.toFixed(2)}</span></div>}
        </div>
        <Divider />
        <div className="flex justify-between font-semibold"><span>Total</span><span>${step === 1 ? (subtotal + marketplaceFee).toFixed(2) : total.toFixed(2)}</span></div>
      </CardBody>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="light" startContent={<Icon icon="solar:arrow-left-linear" />}
          onPress={() => step === 1 ? router.push("/bag") : setStep((s) => (s - 1) as 1 | 2 | 3)}>
          {step === 1 ? "Back to Bag" : "Back"}
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(["Delivery", "Shipping", "Review"] as const).map((label, i) => (
          <React.Fragment key={label}>
            <span className={step === i + 1 ? "font-semibold text-primary" : "text-default-400"}>{i + 1}. {label}</span>
            {i < 2 && <Icon icon="solar:arrow-right-linear" className="text-default-300 w-3 h-3" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ── Step 1: Address ── */}
          {step === 1 && (
            <Card>
              <CardBody className="space-y-4 p-6">
                <h2 className="text-lg font-medium">Delivery Address</h2>
                <Input label="Full Name" isRequired value={address.name} onValueChange={(v) => setAddress((a) => ({ ...a, name: v }))} />
                <Input label="Street Address" isRequired value={address.street} onValueChange={(v) => setAddress((a) => ({ ...a, street: v }))} />
                <Input label="Apt, Suite, Unit (optional)" value={address.apt} onValueChange={(v) => setAddress((a) => ({ ...a, apt: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" isRequired value={address.city} onValueChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
                  <Input label="State / Province" isRequired value={address.state} onValueChange={(v) => setAddress((a) => ({ ...a, state: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Zip / Postal Code" isRequired value={address.zip} onValueChange={(v) => setAddress((a) => ({ ...a, zip: v }))} />
                  <Select label="Country" isRequired selectedKeys={[address.country]} onSelectionChange={(k) => setAddress((a) => ({ ...a, country: Array.from(k)[0] as string }))}>
                    {COUNTRIES.map((c) => <SelectItem key={c.key}>{c.label}</SelectItem>)}
                  </Select>
                </div>
                <Button fullWidth color="primary" size="lg" isDisabled={!addressValid} isLoading={fetchingRates} onPress={handleFetchRates}
                  startContent={!fetchingRates && <Icon icon="solar:box-linear" />}>
                  Continue to Shipping
                </Button>
              </CardBody>
            </Card>
          )}

          {/* ── Step 2: Shipping selection ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Select Shipping</h2>
              {shipments.map((shipment) => (
                <Card key={shipment.sellerId}>
                  <CardBody className="p-5">
                    <p className="text-sm font-medium mb-3">{shipment.sellerName}</p>
                    {shipment.standard.service === "DDP" ? (
                      <p className="text-sm text-success">Shipping included in price</p>
                    ) : shipment.express === null ? (
                      <div className="flex justify-between text-sm">
                        <span>{shipment.standard.carrier} {shipment.standard.service} {shipment.standard.deliveryDays ? `· ${shipment.standard.deliveryDays} days` : ""}</span>
                        <span className="font-medium">{fmt(shipment.standard.totalCents)}</span>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selections[shipment.sellerId]?.tier ?? "standard"}
                        onValueChange={(v) => setSelections((prev) => ({
                          ...prev,
                          [shipment.sellerId]: { sellerId: shipment.sellerId, tier: v as "standard" | "express", rate: v === "express" ? shipment.express! : shipment.standard },
                        }))}
                      >
                        <Radio value="standard" description={`${shipment.standard.carrier} ${shipment.standard.service}${shipment.standard.deliveryDays ? ` · ${shipment.standard.deliveryDays} days` : ""}`}>
                          <span className="font-medium">{fmt(shipment.standard.totalCents)}</span> <span className="text-default-500 text-xs ml-1">Standard</span>
                        </Radio>
                        <Radio value="express" description={`${shipment.express.carrier} ${shipment.express.service}${shipment.express.deliveryDays ? ` · ${shipment.express.deliveryDays} days` : ""}`}>
                          <span className="font-medium">{fmt(shipment.express.totalCents)}</span> <span className="text-default-500 text-xs ml-1">Express</span>
                        </Radio>
                      </RadioGroup>
                    )}
                  </CardBody>
                </Card>
              ))}
              <Button fullWidth color="primary" size="lg" isDisabled={!allSelected} onPress={() => setStep(3)}
                startContent={<Icon icon="solar:checklist-minimalistic-outline" />}>
                Continue to Review
              </Button>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <Card>
              <CardBody className="space-y-5 p-6">
                <h2 className="text-lg font-medium">Review & Pay</h2>

                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wide mb-1">Delivering to</p>
                  <p className="text-sm">{address.name}</p>
                  <p className="text-sm text-default-500">{address.street}{address.apt ? `, ${address.apt}` : ""}, {address.city}, {address.state} {address.zip}</p>
                </div>

                <Divider />

                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wide mb-2">Shipping</p>
                  {shipments.map((s) => {
                    const sel = selections[s.sellerId];
                    if (!sel) return null;
                    return (
                      <div key={s.sellerId} className="flex justify-between text-sm mb-1">
                        <span>{s.sellerName} — {sel.rate.carrier} {sel.rate.service}</span>
                        <span>{fmt(sel.rate.totalCents)}</span>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                <Button fullWidth color="primary" size="lg" isLoading={isProcessing} onPress={handleCheckout}
                  startContent={!isProcessing && <Icon icon="solar:lock-keyhole-bold" />}>
                  {isProcessing ? "Redirecting to Stripe..." : `Pay $${total.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-default-400 flex items-center justify-center gap-1">
                  <Icon icon="solar:shield-check-linear" /> Secure checkout powered by Stripe
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "team/app.tsx"
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/checkout/page.tsx"
git commit -m "feat: replace checkout splash screen with 3-step address/shipping/review wizard"
```

---

## Task 7: Extend create-checkout-session with Shipping Line Items

**Files:**
- Modify: `app/api/stripe/create-checkout-session/route.ts`

- [ ] **Step 1: Accept `shippingSelections` in request and build shipping line items**

In `app/api/stripe/create-checkout-session/route.ts`, after parsing `{ items }` from `request.json()`, also parse `shippingSelections`:

```ts
const { items, shippingSelections = [] } = await request.json();
```

After the existing `lineItems` array is built (after the marketplace fee block), add:

```ts
// Build a quick sellerId → storeName lookup from the items already in the request body
const sellerNameById: Record<string, string> = {};
for (const item of items) {
  if (item.sellerId && item.sellerName) sellerNameById[item.sellerId] = item.sellerName;
}

// Add shipping line items from pre-calculated EasyPost rates
for (const sel of shippingSelections) {
  if (sel.totalCents <= 0) continue; // skip DDP / free shipping

  const sellerLabel = sellerNameById[sel.sellerId] ?? "Seller";

  lineItems.push({
    price_data: {
      currency: "usd",
      product_data: {
        name: `Shipping — ${sellerLabel} (${sel.carrier} ${sel.service})`,
      },
      unit_amount: sel.totalCents,
    },
    quantity: 1,
  });

  // Store in metadata for webhook
  metadata[`shipping_${sel.sellerId}`] = JSON.stringify({
    rateCents:      sel.rateCents,
    totalCents:     sel.totalCents,
    carrier:        sel.carrier,
    service:        sel.service,
    easypostRateId: sel.easypostRateId,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "team/app.tsx"
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/create-checkout-session/route.ts
git commit -m "feat: append EasyPost shipping line items and metadata to Stripe checkout session"
```

---

## Task 8: Webhook — Write Shipping Fields to Order

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Parse shipping metadata in `handleCheckoutSessionCompleted`**

In `app/api/stripe/webhook/route.ts`, inside `handleCheckoutSessionCompleted`, find where `prisma.order.create({...})` is called. Replace the current `shipping: 0` with parsed values from metadata:

```ts
// Parse shipping metadata for this seller
const shippingMeta = metadata[`shipping_${sellerId}`]
  ? JSON.parse(metadata[`shipping_${sellerId}`] as string)
  : null;

const shippingTotal    = shippingMeta ? shippingMeta.totalCents / 100 : 0;
const shippingRaw      = shippingMeta ? shippingMeta.rateCents  / 100 : 0;
const shippingMarkup   = shippingTotal - shippingRaw;
const shippingCarrier  = shippingMeta?.carrier  ?? null;
const shippingService  = shippingMeta?.service  ?? null;
```

Then in the `prisma.order.create({ data: { ... } })` call, update the shipping fields:

```ts
// Replace:
shipping: 0,

// With:
shipping:        shippingTotal,
shippingMarkup:  shippingMarkup,
shippingCarrier: shippingCarrier,
shippingService: shippingService,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "team/app.tsx"
```

Expected: no new errors

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass (no regressions)

- [ ] **Step 4: Final commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: write EasyPost shipping cost, markup, and service to Order on webhook"
```

---

## Task 9: Commit All Session Changes Together

Per project convention, stage and commit all changes in one final sweep if any uncommitted diffs remain.

- [ ] **Step 1: Check for anything unstaged**

```bash
git status && git diff --stat
```

- [ ] **Step 2: If clean, verify the full test suite one more time**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Done — do not push unless explicitly asked**

---

## Testing Checklist (Manual)

After implementation, verify end-to-end in the browser:

- [ ] Add a product to bag as a logged-in buyer
- [ ] Click "Secure Checkout" → lands on `/checkout` at Step 1 (Address)
- [ ] Submit address → Step 2 shows shipping card with Standard and/or Express options
- [ ] Toggle Express → order summary total updates live
- [ ] Click "Continue to Review" → Step 3 shows address + shipping breakdown + total
- [ ] Click "Pay $X.XX" → redirects to Stripe with correct total including shipping
- [ ] Complete Stripe payment → order created with `shipping` and `shippingService` populated
- [ ] Seller org orders page shows correct `$X.XX` total including shipping
- [ ] Create a product without filling in weight/dimensions → Continue button on step 3 stays disabled
- [ ] Admin settings page shows Shipping Markup % and Flat Rate Fallback inputs → save persists
