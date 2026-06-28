-- Chemical reference sync fields + sync log

ALTER TABLE "chemical_references" ADD COLUMN "normalizedName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "chemical_references" ADD COLUMN "isomericSmiles" TEXT NOT NULL DEFAULT '';
ALTER TABLE "chemical_references" ADD COLUMN "iupacName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "chemical_references" ADD COLUMN "syncStatus" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "chemical_references" ADD COLUMN "lastSyncedAt" DATETIME;
ALTER TABLE "chemical_references" ADD COLUMN "physicalProperties" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "chemical_references" ADD COLUMN "extendedData" TEXT NOT NULL DEFAULT '{}';

UPDATE "chemical_references" SET "normalizedName" = lower(trim("name")) WHERE "normalizedName" = '';
UPDATE "chemical_references" SET "syncStatus" = 'local' WHERE "source" = 'seed';
UPDATE "chemical_references" SET "syncStatus" = 'synced' WHERE "source" = 'pubchem';

CREATE INDEX "chemical_references_normalizedName_idx" ON "chemical_references"("normalizedName");
CREATE INDEX "chemical_references_inchiKey_idx" ON "chemical_references"("inchiKey");
CREATE INDEX "chemical_references_syncStatus_idx" ON "chemical_references"("syncStatus");

CREATE UNIQUE INDEX "chemical_references_pubchemCid_key" ON "chemical_references"("pubchemCid");

CREATE TABLE "chemical_reference_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chemicalReferenceId" TEXT,
    "action" TEXT NOT NULL,
    "query" TEXT NOT NULL DEFAULT '',
    "pubchemCid" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'PubChem',
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "performedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chemical_reference_sync_logs_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "chemical_reference_sync_logs_chemicalReferenceId_idx" ON "chemical_reference_sync_logs"("chemicalReferenceId");
CREATE INDEX "chemical_reference_sync_logs_createdAt_idx" ON "chemical_reference_sync_logs"("createdAt");
