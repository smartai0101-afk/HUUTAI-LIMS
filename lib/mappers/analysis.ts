import type {
  AnalysisTask,
  AnalysisWorklist,
  AnalysisWorksheet,
  QcCheck,
  TestResult,
} from "@prisma/client";
import { parseJsonArray } from "@/lib/analysis-code";
import type {
  AnalysisInboxRow,
  AnalysisTaskView,
  QcCheckView,
  TestResultView,
  WorklistView,
  WorksheetView,
} from "@/types/analysis";

export function mapAnalysisTaskView(row: AnalysisTask): AnalysisTaskView {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    sampleId: row.sampleId,
    sampleCode: row.sampleCode,
    sampleName: row.sampleName,
    parameterGroup: row.parameterGroup,
    parameters: parseJsonArray(row.parametersJson),
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    managerId: row.managerId,
    managerName: row.managerName,
    analystId: row.analystId,
    analystName: row.analystName,
    internalDueDate: row.internalDueDate?.toISOString() ?? null,
    status: row.status,
    note: row.note,
  };
}

export function mapInboxRow(row: {
  id: string;
  sampleId: string;
  parameterGroup: string;
  parametersJson: string;
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  managerTitle: string;
  dueDate: Date;
  status: string;
  note: string;
  sample: {
    sampleCode: string;
    sampleName: string;
    sampleType: string;
    request: { requestCode: string } | null;
  };
}): AnalysisInboxRow {
  return {
    assignmentId: row.id,
    sampleId: row.sampleId,
    sampleCode: row.sample.sampleCode,
    sampleName: row.sample.sampleName,
    sampleType: row.sample.sampleType,
    requestCode: row.sample.request?.requestCode ?? null,
    parameterGroup: row.parameterGroup,
    parameters: parseJsonArray(row.parametersJson),
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    managerId: row.managerId,
    managerName: row.managerName,
    managerTitle: row.managerTitle,
    dueDate: row.dueDate.toISOString(),
    status: row.status,
    note: row.note,
  };
}

export function mapWorklistView(
  row: AnalysisWorklist & { taskLinks?: { task: AnalysisTask }[] },
): WorklistView {
  const tasks = (row.taskLinks ?? []).map((l) => mapAnalysisTaskView(l.task));
  return {
    id: row.id,
    worklistCode: row.worklistCode,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    methodId: row.methodId,
    methodName: row.methodName,
    methodVersion: row.methodVersion,
    equipmentId: row.equipmentId,
    equipmentName: row.equipmentName,
    analystId: row.analystId,
    analystName: row.analystName,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    taskCount: tasks.length,
    tasks,
  };
}

export function mapWorksheetView(
  row: AnalysisWorksheet & {
    worklist?: { worklistCode: string };
    chemicals?: { chemicalId: string }[];
    standards?: { standardId: string }[];
    crms?: { standardId: string }[];
  },
): WorksheetView {
  return {
    id: row.id,
    worksheetCode: row.worksheetCode,
    worklistId: row.worklistId,
    worklistCode: row.worklist?.worklistCode ?? "",
    methodId: row.methodId,
    methodName: row.methodName,
    methodVersion: row.methodVersion,
    equipmentId: row.equipmentId,
    equipmentName: row.equipmentName,
    analystId: row.analystId,
    analystName: row.analystName,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    conditionNote: row.conditionNote,
    qcSamples: parseJsonArray(row.qcSamplesJson),
    chemicalIds: row.chemicals?.map((c) => c.chemicalId) ?? [],
    standardIds: row.standards?.map((s) => s.standardId) ?? [],
    crmIds: row.crms?.map((c) => c.standardId) ?? [],
    status: row.status,
    note: row.note,
  };
}

export function mapTestResultView(
  row: TestResult & { task?: AnalysisTask },
): TestResultView {
  return {
    id: row.id,
    taskId: row.taskId,
    sampleId: row.sampleId,
    sampleCode: row.sampleCode,
    parameterName: row.parameterName,
    parameterGroup: row.task?.parameterGroup ?? "",
    departmentName: row.task?.departmentName ?? "",
    resultValue: row.resultValue,
    unit: row.unit,
    lod: row.lod,
    loq: row.loq,
    limitValue: row.limitValue,
    evaluation: row.evaluation,
    analystName: row.analystName,
    enteredAt: row.enteredAt?.toISOString() ?? null,
    status: row.status,
    note: row.note,
  };
}

export function mapQcCheckView(row: QcCheck): QcCheckView {
  return {
    id: row.id,
    worksheetId: row.worksheetId,
    taskId: row.taskId,
    checkType: row.checkType,
    status: row.status,
    expectedValue: row.expectedValue ?? "",
    measuredValue: row.measuredValue ?? "",
    recoveryPercent: row.recoveryPercent ?? "",
    overrideReason: row.overrideReason ?? "",
    note: row.note,
    checkedBy: row.checkedBy,
    checkedAt: row.checkedAt.toISOString(),
  };
}
