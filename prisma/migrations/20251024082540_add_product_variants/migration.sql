-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('SIZE_COLOR', 'SIZE_ONLY', 'COLOR_ONLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SizeSystem" AS ENUM ('UK', 'US', 'EU', 'JP', 'CM', 'STANDARD', 'ONE_SIZE');

-- CreateEnum
CREATE TYPE "SizeChartType" AS ENUM ('FOOTWEAR', 'APPAREL', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('BRAND_NEW', 'NEW_WITH_TAGS', 'NEW_WITHOUT_TAGS', 'USED_LIKE_NEW', 'USED_GOOD', 'USED_FAIR');

-- CreateEnum
CREATE TYPE "ProductTier" AS ENUM ('ELITE', 'PRO', 'ACADEMY', 'CLUB');

-- CreateEnum
CREATE TYPE "SoleplateType" AS ENUM ('FG', 'AG', 'SG', 'HG', 'TF', 'IC', 'MG');

-- CreateEnum
CREATE TYPE "PlayerVersion" AS ENUM ('AUTHENTIC', 'REPLICA', 'STADIUM', 'MATCH');

-- AlterTable Product
ALTER TABLE "product" ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "product" ADD COLUMN "variantType" "VariantType";
ALTER TABLE "product" ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'BRAND_NEW';
ALTER TABLE "product" ADD COLUMN "tier" "ProductTier";
ALTER TABLE "product" ADD COLUMN "year" INTEGER;
ALTER TABLE "product" ADD COLUMN "season" TEXT;
ALTER TABLE "product" ADD COLUMN "material" TEXT;
ALTER TABLE "product" ADD COLUMN "soleplateType" "SoleplateType";
ALTER TABLE "product" ADD COLUMN "playerVersion" "PlayerVersion";

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeValue" TEXT NOT NULL,
    "sizeSystem" "SizeSystem" NOT NULL,
    "sizeDisplay" TEXT NOT NULL,
    "color" TEXT,
    "colorHex" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER DEFAULT 5,
    "images" TEXT[],
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_chart" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "chartType" "SizeChartType" NOT NULL,
    "conversions" JSONB NOT NULL,

    CONSTRAINT "size_chart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_key" ON "product_variant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_productId_sizeValue_sizeSystem_color_key" ON "product_variant"("productId", "sizeValue", "sizeSystem", "color");

-- CreateIndex
CREATE UNIQUE INDEX "size_chart_productId_key" ON "size_chart"("productId");

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_chart" ADD CONSTRAINT "size_chart_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;