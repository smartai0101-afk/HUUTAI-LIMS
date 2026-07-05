import { db } from "@/lib/db";
import { mapAnalysisTaskView } from "@/lib/mappers/analysis";
import { notifyAnalystAssigned } from "@/lib/services/lims-notification-hooks";
import type { AssignAnalystInput } from "@/lib/validators/analysis";
import type { AnalysisTaskView, DepartmentAnalystView } from "@/types/analysis";

function parseDate(value: string): Date {
  if (value.includes("T")) return new Date(value);
  return new Date(`${value}T00:00:00.000Z`);
}

export async function listDepartmentAnalysts(departmentId?: string): Promise<DepartmentAnalystView[]> {
  const rows = await db.departmentAnalyst.findMany({
    where: {
      active: true,
      ...(departmentId ? { departmentId } : {}),
    },
    orderBy: [{ departmentId: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    departmentId: r.departmentId,
    code: r.code,
    name: r.name,
    active: r.active,
  }));
}

export async function listTasksForAnalystAssign(departmentId?: string): Promise<AnalysisTaskView[]> {
  const rows = await db.analysisTask.findMany({
    where: {
      status: "lab_accepted",
      ...(departmentId ? { departmentId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapAnalysisTaskView);
}

export async function assignAnalystToTask(input: AssignAnalystInput, changedBy: string) {
  const task = await db.analysisTask.findUnique({ where: { id: input.taskId } });
  if (!task) throw new Error("Không tìm thấy task");
  if (task.status !== "lab_accepted") {
    throw new Error("Chỉ phân công analyst khi phòng ban đã tiếp nhận");
  }

  const analyst = await db.departmentAnalyst.findUnique({ where: { id: input.analystId } });
  if (!analyst || analyst.departmentId !== task.departmentId) {
    throw new Error("Analyst không thuộc phòng ban");
  }

  const updated = await db.analysisTask.update({
    where: { id: input.taskId },
    data: {
      analystId: analyst.id,
      analystName: analyst.name,
      internalDueDate: parseDate(input.internalDueDate),
      status: "analyst_assigned",
      note: input.note?.trim() ?? task.note,
    },
  });

  await notifyAnalystAssigned(
    updated.id,
    updated.sampleCode,
    analyst.name,
    changedBy,
  );

  return mapAnalysisTaskView(updated);
}
