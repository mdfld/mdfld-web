-- AlterTable: add shippingMarkup and shippingService to Order
ALTER TABLE "order" ADD COLUMN "shippingMarkup" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "order" ADD COLUMN "shippingService" TEXT;

-- AlterTable: add shippingMarkupPct and shippingFlatRateCents to PlatformSettings
ALTER TABLE "PlatformSettings" ADD COLUMN "shippingMarkupPct" DOUBLE PRECISION NOT NULL DEFAULT 0.15;
ALTER TABLE "PlatformSettings" ADD COLUMN "shippingFlatRateCents" INTEGER NOT NULL DEFAULT 899;
