import type { PrismaClient } from "@prisma/client";
import { toJsonArray } from "../../../lib/analysis-code";

type GroupDef = {
  sampleCode: string;
  parameterGroup: string;
  parameters: string[];
  departmentName: string;
  dueDate: string;
  assignmentStatus: "assigned" | "department_received" | "department_processing" | "completed" | "cancelled";
  taskStatus?:
    | "lab_accepted"
    | "analyst_assigned"
    | "in_worklist"
    | "in_analysis"
    | "result_entered"
    | "qc_checked"
    | "submitted_for_review"
    | "approved";
};

const DEMO_GROUPS: GroupDef[] = [
  {
    sampleCode: "SPL-20260629-0002",
    parameterGroup: "Dinh dưỡng cơ bản",
    parameters: ["Protein", "Gluten ướt", "Độ ẩm", "Tro"],
    departmentName: "Phòng Dinh dưỡng",
    dueDate: "2026-07-15",
    assignmentStatus: "assigned",
  },
  {
    sampleCode: "SPL-20260629-0002",
    parameterGroup: "Kim loại nặng",
    parameters: ["Pb", "Cd"],
    departmentName: "Phòng Kim loại nặng",
    dueDate: "2026-07-15",
    assignmentStatus: "assigned",
  },
  {
    sampleCode: "SPL-20260629-0003",
    parameterGroup: "Chỉ số hóa lý",
    parameters: ["Chỉ số acid", "Chỉ số peroxide"],
    departmentName: "Phòng Hóa lý",
    dueDate: "2026-07-20",
    assignmentStatus: "assigned",
  },
  {
    sampleCode: "SPL-20260629-0003",
    parameterGroup: "Kim loại nặng",
    parameters: ["Pb", "As"],
    departmentName: "Phòng Kim loại nặng",
    dueDate: "2026-07-20",
    assignmentStatus: "assigned",
  },
  {
    sampleCode: "SPL-20260629-0003",
    parameterGroup: "Dung môi tồn dư",
    parameters: ["Dung môi tồn dư"],
    departmentName: "Phòng Sắc ký",
    dueDate: "2026-07-20",
    assignmentStatus: "assigned",
  },
  {
    sampleCode: "SPL-20260629-0005",
    parameterGroup: "Dư lượng thuốc BVTV",
    parameters: ["Dư lượng thuốc BVTV nhóm organophosphate", "Carbamate", "Nitrate"],
    departmentName: "Phòng Sắc ký",
    dueDate: "2026-07-10",
    assignmentStatus: "department_received",
    taskStatus: "lab_accepted",
  },
  {
    sampleCode: "SPL-20260629-0005",
    parameterGroup: "Kim loại nặng",
    parameters: ["Pb", "Cd"],
    departmentName: "Phòng Kim loại nặng",
    dueDate: "2026-07-10",
    assignmentStatus: "department_received",
    taskStatus: "analyst_assigned",
  },
  {
    sampleCode: "SPL-20260629-0006",
    parameterGroup: "Kháng sinh",
    parameters: ["Chloramphenicol", "Tetracycline"],
    departmentName: "Phòng Sắc ký",
    dueDate: "2026-07-12",
    assignmentStatus: "department_processing",
    taskStatus: "in_analysis",
  },
  {
    sampleCode: "SPL-20260629-0006",
    parameterGroup: "Vi sinh",
    parameters: ["Salmonella", "E. coli"],
    departmentName: "Phòng Vi sinh",
    dueDate: "2026-07-12",
    assignmentStatus: "department_processing",
    taskStatus: "result_entered",
  },
  {
    sampleCode: "SPL-20260629-0007",
    parameterGroup: "Dinh dưỡng",
    parameters: ["Protein thô", "Xơ thô", "Béo thô"],
    departmentName: "Phòng Dinh dưỡng",
    dueDate: "2026-07-18",
    assignmentStatus: "department_processing",
    taskStatus: "submitted_for_review",
  },
  {
    sampleCode: "SPL-20260629-0001",
    parameterGroup: "Độc tố nấm mốc",
    parameters: ["Aflatoxin B1"],
    departmentName: "Phòng Độc tố nấm mốc",
    dueDate: "2026-06-07",
    assignmentStatus: "completed",
    taskStatus: "approved",
  },
  {
    sampleCode: "SPL-20260629-0001",
    parameterGroup: "Kim loại nặng",
    parameters: ["Pb", "Cd", "As"],
    departmentName: "Phòng Kim loại nặng",
    dueDate: "2026-06-07",
    assignmentStatus: "completed",
    taskStatus: "approved",
  },
];

