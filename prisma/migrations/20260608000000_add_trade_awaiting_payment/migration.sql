-- AlterEnum: add AWAITING_PAYMENT status to TradeOfferStatus
ALTER TYPE "TradeOfferStatus" ADD VALUE 'AWAITING_PAYMENT' AFTER 'PENDING';

-- AlterTable: add cashStripeSessionId to TradeOffer
ALTER TABLE "trade_offer" ADD COLUMN "cashStripeSessionId" TEXT;
