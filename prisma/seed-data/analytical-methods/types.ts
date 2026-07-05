import type { WorkflowNodeType } from "@prisma/client";

export type MethodSeedWorkflowNode = {
  nodeKey: string;
  type: WorkflowNodeType;
  label: string;
  description?: string;
  positionX: number;
  positionY: number;
  configJson?: string;
};

export type MethodSeedWorkflowEdge = {
  sourceNodeKey: string;
  targetNodeKey: string;
  label?: string;
  conditionJson?: string;
};

export type MethodSeedReagent = {
  nameFreeText: string;
  chemicalCode?: string;
  standardCode?: string;
  casNumber?: string;
  amountPerSample: number;
  unit: string;
  isConsumable?: boolean;
  workflowNodeKey?: string;
};

export type MethodSeedEquipment = {
  equipmentCode: string;
  role: string;
  workflowNodeKey?: string;
};

export type MethodSeedQC = {
  qcType: string;
  frequency: string;
  frequencyUnit: string;
  limitsJson?: Record<string, unknown>;
};

export type MethodSeedAcceptance = {
  analyte: string;
  criteriaJson?: Record<string, unknown>;
};

export type MethodSeedSafetyNote = {
  noteType: string;
  content: string;
  casNumber?: string;
};

export type MethodSeedDefinition = {
  methodCode: string;
  methodName: string;
  matrixCodes: string[];
  testMethodCodes: string[];
  analyte: string;
  technique: string;
  standardRef: string;
  estimatedDurationMinutes: number;
  sopMarkdown: string;
  layoutJson: string;
  nodes: MethodSeedWorkflowNode[];
  edges: MethodSeedWorkflowEdge[];
  reagents: MethodSeedReagent[];
  equipment: MethodSeedEquipment[];
  qcRequirements: MethodSeedQC[];
  acceptanceCriteria: MethodSeedAcceptance[];
  safetyNotes: MethodSeedSafetyNote[];
};
