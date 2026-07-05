-- CreateTable
CREATE TABLE "sample_matrix_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AlterTable
ALTER TABLE "sample_matrices" ADD COLUMN "groupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sample_matrix_groups_code_key" ON "sample_matrix_groups"("code");
CREATE INDEX "sample_matrix_groups_active_sortOrder_idx" ON "sample_matrix_groups"("active", "sortOrder");
CREATE INDEX "sample_matrices_groupId_active_idx" ON "sample_matrices"("groupId", "active");
