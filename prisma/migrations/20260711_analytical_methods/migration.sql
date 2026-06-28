PRAGMA foreign_keys=OFF;

CREATE TABLE "analytical_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodCode" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "matrix" TEXT NOT NULL DEFAULT '',
    "analyte" TEXT NOT NULL DEFAULT '',
    "technique" TEXT NOT NULL DEFAULT '',
    "standardRef" TEXT NOT NULL DEFAULT '',
    "currentVersionId" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analytical_methods_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "method_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "method_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "effectiveDate" DATETIME,
    "reviewDate" DATETIME,
    "changeLog" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "reviewerId" TEXT NOT NULL DEFAULT '',
    "approverId" TEXT NOT NULL DEFAULT '',
    "approvedAt" DATETIME,
    "estimatedDurationMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "method_versions_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "analytical_methods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT '',
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "method_documents_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "layoutJson" TEXT NOT NULL DEFAULT '{}',
    "sourceType" TEXT NOT NULL DEFAULT 'Manual',
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "method_workflows_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "workflow_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Step',
    "label" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "positionX" REAL NOT NULL DEFAULT 0,
    "positionY" REAL NOT NULL DEFAULT 0,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "workflow_nodes_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "method_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "workflow_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "sourceNodeKey" TEXT NOT NULL,
    "targetNodeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "conditionJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "workflow_edges_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "method_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_reagents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "workflowNodeKey" TEXT NOT NULL DEFAULT '',
    "chemicalId" TEXT,
    "standardId" TEXT,
    "nameFreeText" TEXT NOT NULL DEFAULT '',
    "casNumber" TEXT NOT NULL DEFAULT '',
    "amountPerSample" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "method_reagents_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "method_reagents_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "method_reagents_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "method_equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "workflowNodeKey" TEXT NOT NULL DEFAULT '',
    "equipmentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "method_equipment_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "method_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_qc_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "qcType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT '',
    "frequencyUnit" TEXT NOT NULL DEFAULT '',
    "limitsJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "method_qc_requirements_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_acceptance_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "analyte" TEXT NOT NULL DEFAULT '',
    "criteriaJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "method_acceptance_criteria_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_safety_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL DEFAULT 'Warning',
    "content" TEXT NOT NULL DEFAULT '',
    "chemicalReferenceId" TEXT,
    CONSTRAINT "method_safety_notes_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "method_safety_notes_chemicalReferenceId_fkey" FOREIGN KEY ("chemicalReferenceId") REFERENCES "chemical_references" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "method_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL DEFAULT '',
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "method_approvals_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_ai_extraction_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "provider" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "promptVersion" TEXT NOT NULL DEFAULT '',
    "rawResponseJson" TEXT NOT NULL DEFAULT '{}',
    "parsedJson" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT NOT NULL DEFAULT '',
    "extractedAt" DATETIME,
    "reviewedBy" TEXT NOT NULL DEFAULT '',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "method_ai_extraction_logs_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodVersionId" TEXT NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'InProgress',
    "startedBy" TEXT NOT NULL DEFAULT '',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "method_executions_methodVersionId_fkey" FOREIGN KEY ("methodVersionId") REFERENCES "method_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "method_execution_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL DEFAULT 0,
    "stepName" TEXT NOT NULL DEFAULT '',
    "instruction" TEXT NOT NULL DEFAULT '',
    "requiredInput" TEXT NOT NULL DEFAULT '',
    "expectedResult" TEXT NOT NULL DEFAULT '',
    "operator" TEXT NOT NULL DEFAULT '',
    "timestamp" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "comment" TEXT NOT NULL DEFAULT '',
    "workflowNodeKey" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "method_execution_steps_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "method_executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "analytical_methods_methodCode_key" ON "analytical_methods"("methodCode");

CREATE UNIQUE INDEX "analytical_methods_currentVersionId_key" ON "analytical_methods"("currentVersionId");

CREATE INDEX "analytical_methods_methodCode_idx" ON "analytical_methods"("methodCode");

CREATE INDEX "method_versions_methodId_idx" ON "method_versions"("methodId");

CREATE INDEX "method_versions_status_idx" ON "method_versions"("status");

CREATE UNIQUE INDEX "method_versions_methodId_version_key" ON "method_versions"("methodId", "version");

CREATE INDEX "method_documents_methodVersionId_idx" ON "method_documents"("methodVersionId");

CREATE UNIQUE INDEX "method_workflows_methodVersionId_key" ON "method_workflows"("methodVersionId");

CREATE INDEX "workflow_nodes_workflowId_idx" ON "workflow_nodes"("workflowId");

CREATE UNIQUE INDEX "workflow_nodes_workflowId_nodeKey_key" ON "workflow_nodes"("workflowId", "nodeKey");

CREATE INDEX "workflow_edges_workflowId_idx" ON "workflow_edges"("workflowId");

CREATE INDEX "method_reagents_methodVersionId_idx" ON "method_reagents"("methodVersionId");

CREATE INDEX "method_equipment_methodVersionId_idx" ON "method_equipment"("methodVersionId");

CREATE INDEX "method_equipment_equipmentId_idx" ON "method_equipment"("equipmentId");

CREATE INDEX "method_qc_requirements_methodVersionId_idx" ON "method_qc_requirements"("methodVersionId");

CREATE INDEX "method_acceptance_criteria_methodVersionId_idx" ON "method_acceptance_criteria"("methodVersionId");

CREATE INDEX "method_safety_notes_methodVersionId_idx" ON "method_safety_notes"("methodVersionId");

CREATE INDEX "method_approvals_methodVersionId_idx" ON "method_approvals"("methodVersionId");

CREATE INDEX "method_ai_extraction_logs_methodVersionId_idx" ON "method_ai_extraction_logs"("methodVersionId");

CREATE INDEX "method_executions_methodVersionId_idx" ON "method_executions"("methodVersionId");

CREATE INDEX "method_execution_steps_executionId_idx" ON "method_execution_steps"("executionId");

PRAGMA foreign_keys=ON;
