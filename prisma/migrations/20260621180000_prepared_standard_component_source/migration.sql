-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreparedStandardComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparedStandardId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'Standard',
    "standardId" TEXT,
    "sourcePreparedStandardId" TEXT,
    "standardCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "standardNameSnapshot" TEXT NOT NULL,
    "manufacturerSnapshot" TEXT NOT NULL DEFAULT '',
    "productCodeSnapshot" TEXT NOT NULL DEFAULT '',
    "lotNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "puritySnapshot" TEXT NOT NULL DEFAULT '',
    "concentrationSnapshot" TEXT NOT NULL DEFAULT '',
    "concentrationUnitSnapshot" TEXT NOT NULL DEFAULT '',
    "levelSnapshot" TEXT,
    "preparedDateSnapshot" DATETIME,
    "expiryDateSnapshot" DATETIME,
    "quantityUsed" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "PreparedStandardComponent_preparedStandardId_fkey" FOREIGN KEY ("preparedStandardId") REFERENCES "PreparedStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreparedStandardComponent_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PreparedStandardComponent_sourcePreparedStandardId_fkey" FOREIGN KEY ("sourcePreparedStandardId") REFERENCES "PreparedStandard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PreparedStandardComponent" (
    "id", "preparedStandardId", "sourceType", "standardId", "sourcePreparedStandardId",
    "standardCodeSnapshot", "standardNameSnapshot", "manufacturerSnapshot", "productCodeSnapshot",
    "lotNumberSnapshot", "puritySnapshot", "concentrationSnapshot", "concentrationUnitSnapshot",
    "levelSnapshot", "preparedDateSnapshot", "expiryDateSnapshot", "quantityUsed", "unit"
)
SELECT
    "id", "preparedStandardId", 'Standard', "standardId", NULL,
    "standardCodeSnapshot", "standardNameSnapshot", "manufacturerSnapshot", "productCodeSnapshot",
    "lotNumberSnapshot", "puritySnapshot", '', '', NULL, NULL, NULL, "quantityUsed", "unit"
FROM "PreparedStandardComponent";
DROP TABLE "PreparedStandardComponent";
ALTER TABLE "new_PreparedStandardComponent" RENAME TO "PreparedStandardComponent";
CREATE INDEX "PreparedStandardComponent_preparedStandardId_idx" ON "PreparedStandardComponent"("preparedStandardId");
CREATE INDEX "PreparedStandardComponent_standardId_idx" ON "PreparedStandardComponent"("standardId");
CREATE INDEX "PreparedStandardComponent_sourcePreparedStandardId_idx" ON "PreparedStandardComponent"("sourcePreparedStandardId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
