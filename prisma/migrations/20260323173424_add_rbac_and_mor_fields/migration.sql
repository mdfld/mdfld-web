-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable user: add role field
ALTER TABLE "user" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'BUYER';

-- AlterTable organization: add storeStatus field
ALTER TABLE "organization" ADD COLUMN "storeStatus" "StoreStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable seller_profile: add MoR balance fields
ALTER TABLE "seller_profile" ADD COLUMN "pendingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN "settledBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.00;
