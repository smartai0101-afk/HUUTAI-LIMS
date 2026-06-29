-- Analysis module

ALTER TABLE "analysis_assignments" ADD COLUMN "rejectionReason" TEXT NOT NULL DEFAULT '';

CREATE TABLE "department_analysts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "department_analysts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "lab_departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "department_analysts_departmentId_code_key" ON "department_analysts"("departmentId", "code");
CREATE INDEX "department_analysts_departmentId_idx" ON "department_analysts"("departmentId");

CREATE TABLE "analysis_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "sampleCode" TEXT NOT NULL,
    "sampleName" TEXT NOT NULL,
    "parameterGroup" TEXT NOT NULL,
    "parametersJson" TEXT NOT NULL DEFAULT '[]',
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "analystId" TEXT,
    "analystName" TEXT NOT NULL DEFAULT '',
    "assignedBy" TEXT NOT NULL DEFAULT '',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internalDueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'waiting_lab_acceptance',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_tasks_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "analysis_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_tasks_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_tasks_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "lab_departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "analysis_tasks_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "department_analysts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "analysis_tasks_assignmentId_key" ON "analysis_tasks"("assignmentId");
CREATE INDEX "analysis_tasks_sampleId_idx" ON "analysis_tasks"("sampleId");
CREATE INDEX "analysis_tasks_departmentId_idx" ON "analysis_tasks"("departmentId");
CREATE INDEX "analysis_tasks_analystId_idx" ON "analysis_tasks"("analystId");
CREATE INDEX "analysis_tasks_status_idx" ON "analysis_tasks"("status");

CREATE TABLE "analysis_worklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worklistCode" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "methodId" TEXT,
    "methodName" TEXT NOT NULL DEFAULT '',
    "methodVersionId" TEXT,
    "methodVersion" INTEGER,
    "equipmentId" TEXT,
    "equipmentName" TEXT NOT NULL DEFAULT '',
    "analystId" TEXT,
    "analystName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_worklists_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "lab_departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklists_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklists_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklists_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklists_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "department_analysts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "analysis_worklists_worklistCode_key" ON "analysis_worklists"("worklistCode");
CREATE INDEX "analysis_worklists_departmentId_idx" ON "analysis_worklists"("departmentId");
CREATE INDEX "analysis_worklists_status_idx" ON "analysis_worklists"("status");

CREATE TABLE "analysis_worklist_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worklistId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    CONSTRAINT "analysis_worklist_tasks_worklistId_fkey" FOREIGN KEY ("worklistId") REFERENCES "analysis_worklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_worklist_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "analysis_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "analysis_worklist_tasks_worklistId_taskId_key" ON "analysis_worklist_tasks"("worklistId", "taskId");
CREATE INDEX "analysis_worklist_tasks_worklistId_idx" ON "analysis_worklist_tasks"("worklistId");
CREATE INDEX "analysis_worklist_tasks_taskId_idx" ON "analysis_worklist_tasks"("taskId");

CREATE TABLE "analysis_worksheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetCode" TEXT NOT NULL,
    "worklistId" TEXT NOT NULL,
    "methodId" TEXT,
    "methodName" TEXT NOT NULL DEFAULT '',
    "methodVersionId" TEXT,
    "methodVersion" INTEGER,
    "equipmentId" TEXT,
    "equipmentName" TEXT NOT NULL DEFAULT '',
    "analystId" TEXT NOT NULL,
    "analystName" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "conditionNote" TEXT NOT NULL DEFAULT '',
    "qcSamplesJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_worksheets_worklistId_fkey" FOREIGN KEY ("worklistId") REFERENCES "analysis_worklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_worksheets_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worksheets_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worksheets_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analysis_worksheets_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "department_analysts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "analysis_worksheets_worksheetCode_key" ON "analysis_worksheets"("worksheetCode");
CREATE INDEX "analysis_worksheets_worklistId_idx" ON "analysis_worksheets"("worklistId");
CREATE INDEX "analysis_worksheets_status_idx" ON "analysis_worksheets"("status");

CREATE TABLE "worksheet_chemicals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetId" TEXT NOT NULL,
    "chemicalId" TEXT NOT NULL,
    CONSTRAINT "worksheet_chemicals_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "analysis_worksheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worksheet_chemicals_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "worksheet_chemicals_worksheetId_chemicalId_key" ON "worksheet_chemicals"("worksheetId", "chemicalId");
CREATE INDEX "worksheet_chemicals_worksheetId_idx" ON "worksheet_chemicals"("worksheetId");

CREATE TABLE "worksheet_standards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    CONSTRAINT "worksheet_standards_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "analysis_worksheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worksheet_standards_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "worksheet_standards_worksheetId_standardId_key" ON "worksheet_standards"("worksheetId", "standardId");
CREATE INDEX "worksheet_standards_worksheetId_idx" ON "worksheet_standards"("worksheetId");

CREATE TABLE "worksheet_crms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    CONSTRAINT "worksheet_crms_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "analysis_worksheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worksheet_crms_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "worksheet_crms_worksheetId_standardId_key" ON "worksheet_crms"("worksheetId", "standardId");
CREATE INDEX "worksheet_crms_worksheetId_idx" ON "worksheet_crms"("worksheetId");

CREATE TABLE "test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "sampleCode" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',
    "lod" TEXT NOT NULL DEFAULT '',
    "loq" TEXT NOT NULL DEFAULT '',
    "limitValue" TEXT NOT NULL DEFAULT '',
    "evaluation" TEXT,
    "analystId" TEXT,
    "analystName" TEXT NOT NULL DEFAULT '',
    "enteredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'not_entered',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_results_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "analysis_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "test_results_taskId_parameterName_key" ON "test_results"("taskId", "parameterName");
CREATE INDEX "test_results_taskId_idx" ON "test_results"("taskId");
CREATE INDEX "test_results_sampleId_idx" ON "test_results"("sampleId");
CREATE INDEX "test_results_status_idx" ON "test_results"("status");

CREATE TABLE "qc_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worksheetId" TEXT,
    "taskId" TEXT,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "checkedBy" TEXT NOT NULL DEFAULT '',
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_checks_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "analysis_worksheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qc_checks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "analysis_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "qc_checks_worksheetId_idx" ON "qc_checks"("worksheetId");
CREATE INDEX "qc_checks_taskId_idx" ON "qc_checks"("taskId");