export async function seedDemoAnalysis(prisma: PrismaClient) {
  for (const def of DEMO_GROUPS) {
    const sample = await prisma.sample.findUnique({ where: { sampleCode: def.sampleCode } });
    if (!sample) continue;

    const dept = await prisma.labDepartment.findUnique({ where: { name: def.departmentName } });
    if (!dept) continue;

    const manager = await prisma.departmentManager.findFirst({ where: { departmentId: dept.id } });
    if (!manager) continue;

    const existing = await prisma.analysisAssignment.findFirst({
      where: { sampleId: sample.id, parameterGroup: def.parameterGroup },
    });
    if (existing) continue;

    const assignment = await prisma.analysisAssignment.create({
      data: {
        sampleId: sample.id,
        parameterGroup: def.parameterGroup,
        parametersJson: toJsonArray(def.parameters),
        departmentId: dept.id,
        departmentName: dept.name,
        managerId: manager.id,
        managerName: manager.name,
        managerTitle: manager.title,
        assignedBy: "Seed",
        dueDate: new Date(`${def.dueDate}T00:00:00.000Z`),
        status: def.assignmentStatus,
      },
    });

    if (def.taskStatus) {
      const analyst = await prisma.departmentAnalyst.findFirst({
        where: { departmentId: dept.id },
      });

      const task = await prisma.analysisTask.create({
        data: {
          assignmentId: assignment.id,
          sampleId: sample.id,
          sampleCode: sample.sampleCode,
          sampleName: sample.sampleName,
          parameterGroup: def.parameterGroup,
          parametersJson: toJsonArray(def.parameters),
          departmentId: dept.id,
          departmentName: dept.name,
          managerId: manager.id,
          managerName: manager.name,
          assignedBy: "Seed",
          status: def.taskStatus,
          analystId:
            def.taskStatus !== "lab_accepted" && analyst ? analyst.id : null,
          analystName:
            def.taskStatus !== "lab_accepted" && analyst ? analyst.name : "",
          internalDueDate: new Date(`${def.dueDate}T00:00:00.000Z`),
        },
      });

      for (const param of def.parameters) {
        await prisma.testResult.create({
          data: {
            taskId: task.id,
            sampleId: sample.id,
            sampleCode: sample.sampleCode,
            parameterName: param,
            resultValue:
              def.taskStatus === "result_entered" ||
              def.taskStatus === "qc_checked" ||
              def.taskStatus === "submitted_for_review" ||
              def.taskStatus === "approved"
                ? "0.05"
                : "",
            unit: "mg/kg",
            status:
              def.taskStatus === "approved"
                ? "approved"
                : def.taskStatus === "submitted_for_review"
                  ? "submitted_for_review"
                  : def.taskStatus === "qc_checked"
                    ? "qc_passed"
                    : def.taskStatus === "result_entered"
                      ? "entered"
                      : "not_entered",
            analystName: analyst?.name ?? "",
            enteredAt:
              def.taskStatus === "result_entered" ||
              def.taskStatus === "qc_checked" ||
              def.taskStatus === "submitted_for_review" ||
              def.taskStatus === "approved"
                ? new Date()
                : null,
          },
        });
      }

      if (
        def.taskStatus === "qc_checked" ||
        def.taskStatus === "submitted_for_review" ||
        def.taskStatus === "approved"
      ) {
        await prisma.qcCheck.create({
          data: {
            taskId: task.id,
            checkType: "crm",
            status: "pass",
            checkedBy: "Seed",
          },
        });
      }
    }
  }

  await seedDemoWorklistsAndWorksheets(prisma);
}

