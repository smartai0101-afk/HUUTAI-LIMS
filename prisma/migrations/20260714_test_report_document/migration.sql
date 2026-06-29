-- AlterTable TestReport: add documentSnapshotJson
ALTER TABLE "test_reports" ADD COLUMN "documentSnapshotJson" TEXT NOT NULL DEFAULT '{}';
