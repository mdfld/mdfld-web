-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- Seed default listing scoring weights
INSERT INTO "platform_settings" ("key", "value", "updatedAt")
VALUES (
  'listing_scoring_weights',
  '{"recencyWeight": 0.35, "relevanceWeight": 0.30, "trustWeight": 0.20, "priceWeight": 0.15}',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
