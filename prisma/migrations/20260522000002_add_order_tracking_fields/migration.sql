ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "trackingNumber"          TEXT,
  ADD COLUMN IF NOT EXISTS "trackingCarrier"         TEXT,
  ADD COLUMN IF NOT EXISTS "trackingStatus"          TEXT,
  ADD COLUMN IF NOT EXISTS "carrierConfirmedAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "withdrawalRequestedAt"   TIMESTAMPTZ;
