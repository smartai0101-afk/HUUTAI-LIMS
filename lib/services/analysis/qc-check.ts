import { db } from "@/lib/db";
import { mapQcCheckView, mapTestResultView } from "@/lib/mappers/analysis";
import type { QcCheckInput } from "@/lib/validators/analysis";
import type { QcCheckView } from "@/types/analysis";
import { syncSampleStatusFromTasks } from "./analysis-workflow";

export async function listQcChecks(taskId?: string): Promise<QcCheckView[]> {
  const rows = await db.qcCheck.findMany({
    where: taskId ? { taskId } : undefined,
    orderBy: { checkedAt: "desc" },
    take: 200,
  });
  return rows.map(mapQcCheckView);
}

export async function listTasksForQc() {
  return db.analysisTask.findMany({
    where: { status: { in: ["result_entered", "qc_checked"] } },
    include: { testResults: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveQcCheck(input: QcCheckInput, checkedBy: string) {
  const task = await db.analysisTask.findUnique({
    where: { id: input.taskId },
    include: { testResults: true },
  });
  if (!task) throw new Error("Không tìm thấy task");
  if (!["result_entered", "qc_checked"].includes(task.status)) {
    throw new Error("Task chưa sẵn sàng kiểm tra QC");
  }

  const check = await db.qcCheck.create({
    data: {
      taskId: input.taskId,
      worksheetId: input.worksheetId || null,
      checkType: input.checkType,
      status: input.status,
      note: input.note?.trim() ?? "",
      checkedBy,
    },
  });

  if (input.status === "pass") {
    const allChecks = await db.qcCheck.findMany({ where: { taskId: input.taskId } });
    const hasFail = allChecks.some((c) => c.status === "fail");
    if (!hasFail) {
      await db.analysisTask.update({
        where: { id: input.taskId },
        data: { status: "qc_checked" },
      });
      await db.testResult.updateMany({
        where: { taskId: input.taskId },
        data: { status: "qc_passed" },
      });
    }
  } else if (input.status === "fail") {
    await db.testResult.updateMany({
      where: { taskId: input.taskId },
      data: { status: "qc_failed" },
    });
  }

  await syncSampleStatusFromTasks(task.sampleId);

  return mapQcCheckView(check);
}

export async function canSubmitForReview(taskId: string): Promise<{ ok: boolean; reason?: string }> {
  const task = await db.analysisTask.findUnique({
    where: { id: taskId },
    include: { testResults: true, qcChecks: true },
  });
  if (!task) return { ok: false, reason: "Không tìm thấy task" };
  if (task.testResults.some((r) => !r.resultValue.trim())) {
    return { ok: false, reason: "Chưa nhập đủ kết quả" };
  }
  const hasFail = task.qcChecks.some((c) => c.status === "fail");
  if (hasFail) return { ok: false, reason: "QC không đạt" };
  if (task.status !== "qc_checked" && task.qcChecks.length === 0) {
    return { ok: false, reason: "Chưa kiểm tra QC" };
  }
  return { ok: true };
}
