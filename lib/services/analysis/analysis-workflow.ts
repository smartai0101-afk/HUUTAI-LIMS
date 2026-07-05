import type { AnalysisTaskStatus, SampleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { canTransitionSampleStatus } from "@/lib/services/samples/sample-workflow";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";

const ACTIVE_ANALYSIS: AnalysisTaskStatus[] = [
  "in_analysis",
  "result_entered",
  "qc_checked",
];

const REVIEW_STATUSES: AnalysisTaskStatus[] = ["submitted_for_review"];

export async function syncSampleStatusFromTasks(sampleId: string) {
  const [sample, tasks] = await Promise.all([
    db.sample.findUnique({ where: { id: sampleId } }),
    db.analysisTask.findMany({ where: { sampleId } }),
  ]);
  if (!sample || tasks.length === 0) return sample;

  const allApproved = tasks.every((t) => t.status === "approved" || t.status === "cancelled");
  const anyApproved = tasks.some((t) => t.status === "approved");
  const anyReview = tasks.some((t) => REVIEW_STATUSES.includes(t.status));
  const anyActive = tasks.some((t) => ACTIVE_ANALYSIS.includes(t.status));
  const anyInProgress = tasks.some(
    (t) =>
      !["approved", "cancelled", "rejected", "waiting_lab_acceptance"].includes(t.status),
  );

  let nextStatus: SampleStatus = sample.status;

  if (allApproved && anyApproved) {
    nextStatus = "Completed";
  } else if (anyReview) {
    nextStatus = "WaitingReview";
  } else if (anyActive || anyInProgress) {
    nextStatus = "InAnalysis";
  }

  if (nextStatus === sample.status) return sample;

  const allowed =
    canTransitionSampleStatus(sample.status, nextStatus) ||
    (sample.status === "Assigned" && nextStatus === "InAnalysis") ||
    (sample.status === "InAnalysis" && nextStatus === "WaitingReview") ||
    (sample.status === "WaitingReview" && nextStatus === "Completed") ||
    (sample.status === "InAnalysis" && nextStatus === "Completed") ||
    (sample.status === "Completed" && nextStatus === "ResultIssued");

  if (!allowed) return sample;

  return db.$transaction(async (tx) => {
    const updated = await tx.sample.update({
      where: { id: sampleId },
      data: { status: nextStatus },
    });
    await appendWorkflowEvent(tx, {
      sampleId,
      entityType: "sample",
      entityId: sampleId,
      fromStatus: sample.status,
      toStatus: nextStatus,
      action: "AutoSyncFromTasks",
      performedBy: "system",
      reason: "Đồng bộ từ trạng thái phân tích",
    });
    return updated;
  });
}

export async function ensureTestResultsForTask(taskId: string) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const parameters = JSON.parse(task.parametersJson || "[]") as string[];
  for (const param of parameters) {
    const name = param.trim();
    if (!name) continue;
    await db.testResult.upsert({
      where: { taskId_parameterName: { taskId, parameterName: name } },
      create: {
        taskId,
        sampleId: task.sampleId,
        sampleCode: task.sampleCode,
        parameterName: name,
        analystId: task.analystId,
        analystName: task.analystName,
      },
      update: {},
    });
  }
}
