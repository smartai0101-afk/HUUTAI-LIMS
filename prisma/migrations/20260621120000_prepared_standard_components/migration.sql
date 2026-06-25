-- Refactor PreparedStandard: multi-level tabs, components & solvents child tables

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PreparedStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "concentration" TEXT NOT NULL DEFAULT '',
    "concentrationUnit" TEXT NOT NULL DEFAULT '',
    "solventVolume" REAL NOT NULL DEFAULT 0,
    "solventUnit" TEXT NOT NULL DEFAULT '',
    "preparedDate" DATETIME NOT NULL,
    "preparedBy" TEXT NOT NULL DEFAULT '',
    "expiryDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "storageLocation" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_PreparedStandard" (
    "id", "code", "name", "level", "concentration", "preparedDate", "preparedBy",
    "expiryDate", "status", "notes", "createdAt", "updatedAt"
)
SELECT
    "id", "code", "name",
    CASE "level"
        WHEN 'Intermediate' THEN 'Intermediate1'
        ELSE "level"
    END,
    "concentration", "preparedDate", "preparedBy",
    "expiryDate", "status", "notes", "createdAt", "updatedAt"
FROM "PreparedStandard";

DROP TABLE "PreparedStandard";
ALTER TABLE "new_PreparedStandard" RENAME TO "PreparedStandard";

CREATE UNIQUE INDEX "PreparedStandard_code_key" ON "PreparedStandard"("code");
CREATE INDEX "PreparedStandard_level_idx" ON "PreparedStandard"("level");
CREATE INDEX "PreparedStandard_status_idx" ON "PreparedStandard"("status");
CREATE INDEX "PreparedStandard_expiryDate_idx" ON "PreparedStandard"("expiryDate");

CREATE TABLE "PreparedStandardComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparedStandardId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "standardCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "standardNameSnapshot" TEXT NOT NULL,
    "manufacturerSnapshot" TEXT NOT NULL DEFAULT '',
    "productCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "lotNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "puritySnapshot" TEXT NOT NULL DEFAULT '',
    "quantityUsed" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "PreparedStandardComponent_preparedStandardId_fkey" FOREIGN KEY ("preparedStandardId") REFERENCES "PreparedStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreparedStandardComponent_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PreparedStandardComponent_preparedStandardId_idx" ON "PreparedStandardComponent"("preparedStandardId");
CREATE INDEX "PreparedStandardComponent_standardId_idx" ON "PreparedStandardComponent"("standardId");

CREATE TABLE "PreparedStandardSolvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparedStandardId" TEXT NOT NULL,
    "chemicalId" TEXT NOT NULL,
    "chemicalCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "chemicalNameSnapshot" TEXT NOT NULL,
    "casProductCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "lotNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "quantityUsed" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "PreparedStandardSolvent_preparedStandardId_fkey" FOREIGN KEY ("preparedStandardId") REFERENCES "PreparedStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreparedStandardSolvent_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PreparedStandardSolvent_preparedStandardId_idx" ON "PreparedStandardSolvent"("preparedStandardId");
CREATE INDEX "PreparedStandardSolvent_chemicalId_idx" ON "PreparedStandardSolvent"("chemicalId");

PRAGMA foreign_keys=ON;
