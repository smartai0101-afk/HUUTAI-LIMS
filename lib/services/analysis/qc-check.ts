import { db } from "@/lib/db";
import { mapQcCheckView, mapTestResultView } from "@/lib/mappers/analysis";
import { openDeviationFromQcFail, hasOpenDeviationForTask } from "@/lib/services/analysis/deviation";
import { notifyQcFailed } from "@/lib/services/lims-notification-hooks";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
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
    include: { testResults: true, qcChecks: true },
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

  const check = await db.$transaction(async (tx) => {
    const created = await tx.qcCheck.create({
      data: {
        taskId: input.taskId,
        worksheetId: input.worksheetId || null,
        checkType: input.checkType,
        qcSampleType: input.checkType,
        status: input.status,
        expectedValue: input.expectedValue?.trim() ?? "",
        measuredValue: input.measuredValue?.trim() ?? "",
        recoveryPercent: input.recoveryPercent?.trim() ?? "",
        overrideReason: input.overrideReason?.trim() ?? "",
        note: input.note?.trim() ?? "",
        checkedBy,
      },
    });

    if (input.status === "pass") {
      const allChecks = await tx.qcCheck.findMany({ where: { taskId: input.taskId } });
      const hasFail = allChecks.some((c) => c.status === "fail");
      if (!hasFail) {
        await tx.analysisTask.update({
          where: { id: input.taskId },
          data: { status: "qc_checked" },
        });
        await tx.testResult.updateMany({
          where: { taskId: input.taskId },
          data: { status: "qc_passed" },
        });
      }
    } else if (input.status === "fail") {
      await tx.testResult.updateMany({
        where: { taskId: input.taskId },
        data: { status: "qc_failed" },
      });
    }

    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "qc_check",
      entityId: created.id,
      fromStatus: task.status,
      toStatus: input.status === "pass" ? "qc_checked" : "qc_failed",
      action: "QcCheckSaved",
      performedBy: checkedBy,
      reason: input.note?.trim(),
    });

    return created;
  });

  if (input.status === "fail") {
    await openDeviationFromQcFail(
      input.taskId,
      check.id,
      input.note?.trim() ?? "QC không đạt",
      checkedBy,
    );
    await notifyQcFailed(input.taskId, task.sampleCode, checkedBy, input.note);
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
  if (await hasOpenDeviationForTask(taskId)) {
    return { ok: false, reason: "Còn sai lệch/CAPA chưa đóng" };
  }
  if (task.status !== "qc_checked" && task.qcChecks.length === 0) {
    return { ok: false, reason: "Chưa kiểm tra QC" };
  }
  return { ok: true };
}

export async function overrideQcFail(
  taskId: string,
  overrideReason: string,
  performedBy: string,
  performedByUserId?: string,
) {
  const reason = overrideReason.trim();
  if (!reason) throw new Error("Bắt buộc nhập lý do override QC");

  const task = await db.analysisTask.findUnique({
    where: { id: taskId },
    include: { qcChecks: true, sampleTest: true },
  });
  if (!task) throw new Error("Không tìm thấy task");
  const hasFail = task.qcChecks.some((c) => c.status === "fail");
  if (!hasFail) throw new Error("Task không có QC fail để override");

  await db.$transaction(async (tx) => {
    await tx.qcCheck.updateMany({
      where: { taskId, status: "fail" },
      data: { overrideReason: reason, status: "pass" },
    });
    await tx.analysisTask.update({
      where: { id: taskId },
      data: { status: "qc_checked" },
    });
    await tx.testResult.updateMany({
      where: { taskId },
      data: { status: "qc_passed" },
    });
    if (task.sampleTestId) {
      await tx.sampleTest.update({
        where: { id: task.sampleTestId },
        data: { status: "QcPassed" },
      });
    }
    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "qc_check",
      entityId: taskId,
      fromStatus: "qc_failed",
      toStatus: "qc_checked",
      action: "QcOverride",
      performedBy,
      performedByUserId,
      reason,
    });
  });

  await syncSampleStatusFromTasks(task.sampleId);
}
