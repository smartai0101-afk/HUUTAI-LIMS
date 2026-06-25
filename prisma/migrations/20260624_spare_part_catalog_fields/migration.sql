ALTER TABLE "SparePart" ADD COLUMN "manufacturer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SparePart" ADD COLUMN "productCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SparePart" ADD COLUMN "lotNumber" TEXT NOT NULL DEFAULT '';
UPDATE "SparePart" SET "manufacturer" = "supplier" WHERE "manufacturer" = '' AND "supplier" != '';
