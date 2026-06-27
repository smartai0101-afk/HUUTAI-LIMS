-- Inventory Transaction Engine: extended transaction types, lifecycle status, prep Rejected

-- AlterTable Chemical
ALTER TABLE "Chemical" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable Standard
ALTER TABLE "Standard" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable MicrobialStrain
ALTER TABLE "MicrobialStrain" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable PreparedChemical
ALTER TABLE "PreparedChemical" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable PreparedStandard
ALTER TABLE "PreparedStandard" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable PreparedStrain
ALTER TABLE "PreparedStrain" ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable PreparedChemicalIngredient
ALTER TABLE "PreparedChemicalIngredient" ADD COLUMN "consumeTransactionId" TEXT;

-- AlterTable PreparedStandardComponent
ALTER TABLE "PreparedStandardComponent" ADD COLUMN "consumeTransactionId" TEXT;

-- AlterTable PreparedStandardSolvent
ALTER TABLE "PreparedStandardSolvent" ADD COLUMN "consumeTransactionId" TEXT;

-- AlterTable UsageLog
ALTER TABLE "UsageLog" ADD COLUMN "stockLotId" TEXT;
ALTER TABLE "UsageLog" ADD COLUMN "inventoryTransactionId" TEXT;

-- AlterTable InventoryTransaction
ALTER TABLE "InventoryTransaction" ADD COLUMN "transactionType" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "reason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryTransaction" ADD COLUMN "relatedPreparationType" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "relatedPreparationId" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "reversesTransactionId" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "approvedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryTransaction" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "InventoryTransaction" ADD COLUMN "performedByStaffId" TEXT;

CREATE INDEX "UsageLog_stockLotId_idx" ON "UsageLog"("stockLotId");
CREATE INDEX "InventoryTransaction_transactionType_idx" ON "InventoryTransaction"("transactionType");
CREATE INDEX "InventoryTransaction_relatedPreparationType_relatedPreparationId_idx" ON "InventoryTransaction"("relatedPreparationType", "relatedPreparationId");
CREATE INDEX "PreparedChemicalIngredient_consumeTransactionId_idx" ON "PreparedChemicalIngredient"("consumeTransactionId");
CREATE INDEX "PreparedStandardComponent_consumeTransactionId_idx" ON "PreparedStandardComponent"("consumeTransactionId");
CREATE INDEX "PreparedStandardSolvent_consumeTransactionId_idx" ON "PreparedStandardSolvent"("consumeTransactionId");

-- Backfill transactionType from legacy actionType + module
UPDATE "InventoryTransaction"
SET "transactionType" = 'CREATE'
WHERE "actionType" = 'Restore' AND "module" = 'StockIn';

UPDATE "InventoryTransaction"
SET "transactionType" = 'CONSUME'
WHERE "actionType" = 'Deduct' AND ("transactionType" IS NULL OR "transactionType" = '');

UPDATE "InventoryTransaction"
SET "transactionType" = 'REVERSAL'
WHERE "actionType" = 'Restore' AND "module" != 'StockIn' AND ("transactionType" IS NULL OR "transactionType" = '');
