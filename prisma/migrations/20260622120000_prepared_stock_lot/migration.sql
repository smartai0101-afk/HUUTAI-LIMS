-- PreparedChemicalIngredient.stockLotId
ALTER TABLE "PreparedChemicalIngredient" ADD COLUMN "stockLotId" TEXT;
CREATE INDEX "PreparedChemicalIngredient_stockLotId_idx" ON "PreparedChemicalIngredient"("stockLotId");

-- PreparedStandardComponent.stockLotId
ALTER TABLE "PreparedStandardComponent" ADD COLUMN "stockLotId" TEXT;
CREATE INDEX "PreparedStandardComponent_stockLotId_idx" ON "PreparedStandardComponent"("stockLotId");

-- PreparedStandardSolvent.stockLotId
ALTER TABLE "PreparedStandardSolvent" ADD COLUMN "stockLotId" TEXT;
CREATE INDEX "PreparedStandardSolvent_stockLotId_idx" ON "PreparedStandardSolvent"("stockLotId");

-- PreparedStrain source lot traceability
ALTER TABLE "PreparedStrain" ADD COLUMN "sourceStockLotId" TEXT;
ALTER TABLE "PreparedStrain" ADD COLUMN "sourceLotNumberSnapshot" TEXT NOT NULL DEFAULT '';
