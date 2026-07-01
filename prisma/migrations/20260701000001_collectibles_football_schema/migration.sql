-- CreateEnum
CREATE TYPE "BallGrade" AS ENUM ('PRO_MATCH', 'COMPETITION', 'LEAGUE', 'TRAINING', 'CLUB', 'MINI_SKILLS');

-- AlterEnum
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'COLLECTIBLES';

-- AlterEnum
ALTER TYPE "ProductSubcategory" ADD VALUE IF NOT EXISTS 'STICKERS';
ALTER TYPE "ProductSubcategory" ADD VALUE IF NOT EXISTS 'TRADING_CARDS';

-- AlterEnum
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'MINT';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'NEAR_MINT';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'EXCELLENT';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'GOOD';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'FAIR';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'POOR';

-- AlterTable
ALTER TABLE "product" ADD COLUMN "collectibleCode" TEXT;
ALTER TABLE "product" ADD COLUMN "setName" TEXT;
ALTER TABLE "product" ADD COLUMN "collectiblePublisher" TEXT;
ALTER TABLE "product" ADD COLUMN "collectiblePlayerName" TEXT;
ALTER TABLE "product" ADD COLUMN "collectibleTeam" TEXT;
ALTER TABLE "product" ADD COLUMN "isPeeled" BOOLEAN;
ALTER TABLE "product" ADD COLUMN "ballSize" INTEGER;
ALTER TABLE "product" ADD COLUMN "ballGrade" "BallGrade";

