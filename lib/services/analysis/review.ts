import { db } from "@/lib/db";
import { mapTestResultView } from "@/lib/mappers/analysis";
import { assertSeparationOfDuties, appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import type { ReviewRowView } from "@/types/analysis";
import { canSubmitForReview } from "./qc-check";
import { syncSampleStatusFromTasks } from "./analysis-workflow";

export async function listReviewQueue(): Promise<ReviewRowView[]> {
  const tasks = await db.analysisTask.findMany({
    where: { status: { in: ["submitted_for_review", "qc_checked"] } },
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

  const existing = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!existing) throw new Error("Không tìm thấy task");

  await db.$transaction(async (tx) => {
    await tx.analysisTask.update({
      where: { id: taskId },
      data: { status: "submitted_for_review" },
    });
    await tx.testResult.updateMany({
      where: { taskId },
      data: { status: "submitted_for_review" },
    });
    await appendWorkflowEvent(tx, {
      sampleId: existing.sampleId,
      entityType: "analysis_task",
      entityId: taskId,
      fromStatus: existing.status,
      toStatus: "submitted_for_review",
      action: "SubmittedForReview",
      performedBy: existing.analystName,
    });
  });

  await syncSampleStatusFromTasks(existing.sampleId);
  return { success: true };
}

export async function approveTask(
  taskId: string,
  changedBy: string,
  reviewerUserId?: string,
  comment?: string,
) {
  const task = await db.analysisTask.findUnique({
    where: { id: taskId },
    include: { testResults: true },
  });
  if (!task) throw new Error("Không tìm thấy task");
  if (task.status !== "submitted_for_review") {
    throw new Error("Task chưa gửi duyệt");
  }

  if (task.analystId && reviewerUserId) {
    assertSeparationOfDuties(task.analystId, reviewerUserId);
  }

  await db.$transaction(async (tx) => {
    await tx.analysisTask.update({
      where: { id: taskId },
      data: { status: "approved" },
    });
    await tx.testResult.updateMany({
      where: { taskId },
      data: { status: "approved" },
    });
    await tx.analysisAssignment.update({
      where: { id: task.assignmentId },
      data: { status: "completed" },
    });
    await tx.technicalReview.create({
      data: {
        sampleId: task.sampleId,
        taskId,
        reviewerUserId: reviewerUserId ?? "",
        reviewerName: changedBy,
        decision: "approved",
        comment: comment?.trim() ?? "",
      },
    });
    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "analysis_task",
      entityId: taskId,
      fromStatus: task.status,
      toStatus: "approved",
      action: "TechApproved",
      performedBy: changedBy,
      performedByUserId: reviewerUserId,
      reason: comment?.trim(),
    });
  });

  await syncSampleStatusFromTasks(task.sampleId);

  const sample = await db.sample.findUnique({ where: { id: task.sampleId } });
  if (sample?.requestId) {
    const { completeSampleRequest } = await import("@/lib/services/samples/sample-requests");
    try {
      await completeSampleRequest(sample.requestId, changedBy);
    } catch {
      /* request may not be ready yet */
    }
  }

  return { success: true };
}

export async function rejectTask(taskId: string, note: string, reviewerUserId?: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");

  await db.$transaction(async (tx) => {
    await tx.analysisTask.update({
      where: { id: taskId },
      data: { status: "rejected", note: note.trim() || task.note },
    });
    await tx.testResult.updateMany({
      where: { taskId },
      data: { status: "rejected" },
    });
    await tx.technicalReview.create({
      data: {
        sampleId: task.sampleId,
        taskId,
        reviewerUserId: reviewerUserId ?? "",
        reviewerName: note.trim() ? "Reviewer" : task.managerName,
        decision: "rejected",
        comment: note.trim(),
      },
    });
    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "analysis_task",
      entityId: taskId,
      fromStatus: task.status,
      toStatus: "rejected",
      action: "TechRejected",
      performedBy: task.managerName,
      reason: note.trim(),
    });
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}

export async function requestRerun(taskId: string, note: string, reviewerUserId?: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");

  await db.$transaction(async (tx) => {
    await tx.analysisTask.update({
      where: { id: taskId },
      data: { status: "in_analysis", note: note.trim() || task.note },
    });
    await tx.testResult.updateMany({
      where: { taskId },
      data: { status: "entered" },
    });
    await tx.technicalReview.create({
      data: {
        sampleId: task.sampleId,
        taskId,
        reviewerUserId: reviewerUserId ?? "",
        reviewerName: task.managerName,
        decision: "rerun",
        comment: note.trim(),
      },
    });
    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "analysis_task",
      entityId: taskId,
      fromStatus: task.status,
      toStatus: "in_analysis",
      action: "TechRerun",
      performedBy: task.managerName,
      reason: note.trim(),
    });
  });

  await syncSampleStatusFromTasks(task.sampleId);
  return { success: true };
}
