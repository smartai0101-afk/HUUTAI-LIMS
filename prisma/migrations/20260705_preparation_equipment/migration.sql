-- AlterTable
ALTER TABLE "PreparedChemical" ADD COLUMN "equipmentId" TEXT REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PreparedStandard" ADD COLUMN "equipmentId" TEXT REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PreparedStrain" ADD COLUMN "equipmentId" TEXT REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "PreparedChemical_equipmentId_idx" ON "PreparedChemical"("equipmentId");
CREATE INDEX "PreparedStandard_equipmentId_idx" ON "PreparedStandard"("equipmentId");
CREATE INDEX "PreparedStrain_equipmentId_idx" ON "PreparedStrain"("equipmentId");
