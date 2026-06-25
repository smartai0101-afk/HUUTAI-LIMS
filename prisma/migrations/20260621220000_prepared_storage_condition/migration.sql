-- AlterTable
ALTER TABLE "PreparedChemical" ADD COLUMN "storageCondition" TEXT NOT NULL DEFAULT '';
-- AlterTable
ALTER TABLE "PreparedStandard" ADD COLUMN "storageCondition" TEXT NOT NULL DEFAULT '';
