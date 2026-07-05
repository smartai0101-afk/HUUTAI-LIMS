import type {
  AnalysisAssignmentStatus,
  SampleConditionOnReceipt,
  SampleRequestStatus,
  SampleStatus,
  SampleTestStatus,
} from "@prisma/client";

export type SampleListItem = {
  id: string;
  sampleCode: string;
  sampleName: string;
  sampleType: string;
  receivedAt: string;
  receivedBy: string;
  status: SampleStatus;
  methodName: string;
  methodCode: string;
  assignedTo: string;
  dueDate: string | null;
  isOverdue: boolean;
  needsMethodAssignment: boolean;
};

export type SampleDetailView = {
  id: string;
  sampleCode: string;
  customerSampleCode: string;
  requestId: string | null;
  requestCode: string | null;
  sampleName: string;
  sampleType: string;
  receivedAt: string;
  deliveredBy: string;
  receivedBy: string;
  conditionOnReceipt: SampleConditionOnReceipt;
  conditionNote: string;
  quantity: number | null;
  unit: string;
  containerType: string;
  preservationCondition: string;
  storageLocation: string;
  retentionUntil: string | null;
  status: SampleStatus;
  assignedTo: string;
  dueDate: string | null;
  note: string;
  needsMethodAssignment: boolean;
  primaryMethodId: string | null;
  primaryMethodCode: string | null;
  primaryMethodName: string | null;
  primaryMethodVersion: number | null;
  chemicalReferenceId: string | null;
  chemicalReferenceName: string | null;
  chemicalReferenceCas: string | null;
  tests: SampleTestView[];
  analysisAssignments: AnalysisAssignmentView[];
  isOverdue: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SampleTestView = {
  id: string;
  parameterName: string;
  methodId: string | null;
  methodCode: string | null;
  methodName: string | null;
  methodVersion: number | null;
  equipmentId: string | null;
  equipmentCode: string | null;
  equipmentName: string | null;
  assignedTo: string;
  status: SampleTestStatus;
  dueDate: string | null;
  note: string;
  chemicalIds: string[];
  standardIds: string[];
  warnings: string[];
};

export type AnalysisAssignmentView = {
  id: string;
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  parameterGroup: string;
  parameters: string[];
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName: string;
  managerTitle: string;
  assignedBy: string;
  assignedAt: string;
  dueDate: string;
  status: AnalysisAssignmentStatus;
  note: string;
};

export type LabDepartmentView = {
  id: string;
  name: string;
  sortOrder: number;
  managers: {
    id: string;
    name: string;
    title: string;
    isDefault: boolean;
  }[];
};

export type SampleAssignmentContext = {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  parameterPool: string[];
  assignments: AnalysisAssignmentView[];
};

export type SampleRequestListItem = {
  id: string;
  requestCode: string;
  requestDate: string;
  requesterName: string;
  customerName: string;
  department: string;
  sampleType: string;
  sampleCount: number;
  status: SampleRequestStatus;
  dueDate: string | null;
  testCount: number;
  methodCount: number;
};

export type SampleRequestDetailView = {
  id: string;
  requestCode: string;
  requestDate: string;
  requesterName: string;
  customerName: string;
  department: string;
  purpose: string;
  sampleType: string;
  sampleCount: number;
  status: SampleRequestStatus;
  dueDate: string | null;
  note: string;
  priority?: string;
  requestedTests: string[];
  methods: { methodId: string; methodCode: string; methodName: string; version: number | null }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SampleAuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  changedAt: string;
  before: unknown;
  after: unknown;
};

export type SampleCustodyEntry = {
  id: string;
  action: string;
  fromPerson: string;
  toPerson: string;
  location: string;
  note: string;
  performedBy: string;
  performedAt: string;
};

export type SampleStorageView = {
  id: string;
  storageLocation: string;
  preservationCondition: string;
  storedAt: string;
  retentionUntil: string | null;
  storedBy: string;
  disposedBy: string;
  disposedAt: string | null;
  disposeReason: string;
};

export type MethodOption = {
  id: string;
  methodCode: string;
  methodName: string;
  versionId: string | null;
  version: number | null;
  versionStatus: string | null;
};
