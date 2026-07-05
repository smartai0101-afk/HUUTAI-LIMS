import { db } from "@/lib/db";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import { transitionSampleTest } from "@/lib/services/sample-test-state-machine";
import type { SampleTestStatus } from "@prisma/client";

export type SampleTestAssignmentView = {
  id: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  matrixName: string | null;
  parameterName: string;
  testMethodId: string | null;
  testMethodCode: string | null;
  testMethodName: string | null;
  methodName: string | null;
  departmentName: string | null;
  analystName: string;
  status: SampleTestStatus;
  dueDate: string | null;
  analysisTaskId: string | null;
};

export async function listSampleTestsForAssignment(filters?: {
  sampleId?: string;
  testMethodId?: string;
  analystId?: string;
  status?: SampleTestStatus;
}): Promise<SampleTestAssignmentView[]> {
  const rows = await db.sampleTest.findMany({
    where: {
      ...(filters?.sampleId ? { sampleId: filters.sampleId } : {}),
      ...(filters?.testMethodId ? { testMethodId: filters.testMethodId } : {}),
      ...(filters?.analystId ? { analystId: filters.analystId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    include: {
      sample: {
        include: { matrix: { select: { name: true } } },
      },
      testMethod: { select: { code: true, name: true, responsibleDeptId: true } },
      method: { select: { methodName: true } },
      analysisTask: { select: { id: true, analystName: true, departmentName: true } },
    },
    orderBy: [{ sample: { sampleCode: "asc" } }, { parameterName: "asc" }],
    take: 500,
  });

  return rows.map((r) => ({
    id: r.id,
    sampleId: r.sampleId,
    sampleCode: r.sample.sampleCode,
    sampleName: r.sample.sampleName,
    matrixName: r.sample.matrix?.name ?? null,
    parameterName: r.parameterName,
    testMethodId: r.testMethodId,
    testMethodCode: r.testMethod?.code ?? null,
    testMethodName: r.testMethod?.name ?? null,
    methodName: r.method?.methodName ?? null,
    departmentName: r.analysisTask?.departmentName ?? null,
    analystName: r.analysisTask?.analystName || r.assignedTo,
    status: r.status,
    dueDate: r.dueDate?.toISOString() ?? r.internalDueDate?.toISOString() ?? null,
    analysisTaskId: r.analysisTask?.id ?? null,
  }));
}

export async function assignSampleTest(
  sampleTestId: string,
  input: {
    departmentId: string;
    managerId: string;
    analystId?: string;
    dueDate: string;
    assignedBy: string;
  },
) {
  const st = await db.sampleTest.findUnique({
    where: { id: sampleTestId },
    include: {
      sample: true,
      testMethod: { include: { responsibleDept: true } },
    },
  });
  if (!st) throw new Error("Không tìm thấy chỉ tiêu");

  const dept = await db.labDepartment.findUnique({
    where: { id: input.departmentId },
    include: { managers: true },
  });
  if (!dept) throw new Error("Không tìm thấy phòng ban");
  const manager = dept.managers.find((m) => m.id === input.managerId);
  if (!manager) throw new Error("Không tìm thấy quản lý phòng");

  let analystName = "";
  if (input.analystId) {
    const analyst = await db.departmentAnalyst.findUnique({ where: { id: input.analystId } });
    analystName = analyst?.name ?? "";
  }

  const dueDate = new Date(input.dueDate.includes("T") ? input.dueDate : `${input.dueDate}T00:00:00.000Z`);

  return db.$transaction(async (tx) => {
    const assignment = await tx.analysisAssignment.create({
      data: {
        sampleId: st.sampleId,
        parameterGroup: st.parameterName,
        parametersJson: JSON.stringify([st.parameterName]),
        departmentId: dept.id,
        departmentName: dept.name,
        managerId: manager.id,
        managerName: manager.name,
        managerTitle: manager.title,
        assignedBy: input.assignedBy,
        dueDate,
        status: "assigned",
      },
    });

    const task = await tx.analysisTask.create({
      data: {
        assignmentId: assignment.id,
        sampleId: st.sampleId,
        sampleTestId: st.id,
        sampleCode: st.sample.sampleCode,
        sampleName: st.sample.sampleName,
        parameterGroup: st.parameterName,
        parametersJson: JSON.stringify([st.parameterName]),
        departmentId: dept.id,
        departmentName: dept.name,
        managerId: manager.id,
        managerName: manager.name,
        analystId: input.analystId ?? null,
        analystName,
        assignedBy: input.assignedBy,
        internalDueDate: dueDate,
        status: input.analystId ? "analyst_assigned" : "waiting_lab_acceptance",
      },
    });

    await tx.sampleTest.update({
      where: { id: sampleTestId },
      data: {
        assignedTo: analystName || manager.name,
        analystId: input.analystId ?? null,
        dueDate,
        status: "Assigned",
      },
    });

    await transitionSampleTest(tx, {
      sampleTestId: st.id,
      sampleId: st.sampleId,
      from: st.status,
      to: "Assigned",
      performedBy: input.assignedBy,
    }).catch(() => undefined);

    await appendWorkflowEvent(tx, {
      sampleId: st.sampleId,
      entityType: "sample_test",
      entityId: st.id,
      fromStatus: st.status,
      toStatus: "Assigned",
      action: "Assigned",
      performedBy: input.assignedBy,
      after: { taskId: task.id, departmentId: dept.id },
    });

    return { assignment, task };
  });
}

export async function bulkAssignSampleTests(
  sampleTestIds: string[],
  input: Omit<Parameters<typeof assignSampleTest>[1], never>,
) {
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of sampleTestIds) {
    try {
      await assignSampleTest(id, input);
      results.push({ id, ok: true });
    } catch (e) {
      results.push({ id, ok: false, error: e instanceof Error ? e.message : "Lỗi" });
    }
  }
  return results;
}
