-- Equipment module migration (2026-06-23)
-- Apply with: npx prisma db execute --file prisma/migrations/20260623_equipment_module/migration.sql

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "serialNumber" TEXT NOT NULL DEFAULT '',
    "specifications" TEXT NOT NULL DEFAULT '',
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "countryOfOrigin" TEXT NOT NULL DEFAULT '',
    "manufacturingYear" INTEGER,
    "purchaseDate" DATETIME,
    "commissioningDate" DATETIME,
    "lastCalibrationDate" DATETIME,
    "calibrator" TEXT NOT NULL DEFAULT '',
    "calibrationExpiryDate" DATETIME,
    "department" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "manager" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'InUse',
    "installDate" DATETIME,
    "iqOqPqNotes" TEXT NOT NULL DEFAULT '',
    "userManualPath" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
CREATE INDEX "Equipment_department_idx" ON "Equipment"("department");
CREATE INDEX "Equipment_calibrationExpiryDate_idx" ON "Equipment"("calibrationExpiryDate");

CREATE TABLE "CalibrationPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "cycleMonths" INTEGER NOT NULL DEFAULT 12,
    "lastDate" DATETIME,
    "nextDate" DATETIME,
    "vendor" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Green',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalibrationPlan_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CalibrationPlan_equipmentId_idx" ON "CalibrationPlan"("equipmentId");
CREATE INDEX "CalibrationPlan_nextDate_idx" ON "CalibrationPlan"("nextDate");
CREATE INDEX "CalibrationPlan_status_idx" ON "CalibrationPlan"("status");

CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "calibrationDate" DATETIME NOT NULL,
    "certificateNo" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT 'Pass',
    "deviation" TEXT NOT NULL DEFAULT '',
    "certificatePath" TEXT,
    "cost" REAL NOT NULL DEFAULT 0,
    "vendor" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalibrationRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CalibrationRecord_equipmentId_idx" ON "CalibrationRecord"("equipmentId");
CREATE INDEX "CalibrationRecord_calibrationDate_idx" ON "CalibrationRecord"("calibrationDate");
CREATE INDEX "CalibrationRecord_result_idx" ON "CalibrationRecord"("result");

CREATE TABLE "PostCalibrationEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "calibrationRecordId" TEXT NOT NULL,
    "impactAssessment" TEXT NOT NULL DEFAULT '',
    "correctiveAction" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostCalibrationEvaluation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostCalibrationEvaluation_calibrationRecordId_fkey" FOREIGN KEY ("calibrationRecordId") REFERENCES "CalibrationRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PostCalibrationEvaluation_calibrationRecordId_key" ON "PostCalibrationEvaluation"("calibrationRecordId");
CREATE INDEX "PostCalibrationEvaluation_equipmentId_idx" ON "PostCalibrationEvaluation"("equipmentId");
CREATE INDEX "PostCalibrationEvaluation_status_idx" ON "PostCalibrationEvaluation"("status");

CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL DEFAULT '',
    "cycleMonths" INTEGER NOT NULL DEFAULT 6,
    "lastDate" DATETIME,
    "nextDate" DATETIME,
    "vendor" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Green',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenancePlan_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MaintenancePlan_equipmentId_idx" ON "MaintenancePlan"("equipmentId");
CREATE INDEX "MaintenancePlan_nextDate_idx" ON "MaintenancePlan"("nextDate");
CREATE INDEX "MaintenancePlan_status_idx" ON "MaintenancePlan"("status");

CREATE TABLE "RepairProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "description" TEXT NOT NULL DEFAULT '',
    "reportedBy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairProposal_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RepairProposal_ticketNo_key" ON "RepairProposal"("ticketNo");
CREATE INDEX "RepairProposal_equipmentId_idx" ON "RepairProposal"("equipmentId");
CREATE INDEX "RepairProposal_status_idx" ON "RepairProposal"("status");
CREATE INDEX "RepairProposal_priority_idx" ON "RepairProposal"("priority");

CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "repairProposalId" TEXT,
    "issueDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rootCause" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT NOT NULL DEFAULT '',
    "cost" REAL NOT NULL DEFAULT 0,
    "completedDate" DATETIME,
    "attachmentPaths" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceLog_repairProposalId_fkey" FOREIGN KEY ("repairProposalId") REFERENCES "RepairProposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "MaintenanceLog_equipmentId_idx" ON "MaintenanceLog"("equipmentId");
CREATE INDEX "MaintenanceLog_issueDate_idx" ON "MaintenanceLog"("issueDate");
CREATE INDEX "MaintenanceLog_completedDate_idx" ON "MaintenanceLog"("completedDate");

CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stockQty" REAL NOT NULL DEFAULT 0,
    "minQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "supplier" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "SparePart_code_key" ON "SparePart"("code");
CREATE INDEX "SparePart_code_idx" ON "SparePart"("code");

CREATE TABLE "EquipmentSparePartLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentSparePartLink_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentSparePartLink_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EquipmentSparePartLink_equipmentId_sparePartId_key" ON "EquipmentSparePartLink"("equipmentId", "sparePartId");
CREATE INDEX "EquipmentSparePartLink_equipmentId_idx" ON "EquipmentSparePartLink"("equipmentId");
CREATE INDEX "EquipmentSparePartLink_sparePartId_idx" ON "EquipmentSparePartLink"("sparePartId");

CREATE TABLE "SparePartUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "usedDate" DATETIME NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SparePartUsage_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SparePartUsage_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SparePartUsage_equipmentId_idx" ON "SparePartUsage"("equipmentId");
CREATE INDEX "SparePartUsage_sparePartId_idx" ON "SparePartUsage"("sparePartId");
CREATE INDEX "SparePartUsage_usedDate_idx" ON "SparePartUsage"("usedDate");

CREATE TABLE "EquipmentDisposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "disposalDate" DATETIME NOT NULL,
    "residualValue" REAL NOT NULL DEFAULT 0,
    "decision" TEXT NOT NULL DEFAULT '',
    "approver" TEXT NOT NULL DEFAULT '',
    "documentPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipmentDisposal_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EquipmentDisposal_equipmentId_key" ON "EquipmentDisposal"("equipmentId");
CREATE INDEX "EquipmentDisposal_status_idx" ON "EquipmentDisposal"("status");

CREATE TABLE "EquipmentHistoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL DEFAULT 'Manual',
    "sourceId" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipmentHistoryEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EquipmentHistoryEvent_sourceType_sourceId_key" ON "EquipmentHistoryEvent"("sourceType", "sourceId");
CREATE INDEX "EquipmentHistoryEvent_equipmentId_idx" ON "EquipmentHistoryEvent"("equipmentId");
CREATE INDEX "EquipmentHistoryEvent_eventDate_idx" ON "EquipmentHistoryEvent"("eventDate");

CREATE TABLE "EquipmentAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "EquipmentAttachment_entityType_entityId_idx" ON "EquipmentAttachment"("entityType", "entityId");
