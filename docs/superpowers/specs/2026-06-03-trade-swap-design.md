# Trade/Swap Offer Flow — Design Spec
Date: 2026-06-03

## Overview

Platform-facilitated item swap flow for MDFLD. Sellers opt in per listing. Buyers can propose a straight item-for-item swap, a swap with a cash sweetener, or a cash-only offer. Both shipping legs are tracked with tracking numbers. The platform owns the status lifecycle end-to-end. This is the primary moat feature over eBay and Facebook groups for the sticker community.

**Out of scope (follow-up sprint):** Stripe processing of the cash sweetener leg. Cash amount is recorded as stated intent at MVP only.

---

## Architecture: Approach C

New `TradeOffer` model linked one-to-one to a `Conversation` of type `TRADE`. The conversation is the negotiation thread. The `TradeOffer` record is the state machine. All trade actions happen through the inbox -- no separate trade detail page.

---

## Schema Changes

### 1. Product -- new field

```prisma
tradeEnabled Boolean @default(false)
```

Opt-in, off by default on all existing listings. Sellers toggle this when creating or editing a listing.

### 2. ConversationType enum -- new value

```prisma
TRADE
```

### 3. NotificationType enum -- five new values

```prisma
TRADE_OFFER_RECEIVED
TRADE_OFFER_ACCEPTED
TRADE_OFFER_DECLINED
TRADE_OFFER_SHIPPED
TRADE_OFFER_COMPLETED
```

### 4. New TradeOfferStatus enum

```prisma
enum TradeOfferStatus {
  PENDING      // Offer sent, awaiting response
  ACCEPTED     // Recipient accepted, awaiting shipping from both
  DECLINED     // Recipient declined
  CANCELLED    // Proposer cancelled before response
  SHIPPING     // At least one party has uploaded tracking
  COMPLETED    // Both tracking numbers uploaded
  EXPIRED      // Auto-expired after 7 days with no response
  DISPUTED     // Flagged for admin review
}
```

### 5. New TradeOffer model

```prisma
model TradeOffer {
  id                      String           @id @default(cuid())
  conversationId          String           @unique
  proposerId              String
  recipientId             String
  requestedProductId      String
  offeredProductId        String?          // null = cash-only offer
  cashAmount              Decimal?         // optional sweetener
  cashFromProposer        Boolean          @default(true) // always true at MVP; cashFromProposer=false (recipient adds cash counter-offer) is out of scope
  status                  TradeOfferStatus @default(PENDING)

  // Shipping tracking -- both legs
  proposerTrackingNumber  String?
  recipientTrackingNumber String?
  proposerShippedAt       DateTime?
  recipientShippedAt      DateTime?

  expiresAt               DateTime?        // default: 7 days from creation
  completedAt             DateTime?
  cancelledAt             DateTime?

  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt

  conversation            Conversation     @relation(fields: [conversationId], references: [id])
  proposer                User             @relation("TradeProposer", fields: [proposerId], references: [id])
  recipient               User             @relation("TradeRecipient", fields: [recipientId], references: [id])
  requestedProduct        Product          @relation("RequestedProduct", fields: [requestedProductId], references: [id])
  offeredProduct          Product?         @relation("OfferedProduct", fields: [offeredProductId], references: [id])

  @@index([proposerId])
  @@index([recipientId])
  @@index([status])
  @@map("trade_offer")
}
```

### 6. Conversation model -- add TradeOffer relation

```prisma
tradeOffer TradeOffer?
```

### 7. Product model -- add TradeOffer relations

```prisma
tradeOfferRequests  TradeOffer[] @relation("RequestedProduct")
tradeOffersMade     TradeOffer[] @relation("OfferedProduct")
```

### 8. User model -- add TradeOffer relations

```prisma
tradeOffersProposed TradeOffer[] @relation("TradeProposer")
tradeOffersReceived TradeOffer[] @relation("TradeRecipient")
```

---

## tRPC Router: `tradeRouter`

All procedures are `protectedProcedure`. New file: `server/routers/trade.ts`. Register on the app router.

### `proposeOffer` (mutation)

Input: `requestedProductId`, `offeredProductId?`, `cashAmount?`, `message?`

Logic:
1. Verify `requestedProduct.tradeEnabled === true`. Throw BAD_REQUEST if not.
2. Verify proposer is not the seller of the requested product. Throw BAD_REQUEST if so.
3. Verify `offeredProductId` (if provided) belongs to the proposer. Throw FORBIDDEN if not.
4. Validate at least one of `offeredProductId` or `cashAmount > 0` is present.
5. Check no existing PENDING trade offer from this proposer on this product exists. Throw CONFLICT if so.
6. In a Prisma transaction: create `TradeOffer` + create `Conversation` of type `TRADE` with both users as participants. Set `expiresAt` to now + 7 days.
7. If `message` provided, create a `Message` of type `TEXT` in the conversation.
8. Fire `TRADE_OFFER_RECEIVED` notification to recipient.
9. Return `{ tradeOfferId, conversationId }`.

