-- AlterEnum SampleStatus: add ResultIssued
-- SQLite: recreate samples status constraint via table copy not needed for TEXT enum

-- CreateTable test_reports
CREATE TABLE "test_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportCode" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "reportVersion" INTEGER NOT NULL DEFAULT 1,
    "issueNumber" INTEGER NOT NULL DEFAULT 1,
    "issueDate" DATETIME,
    "issuedBy" TEXT NOT NULL DEFAULT '',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "qaApprovedBy" TEXT NOT NULL DEFAULT '',
    "analystName" TEXT NOT NULL DEFAULT '',
    "reviewerName" TEXT NOT NULL DEFAULT '',
    "labManagerName" TEXT NOT NULL DEFAULT '',
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerAddress" TEXT NOT NULL DEFAULT '',
    "customerContact" TEXT NOT NULL DEFAULT '',
    "requestCode" TEXT NOT NULL DEFAULT '',
    "receivedAt" DATETIME,
    "analysisCompletedAt" DATETIME,
    "resultsJson" TEXT NOT NULL DEFAULT '[]',
    "signaturesJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pdfUrl" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_reports_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "test_reports_reportCode_key" ON "test_reports"("reportCode");
CREATE INDEX "test_reports_sampleId_idx" ON "test_reports"("sampleId");
CREATE INDEX "test_reports_status_idx" ON "test_reports"("status");
CREATE INDEX "test_reports_issueDate_idx" ON "test_reports"("issueDate");

CREATE TABLE "report_histories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "issueNumber" INTEGER NOT NULL DEFAULT 1,
    "action" TEXT NOT NULL,
    "actionBy" TEXT NOT NULL DEFAULT '',
    "actionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL DEFAULT '',
    "pdfUrl" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "report_histories_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "test_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "report_histories_reportId_idx" ON "report_histories"("reportId");
CREATE INDEX "report_histories_actionAt_idx" ON "report_histories"("actionAt");
