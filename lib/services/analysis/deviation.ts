import { db } from "@/lib/db";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";

export async function listDeviations(status?: "open" | "investigating" | "closed") {
  return db.deviation.findMany({
    where: status ? { status } : undefined,
    include: {
      sample: { select: { sampleCode: true, sampleName: true } },
      task: { select: { parameterGroup: true, analystName: true } },
      capaActions: true,
    },
    orderBy: { detectedAt: "desc" },
    take: 200,
  });
}

export async function openDeviationFromQcFail(
  taskId: string,
  qcCheckId: string,
  description: string,
  detectedBy: string,
) {
  const task = await db.analysisTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Không tìm thấy task");

  return db.$transaction(async (tx) => {
    const deviation = await tx.deviation.create({
      data: {
        sampleId: task.sampleId,
        taskId,
        qcCheckId,
        type: "QC_FAIL",
        description: description.trim() || "QC không đạt",
        detectedBy,
        status: "open",
      },
    });

    await tx.qcCheck.update({
      where: { id: qcCheckId },
      data: { deviationId: deviation.id },
    });

    await appendWorkflowEvent(tx, {
      sampleId: task.sampleId,
      entityType: "deviation",
      entityId: deviation.id,
      fromStatus: "",
      toStatus: "open",
      action: "DeviationOpened",
      performedBy: detectedBy,
      reason: description.trim(),
    });

    return deviation;
  });
}

export async function closeDeviation(
  deviationId: string,
  rootCause: string,
  closedBy: string,
) {
  const existing = await db.deviation.findUnique({ where: { id: deviationId } });
  if (!existing) throw new Error("Không tìm thấy sai lệch");
  if (existing.status === "closed") throw new Error("Sai lệch đã đóng");

  return db.$transaction(async (tx) => {
    const updated = await tx.deviation.update({
      where: { id: deviationId },
      data: {
        status: "closed",
        rootCause: rootCause.trim(),
        closedAt: new Date(),
        closedBy,
      },
    });

    await appendWorkflowEvent(tx, {
      sampleId: existing.sampleId,
      entityType: "deviation",
      entityId: deviationId,
      fromStatus: existing.status,
      toStatus: "closed",
      action: "DeviationClosed",
      performedBy: closedBy,
      reason: rootCause.trim(),
    });

    return updated;
  });
}

export async function createCapaAction(
  deviationId: string,
  input: { actionType: string; description: string; dueDate?: string; assignedTo: string },
  createdBy: string,
) {
  const deviation = await db.deviation.findUnique({ where: { id: deviationId } });
  if (!deviation) throw new Error("Không tìm thấy sai lệch");

  return db.$transaction(async (tx) => {
    const capa = await tx.capaAction.create({
      data: {
        deviationId,
        actionType: input.actionType.trim(),
        description: input.description.trim(),
        dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
        assignedTo: input.assignedTo.trim(),
        status: "pending",
      },
    });

    await tx.deviation.update({
      where: { id: deviationId },
      data: { status: "investigating" },
    });

    await appendWorkflowEvent(tx, {
      sampleId: deviation.sampleId,
      entityType: "capa_action",
      entityId: capa.id,
      fromStatus: deviation.status,
      toStatus: "investigating",
      action: "CapaCreated",
      performedBy: createdBy,
    });

    return capa;
  });
}

export async function verifyCapaAction(capaId: string, verifiedBy: string) {
  const capa = await db.capaAction.findUnique({
    where: { id: capaId },
    include: { deviation: true },
  });
  if (!capa) throw new Error("Không tìm thấy hành động CAPA");

  return db.$transaction(async (tx) => {
    const updated = await tx.capaAction.update({
      where: { id: capaId },
      data: {
        status: "verified",
        completedAt: new Date(),
        verifiedBy,
      },
    });

    await appendWorkflowEvent(tx, {
      sampleId: capa.deviation.sampleId,
      entityType: "capa_action",
      entityId: capaId,
      fromStatus: capa.status,
      toStatus: "verified",
      action: "CapaVerified",
      performedBy: verifiedBy,
    });

    return updated;
  });
}

export async function hasOpenDeviationForTask(taskId: string): Promise<boolean> {
  const count = await db.deviation.count({
    where: { taskId, status: { in: ["open", "investigating"] } },
  });
  return count > 0;
}
