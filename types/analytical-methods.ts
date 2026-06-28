import type {
  MethodExecutionStatus,
  MethodExecutionStepStatus,
  MethodVersionStatus,
  WorkflowNodeType,
  WorkflowSourceType,
} from "@prisma/client";

export type AnalyticalMethodListItem = {
  id: string;
  methodCode: string;
  methodName: string;
  matrix: string;
  analyte: string;
  technique: string;
  standardRef: string;
  versionStatus: MethodVersionStatus | null;
  version: number | null;
  updatedAt: string;
};

export type MethodVersionView = {
  id: string;
  methodId: string;
  version: number;
  status: MethodVersionStatus;
  effectiveDate: string | null;
  reviewDate: string | null;
  changeLog: string;
  createdBy: string;
  reviewerId: string;
  approverId: string;
  approvedAt: string | null;
  estimatedDurationMinutes: number | null;
};

export type AnalyticalMethodDetail = {
  id: string;
  methodCode: string;
  methodName: string;
  matrix: string;
  analyte: string;
  technique: string;
  standardRef: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: MethodVersionView | null;
  versions: MethodVersionView[];
};

export type MethodDocumentView = {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  isPrimary: boolean;
};

export type WorkflowNodeView = {
  id: string;
  nodeKey: string;
  type: WorkflowNodeType;
  label: string;
  description: string;
  positionX: number;
  positionY: number;
  configJson: string;
};

export type WorkflowEdgeView = {
  id: string;
  sourceNodeKey: string;
  targetNodeKey: string;
  label: string;
  conditionJson: string;
};

export type MethodWorkflowView = {
  id: string;
  layoutJson: string;
  sourceType: WorkflowSourceType;
  isDraft: boolean;
  nodes: WorkflowNodeView[];
  edges: WorkflowEdgeView[];
};

export type MethodReagentView = {
  id: string;
  workflowNodeKey: string;
  chemicalId: string | null;
  standardId: string | null;
  chemicalCode: string | null;
  chemicalName: string | null;
  standardCode: string | null;
  standardName: string | null;
  nameFreeText: string;
  casNumber: string;
  amountPerSample: number;
  unit: string;
  isConsumable: boolean;
};

export type MethodEquipmentView = {
  id: string;
  workflowNodeKey: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  role: string;
  calibrationStatus: string;
  equipmentStatus: string;
};

export type MethodQCRequirementView = {
  id: string;
  qcType: string;
  frequency: string;
  frequencyUnit: string;
  limitsJson: string;
};

export type MethodAcceptanceCriteriaView = {
  id: string;
  analyte: string;
  criteriaJson: string;
};

export type MethodSafetyNoteView = {
  id: string;
  noteType: string;
  content: string;
  chemicalReferenceId: string | null;
  chemicalReferenceName: string | null;
};

export type MethodApprovalView = {
  id: string;
  action: string;
  fromStatus: MethodVersionStatus;
  toStatus: MethodVersionStatus;
  performedBy: string;
  performedAt: string;
  comment: string;
};

export type ChecklistItemView = {
  stepOrder: number;
  stepName: string;
  instruction: string;
  requiredInput: string;
  expectedResult: string;
  nodeType: WorkflowNodeType;
  workflowNodeKey: string;
};

export type ReagentCalculationRow = {
  id: string;
  name: string;
  amountPerSample: number;
  unit: string;
  totalAmount: number;
  stockAvailable: number | null;
  stockUnit: string | null;
  sufficient: boolean | null;
  warning: string | null;
};

export type MethodExecutionView = {
  id: string;
  methodVersionId: string;
  methodCode: string;
  methodName: string;
  version: number;
  sampleCount: number;
  status: MethodExecutionStatus;
  startedBy: string;
  startedAt: string;
  completedAt: string | null;
  steps: MethodExecutionStepView[];
};

export type MethodExecutionStepView = {
  id: string;
  stepOrder: number;
  stepName: string;
  instruction: string;
  requiredInput: string;
  expectedResult: string;
  operator: string;
  timestamp: string | null;
  status: MethodExecutionStepStatus;
  comment: string;
  workflowNodeKey: string;
};

export type MethodDashboardStats = {
  totalMethods: number;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  obsoleteCount: number;
};

export type AiExtractionResult = {
  nodes: Array<{
    nodeKey: string;
    type: WorkflowNodeType;
    label: string;
    description: string;
    positionX: number;
    positionY: number;
    configJson?: Record<string, unknown>;
  }>;
  edges: Array<{
    sourceNodeKey: string;
    targetNodeKey: string;
    label?: string;
    conditionJson?: Record<string, unknown>;
  }>;
  reagents: Array<{
    nameFreeText: string;
    casNumber?: string;
    amountPerSample: number;
    unit: string;
    isConsumable?: boolean;
  }>;
  equipment: Array<{ nameFreeText: string; role?: string }>;
  qcRequirements: Array<{
    qcType: string;
    frequency: string;
    frequencyUnit: string;
    limitsJson?: Record<string, unknown>;
  }>;
  acceptanceCriteria: Array<{ analyte: string; criteriaJson?: Record<string, unknown> }>;
  safetyNotes: Array<{ noteType: string; content: string }>;
};
