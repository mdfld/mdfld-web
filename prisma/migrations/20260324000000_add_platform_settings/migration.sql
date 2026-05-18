-- CreateTable: PlatformSettings (singleton row for global fee config)
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "sellerCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "buyerMarketplaceFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "PlatformSettings" ("id", "sellerCommissionPct", "buyerMarketplaceFee", "updatedAt")
VALUES ('singleton', 0.10, 0.00, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
