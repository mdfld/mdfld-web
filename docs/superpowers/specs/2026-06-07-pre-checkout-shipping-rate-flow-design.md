# Pre-Checkout Shipping Rate Flow — Design Spec
**Date:** 2026-06-07
**Status:** Approved

---

## Overview

MDFLD acts as Merchant of Record and owns the shipping cost calculation. Before a buyer is redirected to Stripe, they enter their delivery address, receive EasyPost-calculated carrier rates (with MDFLD markup), select Standard or Express per seller shipment, and the locked shipping amount is added as a line item in the Stripe Checkout session. The buyer pays the marked-up rate; MDFLD earns the spread between what the buyer pays and what EasyPost charges when the label is purchased.

---

## Approach

Transform the existing `/checkout` page (currently a splash screen) into a 3-step in-page wizard. No new routes. State lives in `useState`. Back navigation between steps; Step 1 back goes to `/bag`.

---

## Section 1: Data Model Changes

### PlatformSettings — two new fields

```prisma
shippingMarkupPct     Float  @default(0.15)   // 15% margin over EasyPost rate
shippingFlatRateCents Int    @default(899)     // fallback when seller address or EasyPost unavailable
```

Admin can configure both from the existing admin settings panel.

### Order — two new fields

```prisma
shippingMarkup   Decimal  @default(0)   // MDFLD's margin on this order's shipping
shippingService  String?                // e.g. "GroundAdvantage" (carrier already exists)
```

`shippingService: "FALLBACK"` flags orders that used the flat rate fallback for admin visibility.

### Product — mandatory shipping fields

`weightKg`, `lengthCm`, `widthCm`, `heightCm` already exist on the Product schema. They become required (non-zero positive numbers). Enforced at the product creation form level (Zod `z.number().positive()`), not at the DB level (nullable in schema stays as-is to avoid breaking existing listings).

### Migration

One Prisma migration adds `shippingMarkup` and `shippingService` to Order, and `shippingMarkupPct` and `shippingFlatRateCents` to PlatformSettings.

---

## Section 2: EasyPost Rate API

### `lib/easypost.ts` — new file

Extends the existing EasyPost integration (currently tracker-only in `lib/aftership.ts`, which keeps its `createOrGetTracking` export unchanged).

```ts
type RateOption = {
  easypostRateId: string
  carrier: string        // "USPS"
  service: string        // "GroundAdvantage"
  rateCents: number      // raw EasyPost cost (MDFLD pays this)
  totalCents: number     // buyer-facing amount (rateCents * (1 + markupPct), rounded up)
  deliveryDays: number | null
}

async function getShippingRates(params: {
  fromAddress: { street: string; city: string; state: string; zip: string; country: string }
  toAddress:   { street: string; city: string; state: string; zip: string; country: string }
  parcel:      { weightOz: number; length: number; width: number; height: number }  // cm for dims
  markupPct:   number
}): Promise<{ standard: RateOption; express: RateOption | null }>
```

- POST to `https://api.easypost.com/v2/shipments`
- Sort returned rates by `rate` ascending → cheapest = Standard
- Sort by `delivery_days` ascending → fastest with different days = Express (null if no faster option exists)
- `totalCents = Math.ceil(rateCents * (1 + markupPct))`
- Unit conversion: `weightKg * 35.274` → oz; dimensions stay in cm (EasyPost accepts cm)

### `POST /api/shipping/rates` — new route

**Request:**
```ts
{
  toAddress: { street: string; city: string; state: string; zip: string; country: string }
  items: Array<{ productId: string; variantId?: string; quantity: number; sellerId: string }>
}
```

**Logic per unique `sellerId`:**
1. Fetch seller org address (`addressStreet`, `addressCity`, `addressState`, `addressZip`, `addressCountry`)
2. If address incomplete → return flat rate fallback for both Standard and Express, `service: "FALLBACK"`
3. Fetch product weight/dims for all items in this seller's shipment. Parcel = sum of (`weightKg * quantity`) across all seller items → convert to oz. Dimensions = largest single item's L/W/H (approximates the shipping box)
4. If all items have `shippingTerms: INCLUDED_DDP` → return `totalCents: 0`, `service: "DDP"`
5. Call `getShippingRates(...)` — on any error → flat rate fallback
6. Return Standard + Express (Express may be null)

**Response:**
```ts
{
  shipments: Array<{
    sellerId: string
    sellerName: string
    standard: RateOption
    express: RateOption | null
  }>
}
```

---

## Section 3: Checkout Wizard UX (`/checkout` page)

### Step 1 — Delivery Address

Form fields: Full name, Street address, Apt/Suite (optional), City, State, Zip/Postal code, Country (dropdown: US, CA, GB, AU).

- "Continue to Shipping" calls `POST /api/shipping/rates`
- Button shows spinner while fetching; form is disabled during fetch
- On error: toast, user stays on Step 1
- On success: advance to Step 2

### Step 2 — Shipping Selection

