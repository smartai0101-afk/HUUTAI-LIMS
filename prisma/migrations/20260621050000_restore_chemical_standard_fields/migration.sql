-- Restore full LIMS fields for Chemical and Standard modules

-- Chemical: split casProductCode, add notes
ALTER TABLE "Chemical" ADD COLUMN "casNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Chemical" ADD COLUMN "productCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Chemical" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
UPDATE "Chemical" SET "casNumber" = "casProductCode" WHERE "casProductCode" IS NOT NULL AND "casProductCode" != '';
-- SQLite table rebuild required to drop casProductCode (handled by Prisma migrate)

-- Standard: replace casProductCode with productCode, add afterOpenExpiry and notes
ALTER TABLE "Standard" ADD COLUMN "productCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Standard" ADD COLUMN "afterOpenExpiry" DATETIME;
ALTER TABLE "Standard" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
UPDATE "Standard" SET "productCode" = "casProductCode" WHERE "casProductCode" IS NOT NULL AND "casProductCode" != '';
