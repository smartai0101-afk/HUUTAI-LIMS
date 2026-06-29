import { db } from "@/lib/db";
import { generateWorksheetCode, toJsonArray } from "@/lib/analysis-code";
import { mapWorksheetView } from "@/lib/mappers/analysis";
import { ensureTestResultsForTask, syncSampleStatusFromTasks } from "./analysis-workflow";
import type { CreateWorksheetInput } from "@/lib/validators/analysis";
import type { WorksheetView } from "@/types/analysis";

export async function listWorksheets(): Promise<WorksheetView[]> {
  const rows = await db.analysisWorksheet.findMany({
    include: {
      worklist: { select: { worklistCode: true } },
      chemicals: true,
      standards: true,
      crms: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(mapWorksheetView);
}

export async function getWorksheet(id: string): Promise<WorksheetView | null> {
  const row = await db.analysisWorksheet.findUnique({
    where: { id },
    include: {
      worklist: { select: { worklistCode: true } },
      chemicals: true,
      standards: true,
      crms: true,
    },
  });
  return row ? mapWorksheetView(row) : null;
}

export async function listWorklistsForWorksheet() {
  return db.analysisWorklist.findMany({
    where: { status: { in: ["created", "running"] } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorksheet(input: CreateWorksheetInput, createdBy: string) {
  const worklist = await db.analysisWorklist.findUnique({
    where: { id: input.worklistId },
    include: { taskLinks: true },
  });
  if (!worklist) throw new Error("Không tìm thấy worklist");
  if (!["created", "running"].includes(worklist.status)) {
    throw new Error("Worklist không sẵn sàng tạo worksheet");
  }
  if (!worklist.analystId) throw new Error("Worklist thiếu analyst");

  return db.$transaction(async (tx) => {
    const worksheetCode = await generateWorksheetCode(tx);
    const ws = await tx.analysisWorksheet.create({
      data: {
        worksheetCode,
        worklistId: worklist.id,
        methodId: worklist.methodId,
        methodName: worklist.methodName,
        methodVersionId: worklist.methodVersionId,
        methodVersion: worklist.methodVersion,
        equipmentId: worklist.equipmentId,
        equipmentName: worklist.equipmentName,
        analystId: worklist.analystId!,
        analystName: worklist.analystName,
        conditionNote: input.conditionNote?.trim() ?? "",
        qcSamplesJson: toJsonArray(input.qcSamples ?? []),
        note: input.note?.trim() ?? "",
        status: "draft",
      },
    });

    for (const chemicalId of input.chemicalIds ?? []) {
      await tx.worksheetChemical.create({ data: { worksheetId: ws.id, chemicalId } });
    }
    for (const standardId of input.standardIds ?? []) {
      await tx.worksheetStandard.create({ data: { worksheetId: ws.id, standardId } });
    }
    for (const standardId of input.crmIds ?? []) {
      await tx.worksheetCrm.create({ data: { worksheetId: ws.id, standardId } });
    }

    const full = await tx.analysisWorksheet.findUnique({
      where: { id: ws.id },
      include: {
        worklist: { select: { worklistCode: true } },
        chemicals: true,
        standards: true,
        crms: true,
      },
    });
    return mapWorksheetView(full!);
  });
}

export async function startWorksheet(id: string, changedBy: string) {
  const ws = await db.analysisWorksheet.findUnique({
    where: { id },
    include: { worklist: { include: { taskLinks: true } } },
  });
  if (!ws) throw new Error("Không tìm thấy worksheet");
  if (!ws.methodId || !ws.equipmentId || !ws.analystId) {
    throw new Error("Worksheet thiếu phương pháp, thiết bị hoặc analyst");
  }

  return db.$transaction(async (tx) => {
    await tx.analysisWorksheet.update({
      where: { id },
      data: { status: "in_progress", startedAt: new Date() },
    });

    for (const link of ws.worklist.taskLinks) {
      await tx.analysisTask.update({
        where: { id: link.taskId },
        data: { status: "in_analysis" },
      });
      const task = await tx.analysisTask.findUnique({ where: { id: link.taskId } });
      if (task) {
        await tx.analysisAssignment.update({
          where: { id: task.assignmentId },
          data: { status: "department_processing" },
        });
        await ensureTestResultsForTask(link.taskId);
      }
    }

    const sampleIds = new Set<string>();
    for (const link of ws.worklist.taskLinks) {
      const t = await tx.analysisTask.findUnique({ where: { id: link.taskId } });
      if (t) sampleIds.add(t.sampleId);
    }
    for (const sampleId of sampleIds) {
      await syncSampleStatusFromTasks(sampleId);
    }

    return getWorksheet(id);
  });
}

export async function completeWorksheet(id: string) {
  const ws = await db.analysisWorksheet.findUnique({ where: { id } });
  if (!ws) throw new Error("Không tìm thấy worksheet");
  if (ws.status !== "in_progress") throw new Error("Worksheet chưa bắt đầu");
  if (!ws.methodId || !ws.equipmentId) {
    throw new Error("Worksheet thiếu phương pháp hoặc thiết bị");
  }

  await db.analysisWorksheet.update({
    where: { id },
    data: { status: "completed", completedAt: new Date() },
  });
  return getWorksheet(id);
}

export async function listChemicalOptions() {
  return db.chemical.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
    take: 200,
  });
}

export async function listStandardOptions() {
  return db.standard.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
    take: 200,
  });
}
