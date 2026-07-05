import { db } from "@/lib/db";
import { mapTestResultView } from "@/lib/mappers/analysis";
import type { SaveTestResultInput } from "@/lib/validators/analysis";
import type { TestResultView } from "@/types/analysis";
import { syncSampleStatusFromTasks } from "./analysis-workflow";

export async function listTestResults(taskId?: string): Promise<TestResultView[]> {
  const rows = await db.testResult.findMany({
    where: {
      ...(taskId ? { taskId } : {}),
      task: { status: { in: ["in_analysis", "result_entered", "qc_checked", "submitted_for_review"] } },
    },
    include: { task: true },
    orderBy: [{ sampleCode: "asc" }, { parameterName: "asc" }],
    take: 500,
  });
  return rows.map(mapTestResultView);
}

export async function listResultsBySample(sampleId: string): Promise<TestResultView[]> {
  const rows = await db.testResult.findMany({
    where: { sampleId },
    include: { task: true },
    orderBy: { parameterName: "asc" },
  });
  return rows.map(mapTestResultView);
}

export async function saveTestResult(input: SaveTestResultInput, changedBy: string) {
  const existing = await db.testResult.findUnique({
    where: { id: input.resultId },
    include: { task: true },
  });
  if (!existing) throw new Error("Không tìm thấy kết quả");
  if (!["in_analysis", "result_entered", "rejected"].includes(existing.task.status)) {
    throw new Error("Task không ở trạng thái cho phép nhập kết quả");
  }

  const isRevision = existing.status !== "not_entered" && existing.resultValue.trim();
  if (isRevision && !input.modifiedReason?.trim()) {
    throw new Error("Bắt buộc nhập lý do khi sửa kết quả đã lưu");
  }

  const updated = await db.testResult.update({
    where: { id: input.resultId },
    data: {
      rawValue: input.rawValue?.trim() ?? input.resultValue.trim(),
      dilution: input.dilution?.trim() ?? "",
      resultValue: input.resultValue.trim(),
      unit: input.unit?.trim() ?? "",
      lod: input.lod?.trim() ?? "",
      loq: input.loq?.trim() ?? "",
      limitValue: input.limitValue?.trim() ?? "",
      uncertainty: input.uncertainty?.trim() ?? "",
      evaluation: input.evaluation ?? null,
      note: input.note?.trim() ?? "",
      analystName: changedBy,
      enteredAt: new Date(),
      status: "entered",
      revisionNo: isRevision ? existing.revisionNo + 1 : existing.revisionNo,
      modifiedReason: input.modifiedReason?.trim() ?? "",
    },
    include: { task: true },
  });

  await db.analysisTask.update({
    where: { id: existing.taskId },
    data: { status: "result_entered" },
  });

  await syncSampleStatusFromTasks(existing.sampleId);

  return mapTestResultView(updated);
}

export async function submitResultsForQc(taskId: string) {
  const task = await db.analysisTask.findUnique({
    where: { id: taskId },
    include: { testResults: true },
  });
  if (!task) throw new Error("Không tìm thấy task");
  if (task.testResults.some((r) => r.status === "not_entered" || !r.resultValue.trim())) {
    throw new Error("Cần nhập đủ kết quả trước khi gửi QC");
  }

  await db.testResult.updateMany({
    where: { taskId },
    data: { status: "qc_pending" },
  });

  return { success: true };
}
