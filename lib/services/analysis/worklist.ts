import { db } from "@/lib/db";
import { generateWorklistCode } from "@/lib/analysis-code";
import { mapWorklistView } from "@/lib/mappers/analysis";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import type { CreateWorklistInput } from "@/lib/validators/analysis";
import type { WorklistView } from "@/types/analysis";

export async function listWorklists(departmentId?: string): Promise<WorklistView[]> {
  const rows = await db.analysisWorklist.findMany({
    where: departmentId ? { departmentId } : undefined,
    include: { taskLinks: { include: { task: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(mapWorklistView);
}

export async function getWorklist(id: string): Promise<WorklistView | null> {
  const row = await db.analysisWorklist.findUnique({
    where: { id },
    include: { taskLinks: { include: { task: true } } },
  });
  return row ? mapWorklistView(row) : null;
}

export async function listTasksForWorklist(departmentId: string) {
  return db.analysisTask.findMany({
    where: { departmentId, status: "analyst_assigned" },
    orderBy: { createdAt: "asc" },
  });
}

export async function createWorklist(input: CreateWorklistInput, createdBy: string) {
  const [dept, method, equipment, analyst, tasks] = await Promise.all([
    db.labDepartment.findUnique({ where: { id: input.departmentId } }),
    db.analyticalMethod.findUnique({
      where: { id: input.methodId },
      include: { currentVersion: true },
    }),
    db.equipment.findUnique({ where: { id: input.equipmentId } }),
    db.departmentAnalyst.findUnique({ where: { id: input.analystId } }),
    db.analysisTask.findMany({ where: { id: { in: input.taskIds } } }),
  ]);

  if (!dept) throw new Error("Phòng ban không hợp lệ");
  if (!method) throw new Error("Phương pháp không hợp lệ");
  if (!equipment) throw new Error("Thiết bị không hợp lệ");
  if (!analyst || analyst.departmentId !== input.departmentId) {
    throw new Error("Analyst không thuộc phòng ban");
  }
  if (tasks.length !== input.taskIds.length) throw new Error("Task không hợp lệ");
  if (tasks.some((t) => t.status !== "analyst_assigned" || t.departmentId !== input.departmentId)) {
    throw new Error("Task phải ở trạng thái đã phân công analyst cùng phòng");
  }

  const versionId = input.methodVersionId ?? method.currentVersionId;
  const version = method.currentVersion?.version ?? null;

  return db.$transaction(async (tx) => {
    const worklistCode = await generateWorklistCode(tx);
    const worklist = await tx.analysisWorklist.create({
      data: {
        worklistCode,
        departmentId: dept.id,
        departmentName: dept.name,
        methodId: method.id,
        methodName: `${method.methodCode} — ${method.methodName}`,
        methodVersionId: versionId,
        methodVersion: version,
        equipmentId: equipment.id,
        equipmentName: `${equipment.code} — ${equipment.name}`,
        analystId: analyst.id,
        analystName: analyst.name,
        status: "created",
        createdBy,
      },
    });

    for (const taskId of input.taskIds) {
      await tx.analysisWorklistTask.create({
        data: { worklistId: worklist.id, taskId },
      });
      await tx.analysisTask.update({
        where: { id: taskId },
        data: { status: "in_worklist" },
      });
    }

    await appendWorkflowEvent(tx, {
      entityType: "worklist",
      entityId: worklist.id,
      fromStatus: "",
      toStatus: "created",
      action: "WorklistCreated",
      performedBy: createdBy,
    });

    const full = await tx.analysisWorklist.findUnique({
      where: { id: worklist.id },
      include: { taskLinks: { include: { task: true } } },
    });
    return mapWorklistView(full!);
  });
}

export async function startWorklist(id: string, startedBy = "system") {
  const wl = await db.analysisWorklist.findUnique({ where: { id } });
  if (!wl) throw new Error("Không tìm thấy worklist");
  if (!wl.methodId || !wl.equipmentId) {
    throw new Error("Worklist cần phương pháp và thiết bị trước khi chạy");
  }
  if (wl.status !== "created" && wl.status !== "draft") {
    throw new Error("Worklist không thể chuyển sang đang chạy");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.analysisWorklist.update({
      where: { id },
      data: { status: "running" },
      include: { taskLinks: { include: { task: true } } },
    });
    await appendWorkflowEvent(tx, {
      entityType: "worklist",
      entityId: id,
      fromStatus: wl.status,
      toStatus: "running",
      action: "WorklistStarted",
      performedBy: startedBy,
    });
    return mapWorklistView(updated);
  });
}

export async function completeWorklist(id: string, completedBy: string) {
  const wl = await db.analysisWorklist.findUnique({ where: { id } });
  if (!wl) throw new Error("Không tìm thấy worklist");
  if (wl.status !== "running") throw new Error("Chỉ hoàn thành worklist đang chạy");

  return db.$transaction(async (tx) => {
    const updated = await tx.analysisWorklist.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        completedBy,
      },
      include: { taskLinks: { include: { task: true } } },
    });
    await appendWorkflowEvent(tx, {
      entityType: "worklist",
      entityId: id,
      fromStatus: wl.status,
      toStatus: "completed",
      action: "WorklistCompleted",
      performedBy: completedBy,
    });
    return mapWorklistView(updated);
  });
}

export async function listMethodOptions() {
  return db.analyticalMethod.findMany({
    include: { currentVersion: { select: { id: true, version: true } } },
    orderBy: { methodCode: "asc" },
  });
}

export async function listEquipmentOptions() {
  return db.equipment.findMany({
    where: { status: { not: "Disposed" } },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
}
