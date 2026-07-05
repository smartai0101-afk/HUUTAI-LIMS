-- Add per-link unit/lod/loq and primary flag
ALTER TABLE "analytical_method_test_methods" ADD COLUMN "unit" TEXT NOT NULL DEFAULT '';
ALTER TABLE "analytical_method_test_methods" ADD COLUMN "lod" TEXT NOT NULL DEFAULT '';
ALTER TABLE "analytical_method_test_methods" ADD COLUMN "loq" TEXT NOT NULL DEFAULT '';
ALTER TABLE "analytical_method_test_methods" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "analytical_method_test_methods" ADD COLUMN "isPrimary" INTEGER NOT NULL DEFAULT 0;

-- Backfill junction from test_methods.defaultMethodId
INSERT INTO "analytical_method_test_methods" (
  "id", "methodId", "testMethodId", "unit", "lod", "loq", "sortOrder", "isPrimary"
)
SELECT
  tm."id" || ':' || tm."defaultMethodId",
  tm."defaultMethodId",
  tm."id",
  COALESCE(tm."defaultUnit", ''),
  COALESCE(tm."lod", ''),
  COALESCE(tm."loq", ''),
  0,
  1
FROM "test_methods" tm
WHERE tm."defaultMethodId" IS NOT NULL
  AND tm."defaultMethodId" != ''
  AND NOT EXISTS (
    SELECT 1 FROM "analytical_method_test_methods" j
    WHERE j."methodId" = tm."defaultMethodId" AND j."testMethodId" = tm."id"
  );

-- Mark existing defaultMethodId links as primary
UPDATE "analytical_method_test_methods"
SET "isPrimary" = 1,
    "unit" = CASE WHEN "unit" = '' THEN (
      SELECT COALESCE(tm."defaultUnit", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
    ) ELSE "unit" END,
    "lod" = CASE WHEN "lod" = '' THEN (
      SELECT COALESCE(tm."lod", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
    ) ELSE "lod" END,
    "loq" = CASE WHEN "loq" = '' THEN (
      SELECT COALESCE(tm."loq", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
    ) ELSE "loq" END
WHERE "testMethodId" IN (
  SELECT tm."id" FROM "test_methods" tm
  WHERE tm."defaultMethodId" IS NOT NULL AND tm."defaultMethodId" = "analytical_method_test_methods"."methodId"
);

-- Fill empty unit/lod on other links from test method defaults
UPDATE "analytical_method_test_methods"
SET
  "unit" = CASE WHEN "unit" = '' THEN (
    SELECT COALESCE(tm."defaultUnit", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
  ) ELSE "unit" END,
  "lod" = CASE WHEN "lod" = '' THEN (
    SELECT COALESCE(tm."lod", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
  ) ELSE "lod" END,
  "loq" = CASE WHEN "loq" = '' THEN (
    SELECT COALESCE(tm."loq", '') FROM "test_methods" tm WHERE tm."id" = "testMethodId"
  ) ELSE "loq" END
WHERE "unit" = '' OR "lod" = '' OR "loq" = '';
