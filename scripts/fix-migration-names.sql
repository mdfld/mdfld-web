-- Renames _prisma_migrations rows to match the timestamped migration
-- directory names introduced on feature/admin-rbac-mor.
--
-- Run this ONCE on every existing database (production EC2, any dev DB)
-- BEFORE the next `npx prisma migrate deploy`. Without it, Prisma will
-- treat the renamed migrations as never-applied and try to re-run them.
--
--   psql "$DATABASE_URL" -f scripts/fix-migration-names.sql
--
-- Safe to re-run: each UPDATE matches the old name only.

BEGIN;

UPDATE "_prisma_migrations"
SET migration_name = '20251024082540_add_product_variants'
WHERE migration_name = 'add_product_variants';

UPDATE "_prisma_migrations"
SET migration_name = '20260324144729_add_performance_indexes'
WHERE migration_name = 'add_performance_indexes';

UPDATE "_prisma_migrations"
SET migration_name = '20260324184715_add_import_oauth_and_session'
WHERE migration_name = '1774378035_add_import_oauth_and_session';

UPDATE "_prisma_migrations"
SET migration_name = '20260331141500_add_onboarding_state'
WHERE migration_name = '1774966500_add_onboarding_state';

COMMIT;

-- Verify: all four rows should show the new timestamped names.
SELECT migration_name, finished_at
FROM "_prisma_migrations"
WHERE migration_name IN (
  '20251024082540_add_product_variants',
  '20260324144729_add_performance_indexes',
  '20260324184715_add_import_oauth_and_session',
  '20260331141500_add_onboarding_state'
)
ORDER BY migration_name;
