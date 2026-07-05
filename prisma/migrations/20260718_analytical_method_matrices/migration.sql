-- Junction table for analytical method <-> sample matrix (M:N)
CREATE TABLE "analytical_method_matrices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "matrixId" TEXT NOT NULL,
    CONSTRAINT "analytical_method_matrices_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analytical_method_matrices_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "sample_matrices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "analytical_method_matrices_methodId_matrixId_key" ON "analytical_method_matrices"("methodId", "matrixId");
CREATE INDEX "analytical_method_matrices_methodId_idx" ON "analytical_method_matrices"("methodId");
CREATE INDEX "analytical_method_matrices_matrixId_idx" ON "analytical_method_matrices"("matrixId");

-- Migrate existing single matrixId links
INSERT INTO "analytical_method_matrices" ("id", "methodId", "matrixId")
SELECT "id" || ':' || "matrixId", "id", "matrixId"
FROM "analytical_methods"
WHERE "matrixId" IS NOT NULL AND "matrixId" != '';

-- Drop matrixId column from analytical_methods
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_analytical_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodCode" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "analyte" TEXT NOT NULL DEFAULT '',
    "technique" TEXT NOT NULL DEFAULT '',
    "standardRef" TEXT NOT NULL DEFAULT '',
    "currentVersionId" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analytical_methods_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analytical_methods" ("id", "methodCode", "methodName", "analyte", "technique", "standardRef", "currentVersionId", "createdBy", "createdAt", "updatedAt")
SELECT "id", "methodCode", "methodName", "analyte", "technique", "standardRef", "currentVersionId", "createdBy", "createdAt", "updatedAt"
FROM "analytical_methods";
DROP TABLE "analytical_methods";
ALTER TABLE "new_analytical_methods" RENAME TO "analytical_methods";
CREATE UNIQUE INDEX "analytical_methods_methodCode_key" ON "analytical_methods"("methodCode");
CREATE UNIQUE INDEX "analytical_methods_currentVersionId_key" ON "analytical_methods"("currentVersionId");
CREATE INDEX "analytical_methods_methodCode_idx" ON "analytical_methods"("methodCode");
PRAGMA foreign_keys=ON;
