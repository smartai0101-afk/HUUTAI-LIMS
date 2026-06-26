-- Preparation ISO 17025 workflow — extend Prepared* + immutable history tables

-- PreparedChemical
ALTER TABLE "PreparedChemical" ADD COLUMN "originalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "finalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "preparedByStaffId" TEXT;
ALTER TABLE "PreparedChemical" ADD COLUMN "checkedByStaffId" TEXT;
ALTER TABLE "PreparedChemical" ADD COLUMN "approvedByStaffId" TEXT;
ALTER TABLE "PreparedChemical" ADD COLUMN "formula" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "equipmentUsed" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "preparationCondition" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "attachmentUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "workflowStatus" TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE "PreparedChemical" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PreparedChemical" ADD COLUMN "amendmentReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedChemical" ADD COLUMN "deletedAt" DATETIME;

-- PreparedStandard
ALTER TABLE "PreparedStandard" ADD COLUMN "originalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "finalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "preparedByStaffId" TEXT;
ALTER TABLE "PreparedStandard" ADD COLUMN "checkedByStaffId" TEXT;
ALTER TABLE "PreparedStandard" ADD COLUMN "approvedByStaffId" TEXT;
ALTER TABLE "PreparedStandard" ADD COLUMN "formula" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "equipmentUsed" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "preparationCondition" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "attachmentUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "workflowStatus" TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE "PreparedStandard" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PreparedStandard" ADD COLUMN "amendmentReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStandard" ADD COLUMN "deletedAt" DATETIME;

-- PreparedStrain
ALTER TABLE "PreparedStrain" ADD COLUMN "originalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "finalConcentration" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "preparedByStaffId" TEXT;
ALTER TABLE "PreparedStrain" ADD COLUMN "checkedByStaffId" TEXT;
ALTER TABLE "PreparedStrain" ADD COLUMN "approvedByStaffId" TEXT;
ALTER TABLE "PreparedStrain" ADD COLUMN "equipmentUsed" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "preparationCondition" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "attachmentUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "workflowStatus" TEXT NOT NULL DEFAULT 'Approved';
ALTER TABLE "PreparedStrain" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PreparedStrain" ADD COLUMN "amendmentReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreparedStrain" ADD COLUMN "deletedAt" DATETIME;

-- Backfill existing rows
UPDATE "PreparedChemical" SET "workflowStatus" = 'Approved', "version" = 1 WHERE "workflowStatus" IS NULL OR "workflowStatus" = '';
UPDATE "PreparedStandard" SET "workflowStatus" = 'Approved', "version" = 1 WHERE "workflowStatus" IS NULL OR "workflowStatus" = '';
UPDATE "PreparedStrain" SET "workflowStatus" = 'Approved', "version" = 1 WHERE "workflowStatus" IS NULL OR "workflowStatus" = '';

-- PreparationHistory (INSERT-only snapshots)
CREATE TABLE "PreparationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparationType" TEXT NOT NULL,
    "preparationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PreparationHistory_preparationType_preparationId_idx" ON "PreparationHistory"("preparationType", "preparationId");
CREATE INDEX "PreparationHistory_performedAt_idx" ON "PreparationHistory"("performedAt");

-- PreparationAuditLog (ISO export trail)
CREATE TABLE "PreparationAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preparationType" TEXT NOT NULL,
    "preparationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" TEXT NOT NULL DEFAULT '{}',
    "afterJson" TEXT NOT NULL DEFAULT '{}',
    "reason" TEXT NOT NULL DEFAULT '',
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PreparationAuditLog_preparationType_preparationId_idx" ON "PreparationAuditLog"("preparationType", "preparationId");
CREATE INDEX "PreparationAuditLog_performedAt_idx" ON "PreparationAuditLog"("performedAt");

-- Indexes on workflow columns
CREATE INDEX "PreparedChemical_workflowStatus_idx" ON "PreparedChemical"("workflowStatus");
CREATE INDEX "PreparedChemical_deletedAt_idx" ON "PreparedChemical"("deletedAt");
CREATE INDEX "PreparedStandard_workflowStatus_idx" ON "PreparedStandard"("workflowStatus");
CREATE INDEX "PreparedStandard_deletedAt_idx" ON "PreparedStandard"("deletedAt");
CREATE INDEX "PreparedStrain_workflowStatus_idx" ON "PreparedStrain"("workflowStatus");
CREATE INDEX "PreparedStrain_deletedAt_idx" ON "PreparedStrain"("deletedAt");
