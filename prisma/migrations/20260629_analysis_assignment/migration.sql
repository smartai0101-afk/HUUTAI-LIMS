-- CreateTable
CREATE TABLE "lab_departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "department_managers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "department_managers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "lab_departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleId" TEXT NOT NULL,
    "parameterGroup" TEXT NOT NULL,
    "parametersJson" TEXT NOT NULL DEFAULT '[]',
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "managerTitle" TEXT NOT NULL DEFAULT '',
    "assignedBy" TEXT NOT NULL DEFAULT '',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_assignments_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "lab_departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "analysis_assignments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "department_managers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_departments_name_key" ON "lab_departments"("name");

-- CreateIndex
CREATE INDEX "department_managers_departmentId_idx" ON "department_managers"("departmentId");

-- CreateIndex
CREATE INDEX "analysis_assignments_sampleId_idx" ON "analysis_assignments"("sampleId");

-- CreateIndex
CREATE INDEX "analysis_assignments_departmentId_idx" ON "analysis_assignments"("departmentId");

-- CreateIndex
CREATE INDEX "analysis_assignments_managerId_idx" ON "analysis_assignments"("managerId");

-- CreateIndex
CREATE INDEX "analysis_assignments_status_idx" ON "analysis_assignments"("status");