### `respondToOffer` (mutation)

Input: `tradeOfferId`, `response: "ACCEPTED" | "DECLINED"`

Logic:
1. Verify caller is the recipient. Throw FORBIDDEN if not.
2. Verify status is PENDING. Throw BAD_REQUEST if not.
3. Update status to ACCEPTED or DECLINED.
4. Fire `TRADE_OFFER_ACCEPTED` or `TRADE_OFFER_DECLINED` notification to proposer.
5. Return updated offer.

### `cancelOffer` (mutation)

Input: `tradeOfferId`

Logic:
1. Verify caller is the proposer. Throw FORBIDDEN if not.
2. Verify status is PENDING. Throw BAD_REQUEST if not.
3. Update status to CANCELLED, set `cancelledAt`.
4. Return updated offer.

### `uploadTracking` (mutation)

Input: `tradeOfferId`, `trackingNumber`

Logic:
1. Verify caller is either proposer or recipient. Throw FORBIDDEN if not.
2. Verify status is ACCEPTED or SHIPPING. Throw BAD_REQUEST if not.
3. Write tracking number and shippedAt timestamp to the correct leg (proposer or recipient).
4. Advance status to SHIPPING.
5. Fire `TRADE_OFFER_SHIPPED` notification to the other party.
6. If both legs now have tracking numbers, advance status to COMPLETED, set `completedAt`, fire `TRADE_OFFER_COMPLETED` to both parties.
7. Return updated offer.

### `getMyOffers` (query)

No input. Returns all trade offers where `proposerId` or `recipientId` is the current user. Includes both product thumbnails, titles, prices, and the other party's name and avatar. Ordered by `createdAt` desc.

### `getOfferByConversation` (query)

Input: `conversationId`

Returns the `TradeOffer` linked to that conversation, with both products and both users. Verifies caller is a participant in the conversation before returning.

---

## UI

### Product Page (`components/product-layout/product-view-item.tsx`)

New prop: `tradeEnabled?: boolean`

Additions (only rendered when `tradeEnabled` is true and viewer is not the seller):
- Third secondary CTA button: `variant="bordered" size="lg" fullWidth startContent={<Icon icon="solar:transfer-horizontal-linear" />}` — "Propose Trade". Same row as "Message Seller". Guest click redirects to `/auth/signin?callbackUrl=<current-url>`.
- Opens `ProposeTradeModal`.

### `ProposeTradeModal` (`components/product/propose-trade-modal.tsx`)

Two-step HeroUI `Modal`.

**Step 1 -- Build offer:**
- If viewer has active listings (fetched via `trpc.product.myListings` or similar): HeroUI `Select` showing own listings (thumbnail + title + price). First option is "Cash only -- no item". Selecting "Cash only" disables the item selection.
- If viewer has no active listings: skip the select, show a muted note "You have no active listings. You can make a cash offer."
- `Input` for cash amount, type number, label "Cash sweetener (optional)", placeholder "0.00". Visible regardless.
- `Textarea` for opening message, label "Add a message (optional)".
- "Next" button. Disabled if neither an item nor cash > 0 is provided.

**Step 2 -- Confirm:**
- Summary card: "[Offered item thumbnail + title]" + swap icon + "[Requested item thumbnail + title]", with cash amount shown if > 0. Cash-only shows "£X cash" on the left.
- "Send Offer" button calls `trade.proposeOffer`. On success, push to `/dashboard/inbox?conversation=<id>`.
- "Back" button returns to Step 1.

### Listing Form -- Trade Toggle

In the existing product edit/create form (product-basic-form.tsx or equivalent), add a `Switch` component labeled "Accept trade offers" mapped to `tradeEnabled`. Placed in the pricing/visibility section.

### Inbox -- Conversation List

In `messaging-chat-conversations.tsx`, for TRADE type conversations: render a HeroUI `Chip` with color and label mapped to status:
- PENDING: yellow, "Pending"
- ACCEPTED: blue, "Accepted"
- SHIPPING: orange, "Shipping"
- COMPLETED: green, "Complete"
- DECLINED / CANCELLED / EXPIRED: red/default, status label

Chip sits right-aligned in the conversation row. If unread count > 0, show both chip and badge.

