-- Check for existing bankAccount data before deploying:
-- SELECT id, "bankAccount" FROM "seller_profile" WHERE "bankAccount" IS NOT NULL;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PayoutMethod" AS ENUM ('STRIPE_BANK', 'PAYPAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYOUT_COMPLETED';

ALTER TABLE "seller_profile" DROP COLUMN IF EXISTS "bankAccount";
ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "payoutMethod" "PayoutMethod";
ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "stripeBankLast4" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "payoutSetupAt" TIMESTAMPTZ;
ALTER TABLE "seller_profile" ADD COLUMN IF NOT EXISTS "payoutRequestedAt" TIMESTAMPTZ;

ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "stripeTransferId" TEXT;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "paypalPayoutId" TEXT;
