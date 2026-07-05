import { db } from "@/lib/db";
import { generateWorklistCode } from "@/lib/analysis-code";
import { mapWorklistView } from "@/lib/mappers/analysis";
import { transitionSampleTest } from "@/lib/services/sample-test-state-machine";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import type { SampleTestStatus } from "@prisma/client";

export async function createWorklistFromSampleTests(
  input: {
    departmentId: string;
    methodId: string;
    methodVersionId?: string;
    equipmentId: string;
    analystId: string;
    sampleTestIds: string[];
    matrixId?: string;
    testCategoryId?: string;
    deadline?: string;
  },
  createdBy: string,
) {
  if (input.sampleTestIds.length === 0) throw new Error("Chọn ít nhất một chỉ tiêu");

  const sampleTests = await db.sampleTest.findMany({
    where: { id: { in: input.sampleTestIds } },
    include: { analysisTask: true, sample: true },
  });
  if (sampleTests.length !== input.sampleTestIds.length) throw new Error("Chỉ tiêu không hợp lệ");

  const taskIds = sampleTests
    .map((st) => st.analysisTask?.id)
    .filter((id): id is string => Boolean(id));
  if (taskIds.length !== sampleTests.length) {
    throw new Error("Mọi chỉ tiêu phải đã được phân công (có AnalysisTask)");
  }

  const [dept, method, equipment, analyst] = await Promise.all([
    db.labDepartment.findUnique({ where: { id: input.departmentId } }),
    db.analyticalMethod.findUnique({
      where: { id: input.methodId },
      include: { currentVersion: true },
    }),
    db.equipment.findUnique({ where: { id: input.equipmentId } }),
    db.departmentAnalyst.findUnique({ where: { id: input.analystId } }),
  ]);

  if (!dept) throw new Error("Phòng ban không hợp lệ");
  if (!method) throw new Error("Phương pháp không hợp lệ");
  if (!equipment) throw new Error("Thiết bị không hợp lệ");
  if (!analyst || analyst.departmentId !== input.departmentId) {
    throw new Error("Analyst không thuộc phòng ban");
  }

  const versionId = input.methodVersionId ?? method.currentVersionId;
  const version = method.currentVersion?.version ?? null;
  const deadline = input.deadline
    ? new Date(input.deadline.includes("T") ? input.deadline : `${input.deadline}T00:00:00.000Z`)
    : null;

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
        matrixId: input.matrixId ?? null,
        testCategoryId: input.testCategoryId ?? null,
        deadline,
        status: "created",
        createdBy,
      },
    });

    for (const taskId of taskIds) {
      await tx.analysisWorklistTask.create({
        data: { worklistId: worklist.id, taskId },
      });
      await tx.analysisTask.update({
        where: { id: taskId },
        data: { status: "in_worklist" },
      });
    }

    for (const st of sampleTests) {
      await tx.analysisWorklistSampleTest.create({
        data: { worklistId: worklist.id, sampleTestId: st.id },
      });
      const from = st.status as SampleTestStatus;
      if (from === "Assigned" || from === "Pending") {
        await transitionSampleTest(tx, {
          sampleTestId: st.id,
          sampleId: st.sampleId,
          from,
          to: "InWorklist",
          performedBy: createdBy,
        }).catch(() =>
          tx.sampleTest.update({ where: { id: st.id }, data: { status: "InWorklist" } }),
        );
      } else {
        await tx.sampleTest.update({ where: { id: st.id }, data: { status: "InWorklist" } });
      }
    }

    await appendWorkflowEvent(tx, {
      entityType: "worklist",
      entityId: worklist.id,
      fromStatus: "",
      toStatus: "created",
      action: "WorklistCreatedFromSampleTests",
      performedBy: createdBy,
      after: { sampleTestIds: input.sampleTestIds },
    });

    const full = await tx.analysisWorklist.findUnique({
      where: { id: worklist.id },
      include: { taskLinks: { include: { task: true } } },
    });
    return mapWorklistView(full!);
  });
}

export async function addSampleTestsToWorksheet(
  worksheetId: string,
  sampleTestIds: string[],
  changedBy: string,
) {
  if (sampleTestIds.length === 0) throw new Error("Chọn ít nhất một chỉ tiêu");

  const ws = await db.analysisWorksheet.findUnique({ where: { id: worksheetId } });
  if (!ws) throw new Error("Không tìm thấy worksheet");

  const sampleTests = await db.sampleTest.findMany({
    where: { id: { in: sampleTestIds } },
  });
  if (sampleTests.length !== sampleTestIds.length) throw new Error("Chỉ tiêu không hợp lệ");

  return db.$transaction(async (tx) => {
    let order = await tx.worksheetSampleTest.count({ where: { worksheetId } });
    for (const st of sampleTests) {
      order += 1;
      await tx.worksheetSampleTest.upsert({
        where: { worksheetId_sampleTestId: { worksheetId, sampleTestId: st.id } },
        create: { worksheetId, sampleTestId: st.id, runOrder: order },
        update: { runOrder: order },
      });
      const from = st.status as SampleTestStatus;
      if (["InWorklist", "Assigned", "InWorksheet"].includes(from)) {
        await transitionSampleTest(tx, {
          sampleTestId: st.id,
          sampleId: st.sampleId,
          from,
          to: "InWorksheet",
          performedBy: changedBy,
        }).catch(() =>
          tx.sampleTest.update({ where: { id: st.id }, data: { status: "InWorksheet", worksheetId } }),
        );
      } else {
        await tx.sampleTest.update({
          where: { id: st.id },
          data: { status: "InWorksheet", worksheetId },
        });
      }
    }

    await appendWorkflowEvent(tx, {
      entityType: "worksheet",
      entityId: worksheetId,
      fromStatus: ws.status,
      toStatus: ws.status,
      action: "SampleTestsAdded",
      performedBy: changedBy,
      after: { sampleTestIds },
    });

    return { added: sampleTestIds.length };
  });
}
