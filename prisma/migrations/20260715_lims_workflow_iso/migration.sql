-- LIMS workflow ISO 17025 extensions

-- AlterTable sample_requests
ALTER TABLE "sample_requests" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "sample_requests" ADD COLUMN "submittedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "sample_requests" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "sample_requests" ADD COLUMN "reviewedBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "sample_requests" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "sample_requests" ADD COLUMN "cancelReason" TEXT NOT NULL DEFAULT '';

-- AlterTable samples
ALTER TABLE "samples" ADD COLUMN "barcodePayload" TEXT NOT NULL DEFAULT '';

-- AlterTable analysis_worklists
ALTER TABLE "analysis_worklists" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "analysis_worklists" ADD COLUMN "completedBy" TEXT NOT NULL DEFAULT '';

-- AlterTable test_results
ALTER TABLE "test_results" ADD COLUMN "enteredByUserId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "test_results" ADD COLUMN "rawDataAttachmentId" TEXT NOT NULL DEFAULT '';

-- AlterTable qc_checks
ALTER TABLE "qc_checks" ADD COLUMN "deviationId" TEXT;
CREATE INDEX "qc_checks_deviationId_idx" ON "qc_checks"("deviationId");

-- AlterTable report_histories
ALTER TABLE "report_histories" ADD COLUMN "documentSnapshotJson" TEXT NOT NULL DEFAULT '{}';

-- CreateTable workflow_events
CREATE TABLE "workflow_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL DEFAULT '',
    "toStatus" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL DEFAULT '',
    "performedByUserId" TEXT NOT NULL DEFAULT '',
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL DEFAULT '',
    "beforeJson" TEXT NOT NULL DEFAULT '{}',
    "afterJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "workflow_events_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "workflow_events_sampleId_performedAt_idx" ON "workflow_events"("sampleId", "performedAt");
CREATE INDEX "workflow_events_entityType_entityId_idx" ON "workflow_events"("entityType", "entityId");
CREATE INDEX "workflow_events_performedAt_idx" ON "workflow_events"("performedAt");

-- CreateTable deviations
CREATE TABLE "deviations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "taskId" TEXT,
    "qcCheckId" TEXT,
    "type" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedBy" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "rootCause" TEXT NOT NULL DEFAULT '',
    "closedAt" DATETIME,
    "closedBy" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "deviations_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "deviations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "analysis_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "deviations_sampleId_idx" ON "deviations"("sampleId");
CREATE INDEX "deviations_taskId_idx" ON "deviations"("taskId");
CREATE INDEX "deviations_status_idx" ON "deviations"("status");

-- CreateTable capa_actions
CREATE TABLE "capa_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "dueDate" DATETIME,
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    "verifiedBy" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "capa_actions_deviationId_fkey" FOREIGN KEY ("deviationId") REFERENCES "deviations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "capa_actions_deviationId_idx" ON "capa_actions"("deviationId");
CREATE INDEX "capa_actions_status_idx" ON "capa_actions"("status");

-- CreateTable technical_reviews
CREATE TABLE "technical_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL DEFAULT '',
    "reviewerName" TEXT NOT NULL DEFAULT '',
    "decision" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "technical_reviews_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "technical_reviews_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "analysis_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "technical_reviews_sampleId_idx" ON "technical_reviews"("sampleId");
CREATE INDEX "technical_reviews_taskId_idx" ON "technical_reviews"("taskId");

-- CreateTable report_delivery_logs
CREATE TABLE "report_delivery_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL DEFAULT '',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentBy" TEXT NOT NULL DEFAULT '',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "report_delivery_logs_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "test_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "report_delivery_logs_reportId_idx" ON "report_delivery_logs"("reportId");
CREATE INDEX "report_delivery_logs_sentAt_idx" ON "report_delivery_logs"("sentAt");

-- CreateTable lims_attachments
CREATE TABLE "lims_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "storageUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "lims_attachments_entityType_entityId_idx" ON "lims_attachments"("entityType", "entityId");

-- Add FK for qc_checks.deviationId
CREATE UNIQUE INDEX "qc_checks_deviationId_key" ON "qc_checks"("deviationId") WHERE "deviationId" IS NOT NULL;
