-- AddColumn
ALTER TABLE "product" ADD COLUMN "tradeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "TradeOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'SHIPPING', 'COMPLETED', 'EXPIRED', 'DISPUTED');

-- AlterEnum: ConversationType
ALTER TYPE "ConversationType" ADD VALUE 'TRADE';

-- AlterEnum: NotificationType (each ADD VALUE must be a separate statement)
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_SHIPPED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_COMPLETED';

-- CreateTable
CREATE TABLE "trade_offer" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "requestedProductId" TEXT NOT NULL,
    "offeredProductId" TEXT,
    "cashAmount" DECIMAL(65,30),
    "cashFromProposer" BOOLEAN NOT NULL DEFAULT true,
    "status" "TradeOfferStatus" NOT NULL DEFAULT 'PENDING',
    "proposerTrackingNumber" TEXT,
    "recipientTrackingNumber" TEXT,
    "proposerShippedAt" TIMESTAMP(3),
    "recipientShippedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trade_offer_conversationId_key" ON "trade_offer"("conversationId");
CREATE INDEX "trade_offer_proposerId_idx" ON "trade_offer"("proposerId");
CREATE INDEX "trade_offer_recipientId_idx" ON "trade_offer"("recipientId");
CREATE INDEX "trade_offer_status_idx" ON "trade_offer"("status");

-- AddForeignKey
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_requestedProductId_fkey" FOREIGN KEY ("requestedProductId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_offer" ADD CONSTRAINT "trade_offer_offeredProductId_fkey" FOREIGN KEY ("offeredProductId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
