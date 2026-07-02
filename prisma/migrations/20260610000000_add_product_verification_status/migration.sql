-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ProductVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED_AUTHENTIC', 'VERIFIED_REPLICA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "verificationStatus" "ProductVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
