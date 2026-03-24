-- Add OAuth fields to SellerProfile
ALTER TABLE "seller_profile" ADD COLUMN "shopifyAccessToken" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN "shopifyShopDomain" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN "shopifyTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "seller_profile" ADD COLUMN "ebayAccessToken" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN "ebayRefreshToken" TEXT;
ALTER TABLE "seller_profile" ADD COLUMN "ebayTokenExpiresAt" TIMESTAMP(3);

-- Create ImportSession model
CREATE TABLE "import_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "rows" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_session_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "seller_profile" ("id") ON DELETE CASCADE
);

-- Create index on sellerId for performance
CREATE INDEX "import_session_sellerId_idx" ON "import_session"("sellerId");
