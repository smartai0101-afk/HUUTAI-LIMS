UPDATE "PreparedChemical" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '' OR "parentCode" IS NULL;
UPDATE "PreparedStandard" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '' OR "parentCode" IS NULL;
UPDATE "PreparedStrain" SET "parentCode" = "code", "batchNumber" = 1 WHERE "parentCode" = '' OR "parentCode" IS NULL;

CREATE INDEX IF NOT EXISTS "PreparedChemical_parentCode_idx" ON "PreparedChemical"("parentCode");
CREATE INDEX IF NOT EXISTS "PreparedStandard_parentCode_idx" ON "PreparedStandard"("parentCode");
CREATE INDEX IF NOT EXISTS "PreparedStrain_parentCode_idx" ON "PreparedStrain"("parentCode");

CREATE UNIQUE INDEX IF NOT EXISTS "PreparedChemical_parentCode_batchNumber_key" ON "PreparedChemical"("parentCode", "batchNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PreparedStandard_parentCode_batchNumber_key" ON "PreparedStandard"("parentCode", "batchNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PreparedStrain_parentCode_batchNumber_key" ON "PreparedStrain"("parentCode", "batchNumber");
