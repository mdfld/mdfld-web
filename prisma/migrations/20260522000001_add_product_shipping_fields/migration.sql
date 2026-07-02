CREATE TYPE "ShippingTerms" AS ENUM ('CALCULATED', 'INCLUDED_DDP');

ALTER TABLE "product"
  ADD COLUMN IF NOT EXISTS "shippingTerms"      "ShippingTerms" NOT NULL DEFAULT 'CALCULATED',
  ADD COLUMN IF NOT EXISTS "shippingCarrier"     TEXT,
  ADD COLUMN IF NOT EXISTS "estimatedDeliveryDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "shipsFromCountry"    TEXT;