One card per seller shipment:

```
┌─────────────────────────────────────────────┐
│ New test store                              │
│                                             │
│ ● Standard  USPS Ground Advantage  3-5d  $10.20 │
│ ○ Express   UPS 2nd Day Air        2d    $18.50 │
└─────────────────────────────────────────────┘
```

- If `express` is null or `service: "FALLBACK"`, only Standard is shown (no radio)
- Order summary sidebar updates live as buyer toggles options
- "Continue to Review" enabled only when every shipment has a selection

### Step 3 — Review & Pay

Read-only order summary: items, subtotal, per-seller shipping breakdown, marketplace fee, grand total. "Continue to Payment" calls `POST /api/stripe/create-checkout-session` with the locked shipping selections and redirects on success.

No edits possible at Step 3 — back button returns to Step 2.

### Order summary sidebar

- Desktop: persistent right column across all three steps
- Mobile: collapsible "Order summary — $XX.XX" bar at top of page

---

## Section 4: Stripe Session and Webhook Changes

### `create-checkout-session` — extended request body

```ts
{
  items: [...existing...],
  shippingSelections: Array<{
    sellerId: string
    easypostRateId: string
    carrier: string
    service: string
    rateCents: number    // MDFLD's cost
    totalCents: number   // buyer pays this
    deliveryDays: number | null
  }>
}
```

For each selection, a shipping line item is appended to `lineItems`:
```ts
{
  price_data: {
    currency: "usd",
    product_data: { name: `Shipping — ${sellerName} (${carrier} ${service})` },
    unit_amount: totalCents,
  },
  quantity: 1,
}
```

Metadata entry per seller:
```ts
metadata[`shipping_${sellerId}`] = JSON.stringify({
  rateCents, totalCents, carrier, service, easypostRateId
})
```

`shipping_address_collection` stays in the Stripe session for billing/fraud purposes — the shipping cost is already locked as a line item.

### Webhook `handleCheckoutSessionCompleted` — additions

When creating each Order, parse `metadata[`shipping_${sellerId}`]`:
- `shipping: totalCents / 100`
- `shippingMarkup: (totalCents - rateCents) / 100`
- `shippingCarrier: carrier`
- `shippingService: service`

Seller `pendingBalance` increment stays unchanged — MDFLD retains the full shipping amount collected. The shipping markup is MDFLD's revenue, recovered when the label is purchased separately.

---

## Section 5: Product Creation — Mandatory Shipping Fields

Weight and dimensions move from "Product Details" (step 2) to a "Shipping" card within "Pricing & Inventory" (step 3), grouped with the existing `shippingTerms`, carrier, and ships-from fields.

The "Shipping" card layout:
```
Shipping
├── Weight (kg)*          [required]
├── Dimensions (cm)*
│   ├── Length            [required]
│   ├── Width             [required]
│   └── Height            [required]
├── Shipping terms        [Calculated at checkout | Included (DDP)]
├── Carrier               [Select carrier]
├── Estimated delivery    [days]
└── Ships from            [Store default / override]
```

Step 3 "Continue" button disabled until weight > 0 and all three dimensions > 0.

---

## Section 6: Error Handling and Edge Cases

| Scenario | Behaviour |
|---|---|
| EasyPost API down | Flat rate fallback per affected shipment; `shippingService: "FALLBACK"` on order |
| Seller address incomplete | Same flat rate fallback |
| All seller items are DDP | `totalCents: 0`, shipping card shows "Included in price" |
| Mixed DDP + CALCULATED same seller | Treat whole shipment as CALCULATED |
| Buyer navigates back to bag mid-wizard | All wizard state cleared on re-entry to `/checkout` |
| EasyPost rate ID expires before label purchase | Rate ID stored in metadata for reference; dollar amount is what's locked in Stripe — re-fetch at label purchase time |
| Cart has items from 2+ sellers | One shipment card per seller on Step 2; selections required for all |

---

## Files Changed / Created

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `shippingMarkup`, `shippingService` to Order; `shippingMarkupPct`, `shippingFlatRateCents` to PlatformSettings |
| `lib/easypost.ts` | New — `getShippingRates()` function |
| `app/api/shipping/rates/route.ts` | New — rate fetch endpoint |
| `app/(main)/checkout/page.tsx` | Replace splash screen with 3-step wizard |
| `app/api/stripe/create-checkout-session/route.ts` | Accept and apply `shippingSelections` |
| `app/api/stripe/webhook/route.ts` | Parse shipping metadata, write to Order |
| `components/dashboard/organizations/products/create/product-creation.tsx` (or equivalent) | Move dimensions to Shipping card, make required |
| `app/admin/settings/page.tsx` | Add markup % and flat rate fallback inputs |

---

## Out of Scope

- EasyPost label purchase (future — seller buys label from MDFLD dashboard)
- International customs/duties calculation
- Buyer-selectable carrier (Standard/Express covers the use case)
- Real-time rate refresh if buyer idles on Step 2 too long
