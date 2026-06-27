-- Prepared parent/batch codes for multi-batch preparation under one group code.

ALTER TABLE "PreparedChemical" ADD COLUMN "parentCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "batchNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "PreparedStandard" ADD COLUMN "parentCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "batchNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "PreparedStrain" ADD COLUMN "parentCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "batchNumber" INTEGER NOT NULL DEFAULT 1;

-- Backfill: parentCode = code, batchNumber = 1 for legacy rows (script refines batch suffix parsing).
UPDATE "PreparedChemical" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '';
UPDATE "PreparedStandard" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '';
UPDATE "PreparedStrain" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '';

CREATE INDEX "PreparedChemical_parentCode_idx" ON "PreparedChemical"("parentCode");
CREATE INDEX "PreparedStandard_parentCode_idx" ON "PreparedStandard"("parentCode");
CREATE INDEX "PreparedStrain_parentCode_idx" ON "PreparedStrain"("parentCode");

CREATE UNIQUE INDEX "PreparedChemical_parentCode_batchNumber_key" ON "PreparedChemical"("parentCode", "batchNumber");
CREATE UNIQUE INDEX "PreparedStandard_parentCode_batchNumber_key" ON "PreparedStandard"("parentCode", "batchNumber");
CREATE UNIQUE INDEX "PreparedStrain_parentCode_batchNumber_key" ON "PreparedStrain"("parentCode", "batchNumber");
