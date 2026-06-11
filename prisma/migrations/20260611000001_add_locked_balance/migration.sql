-- Table names below match the @@map directives ("seller_profile", "order"),
-- not the PascalCase ("SellerProfile", "Transaction") used in
-- 20260609000001_add_payout_method_fields.

ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "lockedBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.00;

-- Backfill: best-effort estimate of how much of each seller's pendingBalance
-- comes from orders that haven't been carrier-confirmed yet.
UPDATE "seller_profile" sp
SET "lockedBalance" = LEAST(
  sp."pendingBalance",
  COALESCE((
    SELECT SUM(o."subtotal" - COALESCE(o."applicationFeeAmount", 0))
    FROM "order" o
    WHERE o."sellerProfileId" = sp.id
      AND o."paymentStatus" = 'CAPTURED'
      AND o."carrierConfirmedAt" IS NULL
  ), 0)
);

ALTER TABLE "order" DROP COLUMN IF EXISTS "withdrawalRequestedAt";
