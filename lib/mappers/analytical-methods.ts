import type { MethodVersionStatus } from "@prisma/client";
import { buildAnalyteCache } from "@/lib/catalog/test-method-label";
import { matrixDisplayLabel } from "@/lib/catalog/matrix-label";
import { toDateString } from "@/lib/mappers";
import type {
  AnalyticalMethodDetail,
  AnalyticalMethodListItem,
  MethodApprovalView,
  MethodDocumentView,
  MethodEquipmentView,
  MethodQCRequirementView,
  MethodAcceptanceCriteriaView,
  MethodReagentView,
  MethodSafetyNoteView,
  MethodVersionView,
  MethodWorkflowView,
  WorkflowEdgeView,
  WorkflowNodeView,
} from "@/types/analytical-methods";

export function mapMethodVersion(row: {
  id: string;
  methodId: string;
  version: number;
  status: MethodVersionStatus;
  effectiveDate: Date | null;
  reviewDate: Date | null;
  changeLog: string;
  createdBy: string;
  reviewerId: string;
  approverId: string;
  approvedAt: Date | null;
  estimatedDurationMinutes: number | null;
}): MethodVersionView {
  return {
    id: row.id,
    methodId: row.methodId,
    version: row.version,
    status: row.status,
    effectiveDate: row.effectiveDate ? toDateString(row.effectiveDate) : null,
    reviewDate: row.reviewDate ? toDateString(row.reviewDate) : null,
    changeLog: row.changeLog,
    createdBy: row.createdBy,
    reviewerId: row.reviewerId,
    approverId: row.approverId,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
  };
}

type MethodMatrixSummary = {
  id: string;
  code: string;
  name: string;
  groupName: string;
};

function mapMethodMatricesFields(methodMatrices: { matrix: MethodMatrixSummary }[]) {
  const matrices = methodMatrices.map((link) => link.matrix);
  const matrixIds = matrices.map((m) => m.id);
  const matrixName =
    matrices.length > 0
      ? matrices.map((m) => matrixDisplayLabel(m)).join(", ")
      : null;
  return { matrixIds, matrices, matrixName };
}

type MethodTestMethodSummary = {
  id: string;
  code: string;
  name: string;
  category: { name: string };
};

function mapMethodTestMethodsFields(
  methodTestMethods: { testMethod: MethodTestMethodSummary }[],
) {
  const testMethods = methodTestMethods.map((link) => ({
    id: link.testMethod.id,
    code: link.testMethod.code,
    name: link.testMethod.name,
    categoryName: link.testMethod.category.name,
  }));
  const testMethodIds = testMethods.map((t) => t.id);
  const analyteName =
    testMethods.length > 0 ? buildAnalyteCache(testMethods) : null;
  return { testMethodIds, testMethods, analyteName };
}

