# EasyPost Label Purchase — Design Spec
Date: 2026-06-08

## Overview

Sellers can buy a prepaid shipping label directly from their order dashboard with one click. The label is purchased through EasyPost at the cheapest available rate. MDFLD's margin is the difference between the marked-up shipping cost the buyer paid at checkout and the raw EasyPost label cost. After purchase, the tracking number is auto-populated on the order so AfterShip's webhook handles the SHIPPED transition on first carrier scan. Manual tracking entry remains available as a fallback for sellers using their own carrier.

## Scope

- New `buyShippingLabel()` function in `lib/easypost.ts`
- New `order.buyLabel` tRPC procedure in `server/routers/order.ts`
- Schema: 5 new nullable fields on `Order`
- UI: "Ship Order" / "Re-download Label" button in `components/dashboard/organizations/orders/app.tsx`
- Manual tracking entry unchanged

## Schema Changes

Add to `Order` model in `prisma/schema.prisma`:

```prisma
easypostShipmentId  String?
labelUrl            String?
labelTrackingNumber String?
labelCarrier        String?
labelBoughtAt       DateTime?
```

When a label is purchased:
- All five fields are written to the Order row
- `trackingNumber` and `trackingCarrier` (existing fields) are also written from the label result so the AfterShip verification flow (first scan → `carrierConfirmedAt` → withdrawal unlock) triggers automatically

## `lib/easypost.ts` — `buyShippingLabel()`

New function alongside existing `getShippingRates()`:

```typescript
export async function buyShippingLabel(params: {
  fromAddress: { street: string; city: string; state: string; zip: string; country: string };
  toAddress:   { street: string; city: string; state: string; zip: string; country: string; name: string };
  parcel:      { weightOz: number; length: number; width: number; height: number };
  reference:   string; // order number, for EasyPost dashboard visibility
}): Promise<{
  shipmentId:     string;
  labelUrl:       string;
  trackingNumber: string;
  carrier:        string;
  rateCents:      number;
}>
```

**Implementation:**
1. `POST /v2/shipments` with addresses, parcel, and `options.label_format: "PDF"`
2. Sort returned `rates` array by `rate` (float, ascending) — pick `rates[0]`
3. `POST /v2/shipments/:id/buy` with `{ rate: { id: lowestRateId } }`
4. Return `{ shipmentId, labelUrl: postage_label.label_url, trackingNumber: tracking_code, carrier: selected_rate.carrier, rateCents: Math.round(selected_rate.rate * 100) }`

**Parcel building:**
- Order items each have a product with `weight: Float?` (oz) and `dimensions: Json?` (`{ length, width, height }` in inches)
- Aggregate: sum weights, use max of each dimension across items
- Fallback if any field is null: `{ weightOz: 16, length: 12, width: 10, height: 6 }` with `console.warn` logging the orderId

**Error handling:**
- EasyPost API errors throw with a descriptive message that surfaces as `INTERNAL_SERVER_ERROR` in the tRPC mutation
- No retry logic — seller can click again

## `order.buyLabel` tRPC Procedure

New `protectedProcedure` in `server/routers/order.ts`:

**Input:** `{ orderId: string }`

**Authorization:** `order.sellerProfileId` must belong to `ctx.user.id` (same check as `submitTracking`)

**Status guard:** order must be `CONFIRMED` or `PROCESSING` — throws `BAD_REQUEST` otherwise

**Idempotency:** if `order.labelBoughtAt` is already set, return `{ labelUrl: order.labelUrl }` immediately — no second EasyPost charge

**Execution:**
1. Load order with: `shippingAddress`, `organization` (for seller address fields), `items` with `product { weight, dimensions }`
2. Build `fromAddress` from `organization.addressStreet/City/State/Zip/Country`
3. Build `toAddress` from `order.shippingAddress` JSON
4. Build `parcel` from aggregated product weight/dimensions (with fallback)
5. Call `buyShippingLabel({ fromAddress, toAddress, parcel, reference: order.orderNumber })`
6. `prisma.order.update` — write all five label fields + `trackingNumber` + `trackingCarrier`
7. Call `createOrGetTracking(trackingNumber, carrier)` to register tracker with AfterShip (same as `submitTracking` does)
8. Return `{ labelUrl }`

**No order status change** — status advances to SHIPPED only on first carrier scan via existing AfterShip webhook

## UI — Seller Dashboard

File: `components/dashboard/organizations/orders/app.tsx`

**"Ship Order" button:**
- Shown when: order status is `CONFIRMED` or `PROCESSING` AND `order.labelBoughtAt` is null
- `isLoading` while `buyLabelMutation.isPending`
- On success: `window.open(data.labelUrl, "_blank")` + `toast.success("Label purchased. Tracking number auto-filled.")`
- On error: `toast.error(e.message)`

**"Re-download Label" button:**
- Shown when: `order.labelUrl` is set (label already purchased)
- On click: `window.open(order.labelUrl, "_blank")` — no mutation, no charge

**Tracking fields (existing manual section):**
- If `order.labelTrackingNumber` is set: tracking number and carrier inputs are pre-filled and read-only (with a "Purchased via Ship Order" note)
- If not set: inputs remain editable as today — seller can enter manually

**No other UI changes.**

## Order Status Flow (unchanged)

```
CONFIRMED / PROCESSING
  → [seller clicks Ship Order] → label purchased, tracking registered with AfterShip
  → [carrier first scan] → AfterShip webhook → carrierConfirmedAt set → SHIPPED
  → [delivery] → DELIVERED
  → [seller requests withdrawal] → requires carrierConfirmedAt
```

## Tests

- `buyShippingLabel()`: mocked EasyPost HTTP, verify cheapest rate selected, correct fields returned
- `buyShippingLabel()` with missing dimensions: fallback parcel used, no throw
- `order.buyLabel`: success path — label fields + trackingNumber written, AfterShip called
- `order.buyLabel`: idempotency — second call returns existing labelUrl, no EasyPost call
- `order.buyLabel`: wrong seller throws FORBIDDEN
- `order.buyLabel`: wrong status throws BAD_REQUEST
- UI: "Ship Order" button visible for CONFIRMED order with no label
- UI: "Re-download Label" visible when labelUrl is set
- UI: tracking fields read-only when labelTrackingNumber is set
