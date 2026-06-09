# Admin Settlement Flow — Design Spec
Date: 2026-06-09

## Overview

End-to-end seller payout flow for MDFLD (US USD marketplace). Sellers set up a payout method once (Stripe bank account or PayPal). When an order is captured, the seller's pending balance is automatically incremented. After the carrier confirms first scan, the seller can request a withdrawal. Admin reviews pending requests and triggers the payout — the app calls Stripe or PayPal to send real money, records the transaction, and notifies the seller.

## Scope

- Schema: `PayoutMethod` enum, new fields on `SellerProfile` and `Transaction`
- `pendingBalance` auto-increment at order capture
- Seller payout preferences UI + tRPC procedures (`/dashboard/settings/payout`)
- Admin settlements page enhancements (withdrawal queue, payout method column)
- `admin.triggerPayout()` overhaul (real Stripe transfer or PayPal payout)
- `lib/stripe-payouts.ts` and `lib/paypal-payouts.ts`
- Seller payout notification

## Out of Scope

- Automatic payout scheduling (admin manually triggers all payouts)
- Refund flow changes (existing refund decrements pendingBalance as-is)
- Progressive KYC Tier 2/3 enforcement (separate feature)
- PDF payout receipts (on-screen summary + Transaction record is sufficient for MVP)

---

## Schema Changes

### New enum

```prisma
enum PayoutMethod {
  STRIPE_BANK
  PAYPAL
}
```

### SellerProfile — replace `bankAccount String?` with structured payout fields

Remove:
```prisma
bankAccount      String?
```

Add:
```prisma
payoutMethod      PayoutMethod?
paypalEmail       String?
stripeBankLast4   String?    // display only — stored after Stripe confirms bank account
payoutSetupAt     DateTime?  // when payout method was first configured
```

Routing and account numbers are never stored in the MDFLD database. They live in Stripe's vault on the Connected Account.

The existing `stripeAccountId String?` field is reused for the Stripe Custom Connected Account created during payout setup.

### Transaction — add payout receipt fields

```prisma
stripeTransferId  String?    // Stripe transfer ID (STRIPE_BANK payouts)
paypalPayoutId    String?    // PayPal payout batch item ID (PAYPAL payouts)
```

### Migration

One migration file. Note: `bankAccount` is dropped — if any existing sellers have data in this column, export it before deploying (check with `SELECT id, "bankAccount" FROM "SellerProfile" WHERE "bankAccount" IS NOT NULL`).

- `ALTER TABLE "SellerProfile" DROP COLUMN "bankAccount"`
- `ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "payoutMethod" TEXT`
- `ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT`
- `ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "stripeBankLast4" TEXT`
- `ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "payoutSetupAt" TIMESTAMPTZ`
- `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "stripeTransferId" TEXT`
- `ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "paypalPayoutId" TEXT`

---

## Balance Auto-Increment

**Trigger:** when order status advances to `CONFIRMED` with a captured PaymentIntent.

**Location:** `server/routers/order.ts`, in the path where order status is set to CONFIRMED.

**Amount:** `order.subtotal * (1 - sellerProfile.commissionRate)` where `commissionRate` defaults to 0.10. Stripe processing fees are absorbed by the platform and not deducted from seller balance.

**Implementation:** after the order update, add:

```typescript
await ctx.prisma.sellerProfile.update({
  where: { id: order.sellerProfileId },
  data: {
    pendingBalance: {
      increment: order.subtotal * (1 - (order.sellerProfile.commissionRate ?? 0.10))
    }
  }
});
```

**Withdrawal gate:** unchanged. Seller can only call `requestPayout` after `carrierConfirmedAt` is set on their order (first carrier scan via AfterShip webhook). Balance goes up at capture; withdrawal unlocks at shipping confirmation.

---

## Seller Payout Preferences

### Page

Route: `/dashboard/settings/payout`

Linked from the seller dashboard nav. A yellow banner appears in the seller dashboard when `payoutSetupAt` is null: "Set up your payout method to receive payments." with a link to this page.

### Bank Account (Stripe) flow

1. Seller enters: account holder name, routing number (9 digits), account number
2. Client calls `seller.setupStripePayout` tRPC mutation
3. Server: `stripe.accounts.create({ type: 'custom', country: 'US', capabilities: { transfers: { requested: true } } })` — creates a Custom Connected Account
4. Server: `stripe.accounts.createExternalAccount(accountId, { external_account: { object: 'bank_account', country: 'US', currency: 'usd', routing_number, account_number, account_holder_name } })`
5. Server stores: `stripeAccountId`, `stripeBankLast4` (last 4 of account number), `payoutMethod: STRIPE_BANK`, `payoutSetupAt: now()`
6. Routing and account numbers are never written to MDFLD's database

### PayPal flow

1. Seller enters their PayPal email
2. Client calls `seller.setupPaypalPayout` tRPC mutation
3. Server validates email format, stores `paypalEmail`, `payoutMethod: PAYPAL`, `payoutSetupAt: now()`
4. No external API call at setup time — PayPal is called at payout time

### tRPC procedures (in `server/routers/seller.ts` or `server/routers/organization.ts`)

```typescript
seller.setupStripePayout({ routingNumber: string, accountNumber: string, accountHolderName: string })
// → creates Stripe Connected Account + bank account, updates SellerProfile
// → returns { last4: string }

seller.setupPaypalPayout({ paypalEmail: string })
// → stores paypalEmail + payoutMethod on SellerProfile
// → returns { paypalEmail: string }

seller.getPayoutSetup()
// → returns { payoutMethod, displayDetail } where displayDetail is "••••1234" or "paypal@email.com"
// → returns null if not yet set up
```

