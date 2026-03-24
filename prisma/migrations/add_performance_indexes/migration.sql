-- Performance indexes for product table
CREATE INDEX IF NOT EXISTS "product_sellerProfileId_idx" ON "product"("sellerProfileId");
CREATE INDEX IF NOT EXISTS "product_organizationId_idx" ON "product"("organizationId");
CREATE INDEX IF NOT EXISTS "product_isActive_idx" ON "product"("isActive");
CREATE INDEX IF NOT EXISTS "product_category_idx" ON "product"("category");
CREATE INDEX IF NOT EXISTS "product_createdAt_idx" ON "product"("createdAt");

-- Performance indexes for order table
CREATE INDEX IF NOT EXISTS "order_buyerProfileId_idx" ON "order"("buyerProfileId");
CREATE INDEX IF NOT EXISTS "order_sellerProfileId_idx" ON "order"("sellerProfileId");
CREATE INDEX IF NOT EXISTS "order_createdAt_idx" ON "order"("createdAt");

-- Performance indexes for notification table
CREATE INDEX IF NOT EXISTS "notification_userId_idx" ON "notification"("userId");
CREATE INDEX IF NOT EXISTS "notification_isRead_idx" ON "notification"("isRead");

-- GIN index for fast user search (replaces slow ILIKE full table scans)
CREATE INDEX IF NOT EXISTS "user_name_search_idx" ON "user" USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS "user_username_search_idx" ON "user" USING GIN (to_tsvector('english', username));
