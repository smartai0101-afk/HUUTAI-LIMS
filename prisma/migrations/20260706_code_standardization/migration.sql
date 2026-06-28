-- Code standardization: CodeSequence, CodeAlias, sequence columns, PreparedStrainLevel

CREATE TABLE "CodeSequence" (
    "prefix" TEXT NOT NULL PRIMARY KEY,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CodeAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oldCode" TEXT NOT NULL,
    "newCode" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "migratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "CodeAlias_oldCode_entityType_key" ON "CodeAlias"("oldCode", "entityType");
CREATE INDEX "CodeAlias_newCode_idx" ON "CodeAlias"("newCode");
CREATE INDEX "CodeAlias_entityId_idx" ON "CodeAlias"("entityId");

-- Master catalog sequence columns
ALTER TABLE "Chemical" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'CHEM';
ALTER TABLE "Chemical" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Standard" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'STD';
ALTER TABLE "Standard" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MicrobialStrain" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'STR';
ALTER TABLE "MicrobialStrain" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

-- Prepared sequence columns
ALTER TABLE "PreparedChemical" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'PCHEM';
ALTER TABLE "PreparedChemical" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PreparedStandard" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'PSTD';
ALTER TABLE "PreparedStandard" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PreparedStrain" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'PSTR';
ALTER TABLE "PreparedStrain" ADD COLUMN "sequenceNumber" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PreparedStrain" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'RootPrepared';

-- Indexes
CREATE INDEX "Chemical_codePrefix_sequenceNumber_idx" ON "Chemical"("codePrefix", "sequenceNumber");
CREATE INDEX "Standard_codePrefix_sequenceNumber_idx" ON "Standard"("codePrefix", "sequenceNumber");
CREATE INDEX "MicrobialStrain_codePrefix_sequenceNumber_idx" ON "MicrobialStrain"("codePrefix", "sequenceNumber");
CREATE INDEX "PreparedChemical_codePrefix_sequenceNumber_idx" ON "PreparedChemical"("codePrefix", "sequenceNumber");
CREATE INDEX "PreparedStandard_codePrefix_sequenceNumber_idx" ON "PreparedStandard"("codePrefix", "sequenceNumber");
CREATE INDEX "PreparedStrain_codePrefix_sequenceNumber_idx" ON "PreparedStrain"("codePrefix", "sequenceNumber");

-- Seed prefix counters (lastValue updated by backfill script)
INSERT INTO "CodeSequence" ("prefix", "lastValue", "updatedAt") VALUES
  ('CHEM', 0, CURRENT_TIMESTAMP),
  ('STD', 0, CURRENT_TIMESTAMP),
  ('STR', 0, CURRENT_TIMESTAMP),
  ('PCHEM', 0, CURRENT_TIMESTAMP),
  ('PSTD', 0, CURRENT_TIMESTAMP),
  ('WSTD', 0, CURRENT_TIMESTAMP),
  ('PSTR', 0, CURRENT_TIMESTAMP),
  ('IST1', 0, CURRENT_TIMESTAMP),
  ('IST2', 0, CURRENT_TIMESTAMP),
  ('IST3', 0, CURRENT_TIMESTAMP);
