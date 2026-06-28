import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import type { MethodExecutionView, MethodExecutionStepView } from "@/types/analytical-methods";
import { isMethodVersionApproved } from "./method-approval";
import { generateChecklistFromWorkflow } from "./method-workflow";

function mapExecutionStep(row: {
  id: string;
  stepOrder: number;
  stepName: string;
  instruction: string;
  requiredInput: string;
  expectedResult: string;
  operator: string;
  timestamp: Date | null;
  status: MethodExecutionStepView["status"];
  comment: string;
  workflowNodeKey: string;
}): MethodExecutionStepView {
  return {
    id: row.id,
    stepOrder: row.stepOrder,
    stepName: row.stepName,
    instruction: row.instruction,
    requiredInput: row.requiredInput,
    expectedResult: row.expectedResult,
    operator: row.operator,
    timestamp: row.timestamp ? row.timestamp.toISOString() : null,
    status: row.status,
    comment: row.comment,
    workflowNodeKey: row.workflowNodeKey,
  };
}

export async function getMethodExecution(id: string): Promise<MethodExecutionView | null> {
  const row = await db.methodExecution.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      methodVersion: {
        include: { method: { select: { methodCode: true, methodName: true } } },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    methodVersionId: row.methodVersionId,
    methodCode: row.methodVersion.method.methodCode,
    methodName: row.methodVersion.method.methodName,
    version: row.methodVersion.version,
    sampleCount: row.sampleCount,
    status: row.status,
    startedBy: row.startedBy,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    steps: row.steps.map(mapExecutionStep),
  };
}

export async function createMethodExecution(params: {
  methodVersionId: string;
  sampleCount: number;
  startedBy: string;
  allowUnapproved?: boolean;
}) {
  const approved = await isMethodVersionApproved(params.methodVersionId);
  if (!approved && !params.allowUnapproved) {
    throw new Error("Chỉ phương pháp đã phê duyệt mới được dùng trong workflow chính thức");
  }

  const checklist = await generateChecklistFromWorkflow(params.methodVersionId);
  const executionId = randomUUID();

  await db.$transaction(async (tx) => {
    await tx.methodExecution.create({
      data: {
        id: executionId,
        methodVersionId: params.methodVersionId,
        sampleCount: params.sampleCount,
        startedBy: params.startedBy,
        status: "InProgress",
      },
    });

    if (checklist.length > 0) {
      await tx.methodExecutionStep.createMany({
        data: checklist.map((item, index) => ({
          id: randomUUID(),
          executionId,
          stepOrder: item.stepOrder || index + 1,
          stepName: item.stepName,
          instruction: item.instruction,
          requiredInput: item.requiredInput,
          expectedResult: item.expectedResult,
          workflowNodeKey: item.workflowNodeKey,
          status: "Pending",
        })),
      });
    }
  });

  await logActivity({
    entityType: "MethodExecution",
    entityId: executionId,
    action: "CREATE",
    user: params.startedBy,
    object: `Tạo thực hiện phương pháp · ${params.sampleCount} mẫu`,
  });

  return executionId;
}

export async function updateMethodExecutionStep(params: {
  stepId: string;
  status: MethodExecutionStepView["status"];
  operator: string;
  comment?: string;
  requiredInput?: string;
}) {
  const step = await db.methodExecutionStep.update({
    where: { id: params.stepId },
    data: {
      status: params.status,
      operator: params.operator,
      comment: params.comment ?? "",
      requiredInput: params.requiredInput ?? undefined,
      timestamp: new Date(),
    },
    include: { execution: true },
  });

  await logActivity({
    entityType: "MethodExecutionStep",
    entityId: params.stepId,
    action: "UPDATE",
    user: params.operator,
    object: `Bước ${step.stepName}: ${params.status}`,
  });

  return step;
}

export async function completeMethodExecution(executionId: string, performedBy: string) {
  const execution = await db.methodExecution.update({
    where: { id: executionId },
    data: { status: "Completed", completedAt: new Date() },
  });

  await logActivity({
    entityType: "MethodExecution",
    entityId: executionId,
    action: "COMPLETE",
    user: performedBy,
    object: "Hoàn thành thực hiện phương pháp",
  });

  return execution;
}

export async function abortMethodExecution(executionId: string, performedBy: string, reason: string) {
  const execution = await db.methodExecution.update({
    where: { id: executionId },
    data: { status: "Aborted", completedAt: new Date() },
  });

  await logActivity({
    entityType: "MethodExecution",
    entityId: executionId,
    action: "ABORT",
    user: performedBy,
    object: reason,
  });

  return execution;
}

export function buildExecutionReportCsv(execution: MethodExecutionView): string {
  const header = ["STT", "Bước", "Hướng dẫn", "Người thực hiện", "Thời gian", "Trạng thái", "Ghi chú"];
  const rows = execution.steps.map((s) => [
    String(s.stepOrder),
    s.stepName,
    s.instruction,
    s.operator,
    s.timestamp ?? "",
    s.status,
    s.comment,
  ]);
  return [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
