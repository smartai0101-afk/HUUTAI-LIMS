-- CreateTable
CREATE TABLE "EnvironmentalLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loggedAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "temperature" REAL,
    "humidity" REAL,
    "recordedByStaffId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnvironmentalLog_recordedByStaffId_fkey" FOREIGN KEY ("recordedByStaffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EnvironmentalLog_loggedAt_idx" ON "EnvironmentalLog"("loggedAt");
CREATE INDEX "EnvironmentalLog_recordedByStaffId_idx" ON "EnvironmentalLog"("recordedByStaffId");
