ALTER TYPE "TradeOfferStatus" ADD VALUE 'COUNTERED';
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_OFFER_COUNTERED';

ALTER TABLE "trade_offer"
  ADD COLUMN "counterCashAmount" DECIMAL,
  ADD COLUMN "counterById"       TEXT;