async function seedDemoWorklistsAndWorksheets(prisma: PrismaClient) {
  const method = await prisma.analyticalMethod.findFirst({
    where: { methodCode: "PP-ICP-WAT-001" },
    include: { currentVersion: true },
  });
  const chromMethod = await prisma.analyticalMethod.findFirst({
    where: { methodCode: "PP-LCMS-PST-001" },
    include: { currentVersion: true },
  });
  const icpEquipment = await prisma.equipment.findFirst({ where: { code: "EQ-ICP-001" } });
  const lcEquipment = await prisma.equipment.findFirst({ where: { code: "EQ-LC-MS-001" } });

  const analystAssignedTask = await prisma.analysisTask.findFirst({
    where: { sampleCode: "SPL-20260629-0005", status: "analyst_assigned" },
  });
  if (
    analystAssignedTask &&
    method &&
    icpEquipment &&
    !(await prisma.analysisWorklistTask.findFirst({ where: { taskId: analystAssignedTask.id } }))
  ) {
    const analyst = await prisma.departmentAnalyst.findFirst({
      where: { id: analystAssignedTask.analystId ?? undefined },
    });
    await prisma.analysisWorklist.create({
      data: {
        worklistCode: "WL-SEED-DRAFT-001",
        departmentId: analystAssignedTask.departmentId,
        departmentName: analystAssignedTask.departmentName,
        methodId: method.id,
        methodName: `${method.methodCode} — ${method.methodName}`,
        methodVersionId: method.currentVersionId,
        methodVersion: method.currentVersion?.version ?? null,
        equipmentId: icpEquipment.id,
        equipmentName: `${icpEquipment.code} — ${icpEquipment.name}`,
        analystId: analyst?.id,
        analystName: analyst?.name ?? "",
        status: "draft",
        createdBy: "Seed",
        taskLinks: { create: { taskId: analystAssignedTask.id } },
      },
    });
  }

  const inAnalysisTask = await prisma.analysisTask.findFirst({
    where: { sampleCode: "SPL-20260629-0006", parameterGroup: "Kháng sinh", status: "in_analysis" },
  });
  if (
    inAnalysisTask &&
    chromMethod &&
    lcEquipment &&
    inAnalysisTask.analystId &&
    !(await prisma.analysisWorklistTask.findFirst({ where: { taskId: inAnalysisTask.id } }))
  ) {
    const analyst = await prisma.departmentAnalyst.findUnique({ where: { id: inAnalysisTask.analystId } });
    const worklist = await prisma.analysisWorklist.create({
      data: {
        worklistCode: "WL-SEED-RUN-001",
        departmentId: inAnalysisTask.departmentId,
        departmentName: inAnalysisTask.departmentName,
        methodId: chromMethod.id,
        methodName: `${chromMethod.methodCode} — ${chromMethod.methodName}`,
        methodVersionId: chromMethod.currentVersionId,
        methodVersion: chromMethod.currentVersion?.version ?? null,
        equipmentId: lcEquipment.id,
        equipmentName: `${lcEquipment.code} — ${lcEquipment.name}`,
        analystId: analyst?.id,
        analystName: analyst?.name ?? "",
        status: "running",
        createdBy: "Seed",
        taskLinks: { create: { taskId: inAnalysisTask.id } },
      },
    });
    if (analyst) {
      await prisma.analysisWorksheet.create({
        data: {
          worksheetCode: "WS-SEED-PROG-001",
          worklistId: worklist.id,
          methodId: chromMethod.id,
          methodName: `${chromMethod.methodCode} — ${chromMethod.methodName}`,
          methodVersionId: chromMethod.currentVersionId,
          methodVersion: chromMethod.currentVersion?.version ?? null,
          equipmentId: lcEquipment.id,
          equipmentName: `${lcEquipment.code} — ${lcEquipment.name}`,
          analystId: analyst.id,
          analystName: analyst.name,
          status: "in_progress",
          startedAt: new Date(),
        },
      });
    }
  }

  const reviewTask = await prisma.analysisTask.findFirst({
    where: { sampleCode: "SPL-20260629-0007", status: { not: "submitted_for_review" } },
  });
  if (reviewTask) {
    await prisma.analysisTask.update({
      where: { id: reviewTask.id },
      data: { status: "submitted_for_review" },
    });
    await prisma.testResult.updateMany({
      where: { taskId: reviewTask.id },
      data: { status: "submitted_for_review" },
    });
    const hasQc = await prisma.qcCheck.findFirst({ where: { taskId: reviewTask.id } });
    if (!hasQc) {
      await prisma.qcCheck.create({
        data: { taskId: reviewTask.id, checkType: "crm", status: "pass", checkedBy: "Seed" },
      });
    }
  }
}