export function mapMethodListItem(row: {
  id: string;
  methodCode: string;
  methodName: string;
  methodMatrices: { matrix: MethodMatrixSummary }[];
  methodTestMethods: { testMethod: MethodTestMethodSummary }[];
  analyte: string;
  technique: string;
  standardRef: string;
  updatedAt: Date;
  currentVersion: {
    version: number;
    status: MethodVersionStatus;
  } | null;
}): AnalyticalMethodListItem {
  return {
    id: row.id,
    methodCode: row.methodCode,
    methodName: row.methodName,
    ...mapMethodMatricesFields(row.methodMatrices),
    ...mapMethodTestMethodsFields(row.methodTestMethods),
    analyte: row.analyte,
    technique: row.technique,
    standardRef: row.standardRef,
    versionStatus: row.currentVersion?.status ?? null,
    version: row.currentVersion?.version ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapMethodDetail(row: {
  id: string;
  methodCode: string;
  methodName: string;
  methodMatrices: { matrix: MethodMatrixSummary }[];
  methodTestMethods: { testMethod: MethodTestMethodSummary }[];
  analyte: string;
  technique: string;
  standardRef: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: Parameters<typeof mapMethodVersion>[0] | null;
  versions: Parameters<typeof mapMethodVersion>[0][];
}): AnalyticalMethodDetail {
  return {
    id: row.id,
    methodCode: row.methodCode,
    methodName: row.methodName,
    ...mapMethodMatricesFields(row.methodMatrices),
    ...mapMethodTestMethodsFields(row.methodTestMethods),
    analyte: row.analyte,
    technique: row.technique,
    standardRef: row.standardRef,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    currentVersion: row.currentVersion ? mapMethodVersion(row.currentVersion) : null,
    versions: row.versions.map(mapMethodVersion),
  };
}

export function mapMethodDocument(row: {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: Date;
  isPrimary: boolean;
}): MethodDocumentView {
  return {
    id: row.id,
    filePath: row.filePath,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSizeBytes: row.fileSizeBytes,
    uploadedBy: row.uploadedBy,
    uploadedAt: row.uploadedAt.toISOString(),
    isPrimary: row.isPrimary,
  };
}

export function mapWorkflowNode(row: {
  id: string;
  nodeKey: string;
  type: WorkflowNodeView["type"];
  label: string;
  description: string;
  positionX: number;
  positionY: number;
  configJson: string;
}): WorkflowNodeView {
  return { ...row };
}

export function mapWorkflowEdge(row: {
  id: string;
  sourceNodeKey: string;
  targetNodeKey: string;
  label: string;
  conditionJson: string;
}): WorkflowEdgeView {
  return { ...row };
}

export function mapMethodWorkflow(row: {
  id: string;
  layoutJson: string;
  sourceType: MethodWorkflowView["sourceType"];
  isDraft: boolean;
  nodes: Parameters<typeof mapWorkflowNode>[0][];
  edges: Parameters<typeof mapWorkflowEdge>[0][];
}): MethodWorkflowView {
  return {
    id: row.id,
    layoutJson: row.layoutJson,
    sourceType: row.sourceType,
    isDraft: row.isDraft,
    nodes: row.nodes.map(mapWorkflowNode),
    edges: row.edges.map(mapWorkflowEdge),
  };
}

export function mapMethodReagent(row: {
  id: string;
  workflowNodeKey: string;
  chemicalId: string | null;
  standardId: string | null;
  nameFreeText: string;
  casNumber: string;
  amountPerSample: number;
  unit: string;
  isConsumable: boolean;
  chemical?: { code: string; name: string } | null;
  standard?: { code: string; name: string } | null;
}): MethodReagentView {
  return {
    id: row.id,
    workflowNodeKey: row.workflowNodeKey,
    chemicalId: row.chemicalId,
    standardId: row.standardId,
    chemicalCode: row.chemical?.code ?? null,
    chemicalName: row.chemical?.name ?? null,
    standardCode: row.standard?.code ?? null,
    standardName: row.standard?.name ?? null,
    nameFreeText: row.nameFreeText,
    casNumber: row.casNumber,
    amountPerSample: row.amountPerSample,
    unit: row.unit,
    isConsumable: row.isConsumable,
  };
}

export function mapMethodEquipment(row: {
  id: string;
  workflowNodeKey: string;
  equipmentId: string;
  role: string;
  equipment: {
    code: string;
    name: string;
    status: string;
    calibrationExpiryDate: Date | null;
  };
  calibrationStatus: string;
}): MethodEquipmentView {
  return {
    id: row.id,
    workflowNodeKey: row.workflowNodeKey,
    equipmentId: row.equipmentId,
    equipmentCode: row.equipment.code,
    equipmentName: row.equipment.name,
    role: row.role,
    calibrationStatus: row.calibrationStatus,
    equipmentStatus: row.equipment.status,
  };
}

export function mapMethodQC(row: {
  id: string;
  qcType: string;
  frequency: string;
  frequencyUnit: string;
  limitsJson: string;
}): MethodQCRequirementView {
  return { ...row };
}

export function mapMethodAcceptance(row: {
  id: string;
  analyte: string;
  criteriaJson: string;
}): MethodAcceptanceCriteriaView {
  return { ...row };
}

export function mapMethodSafetyNote(row: {
  id: string;
  noteType: string;
  content: string;
  chemicalReferenceId: string | null;
  chemicalReference?: { name: string } | null;
}): MethodSafetyNoteView {
  return {
    id: row.id,
    noteType: row.noteType,
    content: row.content,
    chemicalReferenceId: row.chemicalReferenceId,
    chemicalReferenceName: row.chemicalReference?.name ?? null,
  };
}

export function mapMethodApproval(row: {
  id: string;
  action: string;
  fromStatus: MethodVersionStatus;
  toStatus: MethodVersionStatus;
  performedBy: string;
  performedAt: Date;
  comment: string;
}): MethodApprovalView {
  return {
    id: row.id,
    action: row.action,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    performedBy: row.performedBy,
    performedAt: row.performedAt.toISOString(),
    comment: row.comment,
  };
}
