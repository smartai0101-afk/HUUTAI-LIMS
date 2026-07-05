-- Form phiếu YC redesign (buổi 23): sample_requests contact/priority + request lines

ALTER TABLE "sample_requests" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "sample_requests" ADD COLUMN "contactEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "sample_requests" ADD COLUMN "contactPhone" TEXT NOT NULL DEFAULT '';

CREATE TABLE "request_sample_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "tempCode" TEXT NOT NULL DEFAULT '',
    "sampleName" TEXT NOT NULL,
    "matrixId" TEXT,
    "sampleType" TEXT NOT NULL DEFAULT '',
    "quantity" REAL,
    "unit" TEXT NOT NULL DEFAULT '',
    "conditionNote" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sampleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "request_sample_lines_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "sample_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "request_sample_lines_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "sample_matrices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "request_sample_lines_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "request_sample_lines_requestId_lineNo_key" ON "request_sample_lines"("requestId", "lineNo");
CREATE UNIQUE INDEX "request_sample_lines_sampleId_key" ON "request_sample_lines"("sampleId");
CREATE INDEX "request_sample_lines_requestId_idx" ON "request_sample_lines"("requestId");
CREATE INDEX "request_sample_lines_requestId_matrixId_idx" ON "request_sample_lines"("requestId", "matrixId");

CREATE TABLE "request_sample_line_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineId" TEXT NOT NULL,
    "testMethodId" TEXT NOT NULL,
    "methodId" TEXT,
    "methodVersionId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "request_sample_line_tests_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "request_sample_lines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "request_sample_line_tests_testMethodId_fkey" FOREIGN KEY ("testMethodId") REFERENCES "test_methods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "request_sample_line_tests_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "request_sample_line_tests_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "request_sample_line_tests_lineId_testMethodId_key" ON "request_sample_line_tests"("lineId", "testMethodId");
CREATE INDEX "request_sample_line_tests_lineId_idx" ON "request_sample_line_tests"("lineId");
CREATE INDEX "request_sample_line_tests_testMethodId_idx" ON "request_sample_line_tests"("testMethodId");

-- Sample + test extensions (catalog FK + analysis links)
ALTER TABLE "samples" ADD COLUMN "matrixId" TEXT;
ALTER TABLE "samples" ADD COLUMN "deletedAt" DATETIME;
CREATE INDEX "samples_matrixId_idx" ON "samples"("matrixId");

ALTER TABLE "sample_tests" ADD COLUMN "testMethodId" TEXT;
ALTER TABLE "sample_tests" ADD COLUMN "analystId" TEXT;
ALTER TABLE "sample_tests" ADD COLUMN "worksheetId" TEXT;
ALTER TABLE "sample_tests" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "sample_tests" ADD COLUMN "internalDueDate" DATETIME;
CREATE INDEX "sample_tests_testMethodId_idx" ON "sample_tests"("testMethodId");
CREATE INDEX "sample_tests_analystId_idx" ON "sample_tests"("analystId");
CREATE INDEX "sample_tests_worksheetId_idx" ON "sample_tests"("worksheetId");

ALTER TABLE "analysis_worklists" ADD COLUMN "matrixId" TEXT;
ALTER TABLE "analysis_worklists" ADD COLUMN "testCategoryId" TEXT;
CREATE INDEX "analysis_worklists_matrixId_idx" ON "analysis_worklists"("matrixId");

CREATE TABLE "analysis_worklist_sample_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worklistId" TEXT NOT NULL,
    "sampleTestId" TEXT NOT NULL,
    CONSTRAINT "analysis_worklist_sample_tests_worklistId_fkey" FOREIGN KEY ("worklistId") REFERENCES "analysis_worklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklist_sample_tests_sampleTestId_fkey" FOREIGN KEY ("sampleTestId") REFERENCES "sample_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "analysis_worklist_sample_tests_worklistId_sampleTestId_key" ON "analysis_worklist_sample_tests"("worklistId", "sampleTestId");
CREATE INDEX "analysis_worklist_sample_tests_worklistId_idx" ON "analysis_worklist_sample_tests"("worklistId");
CREATE INDEX "analysis_worklist_sample_tests_sampleTestId_idx" ON "analysis_worklist_sample_tests"("sampleTestId");

CREATE TABLE "worksheet_sample_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetId" TEXT NOT NULL,
    "sampleTestId" TEXT NOT NULL,
    "runOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "worksheet_sample_tests_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "analysis_worksheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worksheet_sample_tests_sampleTestId_fkey" FOREIGN KEY ("sampleTestId") REFERENCES "sample_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "worksheet_sample_tests_worksheetId_sampleTestId_key" ON "worksheet_sample_tests"("worksheetId", "sampleTestId");
CREATE INDEX "worksheet_sample_tests_worksheetId_idx" ON "worksheet_sample_tests"("worksheetId");
CREATE INDEX "worksheet_sample_tests_sampleTestId_idx" ON "worksheet_sample_tests"("sampleTestId");

CREATE TABLE "report_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "sampleTestId" TEXT,
    "testMethodId" TEXT,
    "parameterName" TEXT NOT NULL,
    "methodName" TEXT NOT NULL DEFAULT '',
    "resultValue" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',
    "lod" TEXT NOT NULL DEFAULT '',
    "loq" TEXT NOT NULL DEFAULT '',
    "remark" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "report_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "test_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_items_testMethodId_fkey" FOREIGN KEY ("testMethodId") REFERENCES "test_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "report_items_reportId_idx" ON "report_items"("reportId");
CREATE INDEX "report_items_sampleId_idx" ON "report_items"("sampleId");
