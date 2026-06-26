-- AlterTable
ALTER TABLE "users" ADD COLUMN "staffId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_staffId_key" ON "users"("staffId");