### Inbox -- `TradeOfferCard` (`components/dashboard/inbox/trade-offer-card.tsx`)

Rendered at the top of `messaging-chat-window.tsx` when `getOfferByConversation` returns a trade offer.

Layout:
- Two product cards side by side (thumbnail + title + price) with a solar swap icon between them. Cash-only shows a currency card on the left.
- Status badge centered below items.
- Cash amount shown if present: "including £X cash" below the items.
- Action buttons below (context-aware, see table below):

| Viewer | Status | Buttons |
|--------|--------|---------|
| Recipient | PENDING | Accept (green primary), Decline (red flat) |
| Proposer | PENDING | Cancel Offer (flat/ghost) |
| Either | ACCEPTED | Upload Tracking (primary) -- grayed with checkmark once uploaded for that party |
| Either | SHIPPING | Upload Tracking (same as above, grayed if already uploaded) |
| Either | COMPLETED | "Trade Complete" banner, no buttons |
| Either | DECLINED / CANCELLED / EXPIRED | No buttons, status explains state |

Chat input remains fully functional at all statuses.

### Dashboard Trades Page (`app/(dashboard)/dashboard/trades/page.tsx`)

Two tabs: "Received" and "Sent". Default: Received.

Each row: offered item thumbnail, swap icon, requested item thumbnail, other party avatar + name, status chip, "View" button linking to `/dashboard/inbox?conversation=<id>`.

Empty states: "No trade offers received yet" (Received tab), "You haven't sent any trade offers yet" (Sent tab), each with a CTA to `/shop`.

Sidebar: add "Trades" link under Inbox in the dashboard sidebar nav.

---

## State Machine

```
PENDING
  → ACCEPTED (recipient accepts)
  → DECLINED (recipient declines)
  → CANCELLED (proposer cancels)
  → EXPIRED (7 days elapsed -- lazy check on read at MVP, no cron required)

ACCEPTED
  → SHIPPING (either party uploads tracking)

SHIPPING
  → COMPLETED (both tracking numbers present)
  → DISPUTED (admin or either party flags)

COMPLETED -- terminal
DECLINED -- terminal
CANCELLED -- terminal
EXPIRED -- terminal
DISPUTED -- admin resolves
```

---

## Validation Rules

- Proposer cannot propose a trade on their own listing.
- `offeredProductId` must belong to the proposer and be active.
- At least one of `offeredProductId` or `cashAmount > 0` must be present.
- Only one PENDING offer per proposer per requested product at a time.
- `respondToOffer` only callable by recipient, only when PENDING.
- `cancelOffer` only callable by proposer, only when PENDING.
- `uploadTracking` only callable when status is ACCEPTED or SHIPPING.

---

## Migration

New migration: `20260603000001_add_trade_offer`

Adds: `trade_offer` table, alters `ConversationType` enum (ADD VALUE 'TRADE'), alters `NotificationType` enum (ADD VALUE for each of the 5 new types), alters `TradeOfferStatus` enum (new type), adds `tradeEnabled` column to `product` table.

---

## Testing

New test file: `tests/trade-offer.test.ts` (Vitest, node env).

Covered cases:
1. `proposeOffer` -- happy path (item swap)
2. `proposeOffer` -- happy path (cash only)
3. `proposeOffer` -- happy path (item + cash)
4. `proposeOffer` -- rejects when `tradeEnabled` is false
5. `proposeOffer` -- rejects when proposer owns the product
6. `proposeOffer` -- rejects when neither item nor cash provided
7. `respondToOffer` -- accept sets status ACCEPTED
8. `respondToOffer` -- decline sets status DECLINED
9. `respondToOffer` -- rejects if called by proposer
10. `cancelOffer` -- sets status CANCELLED
11. `uploadTracking` -- one leg sets status SHIPPING
12. `uploadTracking` -- both legs sets status COMPLETED
13. `getMyOffers` -- returns offers for both proposer and recipient roles

New test file: `tests/propose-trade-modal.test.ts` (Vitest + React Testing Library).

Covered cases:
1. Does not render "Propose Trade" button when `tradeEnabled` is false
2. Renders "Propose Trade" button when `tradeEnabled` is true and viewer is not seller
3. Does not render when viewer is the seller
4. Step 1 "Next" button disabled when no item and no cash
5. Step 1 "Next" button enabled when cash > 0

New test file: `tests/trade-offer-card.test.ts`.

Covered cases:
1. Recipient sees Accept + Decline when PENDING
2. Proposer sees Cancel when PENDING
3. Both see Upload Tracking when ACCEPTED
4. No action buttons when COMPLETED
