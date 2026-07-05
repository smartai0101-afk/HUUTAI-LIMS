-- Junction table for analytical method <-> test method (M:N)
CREATE TABLE "analytical_method_test_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "testMethodId" TEXT NOT NULL,
    CONSTRAINT "analytical_method_test_methods_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analytical_method_test_methods_testMethodId_fkey" FOREIGN KEY ("testMethodId") REFERENCES "test_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "analytical_method_test_methods_methodId_testMethodId_key" ON "analytical_method_test_methods"("methodId", "testMethodId");
CREATE INDEX "analytical_method_test_methods_methodId_idx" ON "analytical_method_test_methods"("methodId");
CREATE INDEX "analytical_method_test_methods_testMethodId_idx" ON "analytical_method_test_methods"("testMethodId");

-- Backfill: match analyte tokens (comma/semicolon separated) to test_methods by code or name
INSERT INTO "analytical_method_test_methods" ("id", "methodId", "testMethodId")
SELECT
    am."id" || ':' || tm."id",
    am."id",
    tm."id"
FROM "analytical_methods" am
CROSS JOIN "test_methods" tm
WHERE am."analyte" IS NOT NULL
  AND TRIM(am."analyte") != ''
  AND tm."active" = 1
  AND tm."deletedAt" IS NULL
  AND (
    INSTR(
      ',' || REPLACE(REPLACE(LOWER(TRIM(am."analyte")), ';', ','), ' ', '') || ',',
      ',' || LOWER(tm."code") || ','
    ) > 0
    OR INSTR(
      ',' || REPLACE(REPLACE(LOWER(TRIM(am."analyte")), ';', ','), ' ', '') || ',',
      ',' || LOWER(REPLACE(tm."name", ' ', '')) || ','
    ) > 0
    OR LOWER(TRIM(am."analyte")) = LOWER(tm."code")
    OR LOWER(TRIM(am."analyte")) = LOWER(tm."name")
  )
  AND NOT EXISTS (
    SELECT 1 FROM "analytical_method_test_methods" existing
    WHERE existing."methodId" = am."id" AND existing."testMethodId" = tm."id"
  );
