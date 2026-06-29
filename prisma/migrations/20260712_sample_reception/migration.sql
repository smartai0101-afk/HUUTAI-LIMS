-- Sample Reception module (ISO/IEC 17025)

-- CreateTable
CREATE TABLE "sample_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestCode" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL,
    "requesterName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "purpose" TEXT NOT NULL DEFAULT '',
    "sampleType" TEXT NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "note" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "sample_requests_requestCode_key" ON "sample_requests"("requestCode");
CREATE INDEX "sample_requests_requestDate_idx" ON "sample_requests"("requestDate");
CREATE INDEX "sample_requests_status_idx" ON "sample_requests"("status");

CREATE TABLE "sample_request_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    CONSTRAINT "sample_request_tests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sample_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sample_request_tests_requestId_idx" ON "sample_request_tests"("requestId");

CREATE TABLE "sample_request_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "methodVersionId" TEXT,
    CONSTRAINT "sample_request_methods_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sample_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sample_request_methods_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sample_request_methods_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "sample_request_methods_requestId_idx" ON "sample_request_methods"("requestId");
CREATE INDEX "sample_request_methods_methodId_idx" ON "sample_request_methods"("methodId");

CREATE TABLE "samples" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleCode" TEXT NOT NULL,
    "customerSampleCode" TEXT NOT NULL DEFAULT '',
    "requestId" TEXT,
    "sampleName" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "deliveredBy" TEXT NOT NULL DEFAULT '',
    "receivedBy" TEXT NOT NULL,
    "conditionOnReceipt" TEXT NOT NULL,
    "conditionNote" TEXT NOT NULL DEFAULT '',
    "quantity" REAL,
    "unit" TEXT NOT NULL DEFAULT '',
    "containerType" TEXT NOT NULL DEFAULT '',
    "preservationCondition" TEXT NOT NULL DEFAULT '',
    "storageLocation" TEXT NOT NULL DEFAULT '',
    "retentionUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Received',
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "dueDate" DATETIME,
    "note" TEXT NOT NULL DEFAULT '',
    "chemicalReferenceId" TEXT,
    "primaryMethodId" TEXT,
    "primaryMethodVersionId" TEXT,
    "needsMethodAssignment" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "samples_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sample_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "samples_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "samples_primaryMethodId_fkey" FOREIGN KEY ("primaryMethodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "samples_primaryMethodVersionId_fkey" FOREIGN KEY ("primaryMethodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "samples_sampleCode_key" ON "samples"("sampleCode");
CREATE INDEX "samples_receivedAt_idx" ON "samples"("receivedAt");
CREATE INDEX "samples_status_idx" ON "samples"("status");
CREATE INDEX "samples_dueDate_idx" ON "samples"("dueDate");
CREATE INDEX "samples_sampleType_idx" ON "samples"("sampleType");
CREATE INDEX "samples_assignedTo_idx" ON "samples"("assignedTo");

CREATE TABLE "sample_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "methodId" TEXT,
    "methodVersionId" TEXT,
    "parameterName" TEXT NOT NULL,
    "equipmentId" TEXT,
    "assignedTo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dueDate" DATETIME,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sample_tests_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sample_tests_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sample_tests_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sample_tests_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "sample_tests_sampleId_idx" ON "sample_tests"("sampleId");
CREATE INDEX "sample_tests_methodId_idx" ON "sample_tests"("methodId");
CREATE INDEX "sample_tests_status_idx" ON "sample_tests"("status");

CREATE TABLE "sample_test_chemicals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "chemicalId" TEXT NOT NULL,
    CONSTRAINT "sample_test_chemicals_testId_fkey" FOREIGN KEY ("testId") REFERENCES "sample_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sample_test_chemicals_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sample_test_chemicals_testId_chemicalId_key" ON "sample_test_chemicals"("testId", "chemicalId");
CREATE INDEX "sample_test_chemicals_testId_idx" ON "sample_test_chemicals"("testId");

CREATE TABLE "sample_test_standards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    CONSTRAINT "sample_test_standards_testId_fkey" FOREIGN KEY ("testId") REFERENCES "sample_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sample_test_standards_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sample_test_standards_testId_standardId_key" ON "sample_test_standards"("testId", "standardId");
CREATE INDEX "sample_test_standards_testId_idx" ON "sample_test_standards"("testId");

CREATE TABLE "sample_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" TEXT NOT NULL DEFAULT '{}',
    "afterJson" TEXT NOT NULL DEFAULT '{}',
    "changedBy" TEXT NOT NULL DEFAULT '',
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "sample_audit_logs_entityType_entityId_idx" ON "sample_audit_logs"("entityType", "entityId");
CREATE INDEX "sample_audit_logs_changedAt_idx" ON "sample_audit_logs"("changedAt");

CREATE TABLE "sample_storage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "storageLocation" TEXT NOT NULL DEFAULT '',
    "preservationCondition" TEXT NOT NULL DEFAULT '',
    "storedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" DATETIME,
    "storedBy" TEXT NOT NULL DEFAULT '',
    "disposedBy" TEXT NOT NULL DEFAULT '',
    "disposedAt" DATETIME,
    "disposeReason" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "sample_storage_records_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sample_storage_records_sampleId_idx" ON "sample_storage_records"("sampleId");

CREATE TABLE "sample_custody_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromPerson" TEXT NOT NULL DEFAULT '',
    "toPerson" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "performedBy" TEXT NOT NULL DEFAULT '',
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sample_custody_events_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "sample_custody_events_sampleId_idx" ON "sample_custody_events"("sampleId");
CREATE INDEX "sample_custody_events_performedAt_idx" ON "sample_custody_events"("performedAt");
