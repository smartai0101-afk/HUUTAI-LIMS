-- Step 1: add matrixId column (keep legacy matrix text for backfill)
ALTER TABLE "analytical_methods" ADD COLUMN "matrixId" TEXT;

-- Step 2: backfill matrixId from legacy text + known seed patterns
UPDATE "analytical_methods"
SET "matrixId" = (SELECT "id" FROM "sample_matrices" WHERE "code" = 'WATER' LIMIT 1)
WHERE "matrixId" IS NULL
  AND (
    "matrix" LIKE '%Water%'
    OR "matrix" LIKE '%Nước%'
    OR "matrix" LIKE '%nước%'
    OR "methodCode" LIKE '%ICP%'
    OR "methodCode" LIKE '%WAT%'
  );

UPDATE "analytical_methods"
SET "matrixId" = (SELECT "id" FROM "sample_matrices" WHERE "code" = 'FOOD-VEG' LIMIT 1)
WHERE "matrixId" IS NULL
  AND (
    "matrix" LIKE '%Vegetable%'
    OR "matrix" LIKE '%Rau%'
    OR "matrix" LIKE '%rau%'
    OR "methodCode" LIKE '%LCMS%'
    OR "methodCode" LIKE '%PEST%'
  );

UPDATE "analytical_methods"
SET "matrixId" = (SELECT sm."id" FROM "sample_matrices" sm WHERE sm."name" = "analytical_methods"."matrix" LIMIT 1)
WHERE "matrixId" IS NULL AND "matrix" != '';

UPDATE "analytical_methods"
SET "matrixId" = (SELECT sm."id" FROM "sample_matrices" sm WHERE sm."code" = "analytical_methods"."matrix" LIMIT 1)
WHERE "matrixId" IS NULL AND "matrix" != '';

-- Step 3: rebuild table without legacy matrix column
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_analytical_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodCode" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "matrixId" TEXT,
    "analyte" TEXT NOT NULL DEFAULT '',
    "technique" TEXT NOT NULL DEFAULT '',
    "standardRef" TEXT NOT NULL DEFAULT '',
    "currentVersionId" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analytical_methods_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analytical_methods_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "sample_matrices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analytical_methods" ("id", "methodCode", "methodName", "matrixId", "analyte", "technique", "standardRef", "currentVersionId", "createdBy", "createdAt", "updatedAt")
SELECT "id", "methodCode", "methodName", "matrixId", "analyte", "technique", "standardRef", "currentVersionId", "createdBy", "createdAt", "updatedAt"
FROM "analytical_methods";
DROP TABLE "analytical_methods";
ALTER TABLE "new_analytical_methods" RENAME TO "analytical_methods";
CREATE UNIQUE INDEX "analytical_methods_methodCode_key" ON "analytical_methods"("methodCode");
CREATE UNIQUE INDEX "analytical_methods_currentVersionId_key" ON "analytical_methods"("currentVersionId");
CREATE INDEX "analytical_methods_methodCode_idx" ON "analytical_methods"("methodCode");
CREATE INDEX "analytical_methods_matrixId_idx" ON "analytical_methods"("matrixId");
PRAGMA foreign_keys=ON;
