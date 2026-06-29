import type {
  AnalysisTaskStatus,
  QcCheckStatus,
  QcCheckType,
  ResultEvaluation,
  TestResultStatus,
  WorklistStatus,
  WorksheetStatus,
} from "@prisma/client";

export type AnalysisInboxRow = {
  assignmentId: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  sampleType: string;
  requestCode: string | null;
  parameterGroup: string;
  parameters: string[];
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  managerTitle: string;
  dueDate: string;
  status: string;
  note: string;
};

export type AnalysisTaskView = {
  id: string;
  assignmentId: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  parameterGroup: string;
  parameters: string[];
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  analystId: string | null;
  analystName: string;
  internalDueDate: string | null;
  status: AnalysisTaskStatus;
  note: string;
};

export type DepartmentAnalystView = {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  active: boolean;
};

export type WorklistView = {
  id: string;
  worklistCode: string;
  departmentId: string;
  departmentName: string;
  methodId: string | null;
  methodName: string;
  methodVersion: number | null;
  equipmentId: string | null;
  equipmentName: string;
  analystId: string | null;
  analystName: string;
  status: WorklistStatus;
  createdBy: string;
  createdAt: string;
  taskCount: number;
  tasks: AnalysisTaskView[];
};

export type WorksheetView = {
  id: string;
  worksheetCode: string;
  worklistId: string;
  worklistCode: string;
  methodId: string | null;
  methodName: string;
  methodVersion: number | null;
  equipmentId: string | null;
  equipmentName: string;
  analystId: string;
  analystName: string;
  startedAt: string | null;
  completedAt: string | null;
  conditionNote: string;
  qcSamples: string[];
  chemicalIds: string[];
  standardIds: string[];
  crmIds: string[];
  status: WorksheetStatus;
  note: string;
};

export type TestResultView = {
  id: string;
  taskId: string;
  sampleId: string;
  sampleCode: string;
  parameterName: string;
  parameterGroup: string;
  departmentName: string;
  resultValue: string;
  unit: string;
  lod: string;
  loq: string;
  limitValue: string;
  evaluation: ResultEvaluation | null;
  analystName: string;
  enteredAt: string | null;
  status: TestResultStatus;
  note: string;
};

export type QcCheckView = {
  id: string;
  worksheetId: string | null;
  taskId: string | null;
  checkType: QcCheckType;
  status: QcCheckStatus;
  note: string;
  checkedBy: string;
  checkedAt: string;
  sampleCode?: string;
  parameterGroup?: string;
};

export type ReviewRowView = {
  taskId: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  parameterGroup: string;
  parameters: string[];
  departmentName: string;
  analystName: string;
  taskStatus: AnalysisTaskStatus;
  qcStatus: QcCheckStatus | null;
  dueDate: string | null;
  results: TestResultView[];
};
