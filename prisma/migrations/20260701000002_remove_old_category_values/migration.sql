-- Remove STICKERS and TRADING_CARDS from ProductCategory enum
-- Step 1: create replacement enum without the old values
CREATE TYPE "ProductCategory_new" AS ENUM (
  'JERSEYS',
  'BOOTS',
  'FOOTBALLS',
  'GOALKEEPER_GLOVES',
  'SHIN_GUARDS',
  'TRAINING_EQUIPMENT',
  'ACCESSORIES',
  'COLLECTIBLES'
);

-- Step 2: migrate the column
ALTER TABLE "product"
  ALTER COLUMN "category" TYPE "ProductCategory_new"
  USING "category"::text::"ProductCategory_new";

-- Step 3: swap names
DROP TYPE "ProductCategory";
ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
