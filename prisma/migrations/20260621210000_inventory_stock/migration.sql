-- AlterTable
ALTER TABLE "PreparedStandard" ADD COLUMN "quantity" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PreparedStandard" ADD COLUMN "unit" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL DEFAULT '',
    "module" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL DEFAULT '',
    "quantityBefore" REAL NOT NULL,
    "quantityUsed" REAL NOT NULL,
    "quantityAfter" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "actionType" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT ''
);

CREATE INDEX "InventoryTransaction_sourceType_sourceId_idx" ON "InventoryTransaction"("sourceType", "sourceId");
CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");
CREATE INDEX "InventoryTransaction_time_idx" ON "InventoryTransaction"("time");
