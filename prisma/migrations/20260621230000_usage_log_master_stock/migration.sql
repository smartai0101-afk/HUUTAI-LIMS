-- CreateTable Staff
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX "Staff_code_key" ON "Staff"("code");

-- Redefine UsageLog with source fields (SQLite)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "containerId" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedByStaffId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "referenceCode" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UsageLog_performedByStaffId_fkey" FOREIGN KEY ("performedByStaffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_UsageLog" (
    "id", "date", "type", "sourceType", "sourceId", "containerId",
    "quantity", "unit", "performedBy", "purpose", "notes", "createdAt"
)
SELECT
    ul."id",
    ul."date",
    ul."type",
    CASE
        WHEN c."chemicalId" IS NOT NULL THEN 'Chemical'
        WHEN c."standardId" IS NOT NULL THEN 'Standard'
        ELSE 'Chemical'
    END,
    COALESCE(c."chemicalId", c."standardId", ul."containerId"),
    ul."containerId",
    ul."quantity",
    ul."unit",
    ul."performedBy",
    ul."purpose",
    ul."notes",
    ul."createdAt"
FROM "UsageLog" ul
LEFT JOIN "Container" c ON c."id" = ul."containerId";

DROP TABLE "UsageLog";
ALTER TABLE "new_UsageLog" RENAME TO "UsageLog";

CREATE INDEX "UsageLog_sourceType_sourceId_idx" ON "UsageLog"("sourceType", "sourceId");
CREATE INDEX "UsageLog_containerId_idx" ON "UsageLog"("containerId");
CREATE INDEX "UsageLog_date_idx" ON "UsageLog"("date");
CREATE INDEX "UsageLog_type_idx" ON "UsageLog"("type");
CREATE INDEX "UsageLog_performedBy_idx" ON "UsageLog"("performedBy");

PRAGMA foreign_keys=ON;

-- Seed default staff
INSERT INTO "Staff" ("id", "code", "name", "department", "active") VALUES
    ('staff-001', 'NV001', 'QC Analyst', 'QC', 1),
    ('staff-002', 'NV002', 'A. Minh', 'Phòng thí nghiệm', 1),
    ('staff-003', 'NV003', 'B. Quang', 'Phòng thí nghiệm', 1),
    ('staff-004', 'NV004', 'Q. Hoa', 'QA/QC', 1),
    ('staff-005', 'NV005', 'M. Kieu', 'Phòng thí nghiệm', 1),
    ('staff-006', 'NV006', 'P. Huy', 'Kho', 1),
    ('staff-007', 'NV007', 'V. Lam', 'Phòng thí nghiệm', 1),
    ('staff-008', 'NV008', 'N. Anh', 'Pha chế', 1);
