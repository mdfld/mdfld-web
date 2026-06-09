ALTER TABLE "order" ADD COLUMN "easypostShipmentId" TEXT;
ALTER TABLE "order" ADD COLUMN "labelUrl" TEXT;
ALTER TABLE "order" ADD COLUMN "labelTrackingNumber" TEXT;
ALTER TABLE "order" ADD COLUMN "labelCarrier" TEXT;
ALTER TABLE "order" ADD COLUMN "labelBoughtAt" TIMESTAMP(3);
