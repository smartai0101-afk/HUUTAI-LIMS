-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "moduleLabel" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "recordLabel" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_moduleKey_idx" ON "notifications"("moduleKey");
CREATE INDEX "notifications_entityType_entityId_idx" ON "notifications"("entityType", "entityId");
CREATE INDEX "notification_reads_userId_idx" ON "notification_reads"("userId");
CREATE UNIQUE INDEX "notification_reads_notificationId_userId_key" ON "notification_reads"("notificationId", "userId");