---

## Admin Settlement Page Enhancements

### Withdrawal request queue

New tab on `/admin/settlements`: "Pending Requests" showing sellers who have called `requestPayout`. Columns: store name, pending balance, payout method, destination (masked bank or PayPal email), date requested.

The existing "All Balances" tab remains unchanged.

### Payout method column

Both tabs add a "Payout Method" column showing:
- "Stripe Bank ••••1234" when `payoutMethod === STRIPE_BANK`
- "PayPal paypal@email.com" when `payoutMethod === PAYPAL`
- "Not set up ⚠" when `payoutMethod` is null (Pay Out button disabled)

### Pay Out flow

1. Admin enters amount (defaults to full `pendingBalance`)
2. Confirmation modal: "Pay $X to [Store] via [Stripe Bank ••••1234 / PayPal email]?"
3. On confirm: `admin.triggerPayout({ sellerProfileId, amount })` mutation fires
4. On success: success banner shows `PayoutSummary`
5. On error: error message shown, balance unchanged

---

## `admin.triggerPayout()` Overhaul

Replaces the existing stub that only writes to the DB.

```typescript
triggerPayout: adminProcedure
  .input(z.object({
    sellerProfileId: z.string(),
    amount: z.number().positive(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Load seller
    // 2. Guard: payoutMethod must be set
    // 3. Guard: amount <= pendingBalance
    // 4. Branch on payoutMethod:
    //    STRIPE_BANK → transferToSeller()
    //    PAYPAL      → sendPaypalPayout()
    // 5. Create Transaction (type PAYOUT, status COMPLETED, stripeTransferId or paypalPayoutId)
    // 6. prisma.$transaction: decrement pendingBalance, increment settledBalance
    // 7. Write AuditLog
    // 8. Create Notification (type PAYOUT_COMPLETED) for seller
    // 9. Return PayoutSummary
  })
```

Steps 5–7 run in a `prisma.$transaction([...])` so a DB failure after a successful Stripe/PayPal call is survivable — the admin will see the error, can re-check the Stripe/PayPal dashboard, and mark the balance settled manually. The transfer ID is returned in the error response so it is not lost.

### PayoutSummary return type

```typescript
type PayoutSummary = {
  sellerName:   string;
  amount:       number;
  method:       "STRIPE_BANK" | "PAYPAL";
  destination:  string;  // "••••1234" or "paypal@email.com"
  transferId:   string;  // Stripe transfer ID or PayPal payout item ID
  timestamp:    Date;
}
```

---

## Payout Execution Libraries

### `lib/stripe-payouts.ts`

```typescript
export async function transferToSeller(params: {
  stripeAccountId: string;
  amountCents:     number;
  reference:       string; // sellerProfileId for reconciliation
}): Promise<{ transferId: string }>

// Calls stripe.transfers.create({ amount, currency: "usd", destination, transfer_group: reference })
// Throws descriptive error on Stripe API failure
```

### `lib/paypal-payouts.ts`

```typescript
export async function sendPaypalPayout(params: {
  paypalEmail:  string;
  amountUsd:    string; // e.g. "42.50"
  senderItemId: string; // sellerProfileId + timestamp for idempotency
}): Promise<{ payoutItemId: string }>

// 1. POST /v1/oauth2/token to get bearer token (PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET)
// 2. POST /v1/payments/payouts with single-item batch
// 3. Returns payout_item_id from batch_header
// Throws descriptive error on PayPal API failure
```

New env vars required: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_URL` (https://api-m.paypal.com for prod, https://api-m.sandbox.paypal.com for sandbox).

---

## Seller Notification

After successful payout:

```typescript
await ctx.prisma.notification.create({
  data: {
    userId: seller.userId,
    type: "PAYOUT_COMPLETED",
    title: "Payment sent",
    content: `$${amount.toFixed(2)} has been sent to your ${method === "STRIPE_BANK" ? "bank account" : "PayPal"} and should arrive within 1 to 2 business days.`,
    metadata: { transferId, amount, method },
  }
})
```

No em dashes in notification copy. Email notification is a future enhancement — in-app notification is sufficient for MVP.

---

## Tests

- `setupStripePayout`: mock `stripe.accounts.create` + `createExternalAccount`, verify SellerProfile updated with correct fields
- `setupStripePayout`: missing routing number throws BAD_REQUEST
- `setupPaypalPayout`: stores email + method, stamps `payoutSetupAt`
- `setupPaypalPayout`: invalid email format throws BAD_REQUEST
- `pendingBalance` increment: order capture increments seller balance by correct net amount
- `pendingBalance` increment: uses seller's custom commissionRate when set
- `transferToSeller`: mock stripe.transfers.create, verify transferId returned
- `sendPaypalPayout`: mock PayPal OAuth + payouts endpoint, verify payoutItemId returned
- `triggerPayout`: STRIPE_BANK path — calls transferToSeller, creates Transaction with stripeTransferId, decrements pendingBalance
- `triggerPayout`: PAYPAL path — calls sendPaypalPayout, creates Transaction with paypalPayoutId
- `triggerPayout`: amount > pendingBalance throws BAD_REQUEST
- `triggerPayout`: payoutMethod not set throws PRECONDITION_FAILED
- `triggerPayout`: Stripe API failure does not decrement balance (DB transaction rolls back)
- `triggerPayout`: returns correct PayoutSummary shape
- Admin settlements page: "Not set up" shown when payoutMethod is null, Pay Out disabled
- Admin settlements page: success banner shows PayoutSummary after payout
