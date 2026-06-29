import { db } from "@/lib/db";
import { mapTestResultView } from "@/lib/mappers/analysis";
import type { ReviewRowView } from "@/types/analysis";
import { canSubmitForReview } from "./qc-check";
import { syncSampleStatusFromTasks } from "./analysis-workflow";

export async function listReviewQueue(): Promise<ReviewRowView[]> {
  const tasks = await db.analysisTask.findMany({
    where: { status: { in: ["submitted_for_review", "qc_checked", "result_entered"] } },
    include: { testResults: true, qcChecks: true },
    orderBy: { updatedAt: "desc" },
  });

  return tasks.map((task) => {
    const latestQc = task.qcChecks.sort(
      (a, b) => b.checkedAt.getTime() - a.checkedAt.getTime(),
    )[0];
    return {
      taskId: task.id,
      sampleId: task.sampleId,
      sampleCode: task.sampleCode,
      sampleName: task.sampleName,
      parameterGroup: task.parameterGroup,
      parameters: JSON.parse(task.parametersJson || "[]") as string[],
      departmentName: task.departmentName,
      analystName: task.analystName,
      taskStatus: task.status,
      qcStatus: latestQc?.status ?? null,
      dueDate: task.internalDueDate?.toISOString() ?? null,
      results: task.testResults.map((r) => mapTestResultView({ ...r, task })),
    };
  });
}

export async function submitForReview(taskId: string, override = false) {
  if (!override) {
    const check = await canSubmitForReview(taskId);
    if (!check.ok) throw new Error(check.reason ?? "Không thể gửi duyệt");
  }

  const task = await db.analysisTask.update({
    where: { id: taskId },
    data: { status: "submitted_for_review" },
  });

  await db.testResult.updateMany({
    where: { taskId },
    data: { status: "submitted_for_review" },
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}

export async function approveTask(taskId: string, changedBy: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");
  if (task.status !== "submitted_for_review") {
    throw new Error("Task chưa gửi duyệt");
  }

  await db.analysisTask.update({
    where: { id: taskId },
    data: { status: "approved" },
  });

  await db.testResult.updateMany({
    where: { taskId },
    data: { status: "approved" },
  });

  await db.analysisAssignment.update({
    where: { id: task.assignmentId },
    data: { status: "completed" },
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}

export async function rejectTask(taskId: string, note: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");

  await db.analysisTask.update({
    where: { id: taskId },
    data: { status: "rejected", note: note.trim() || task.note },
  });

  await db.testResult.updateMany({
    where: { taskId },
    data: { status: "rejected" },
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}

export async function requestRerun(taskId: string, note: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");

  await db.analysisTask.update({
    where: { id: taskId },
    data: { status: "in_analysis", note: note.trim() || task.note },
  });

  await db.testResult.updateMany({
    where: { taskId },
    data: { status: "entered" },
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}
