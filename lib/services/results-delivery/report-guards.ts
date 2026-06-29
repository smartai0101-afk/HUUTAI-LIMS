import { db } from "@/lib/db";
import { canTransitionSampleStatus } from "@/lib/services/samples/sample-workflow";

export async function assertSampleReadyForRelease(sampleId: string) {
  const sample = await db.sample.findUnique({
    where: { id: sampleId },
    include: {
      analysisTasks: { include: { testResults: true, qcChecks: true } },
      testReports: { where: { status: { not: "cancelled" } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!sample) throw new Error("Không tìm thấy mẫu");
  if (sample.status !== "Completed" && sample.status !== "ResultIssued") {
    throw new Error("Mẫu chưa hoàn thành phân tích (trạng thái Completed)");
  }

  const tasks = sample.analysisTasks.filter((t) => t.status !== "cancelled");
  if (tasks.length === 0) {
    throw new Error("Mẫu chưa có task phân tích");
  }

  const allApproved = tasks.every((t) => t.status === "approved");
  if (!allApproved) {
    throw new Error("Chưa duyệt hết các task phân tích");
  }

  for (const task of tasks) {
    const latestQc = [...task.qcChecks].sort(
      (a, b) => b.checkedAt.getTime() - a.checkedAt.getTime(),
    )[0];
    if (!latestQc || latestQc.status !== "pass") {
      throw new Error(`QC chưa đạt cho nhóm ${task.parameterGroup}`);
    }
    const pendingResults = task.testResults.some((r) => r.status !== "approved");
    if (pendingResults) {
      throw new Error(`Kết quả chưa duyệt đầy đủ cho nhóm ${task.parameterGroup}`);
    }
  }

  return sample;
}

export async function transitionSampleToResultIssued(sampleId: string) {
  const sample = await db.sample.findUnique({ where: { id: sampleId } });
  if (!sample) throw new Error("Không tìm thấy mẫu");
  if (sample.status === "ResultIssued") return sample;
  if (!canTransitionSampleStatus(sample.status, "ResultIssued")) {
    throw new Error(`Không thể chuyển trạng thái mẫu từ ${sample.status} sang ResultIssued`);
  }
  return db.sample.update({
    where: { id: sampleId },
    data: { status: "ResultIssued" },
  });
}
