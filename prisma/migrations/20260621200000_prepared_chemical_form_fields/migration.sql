-- AlterTable
ALTER TABLE "PreparedChemical" ADD COLUMN "concentrationUnit" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "preparedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "storageLocation" TEXT NOT NULL DEFAULT '';
