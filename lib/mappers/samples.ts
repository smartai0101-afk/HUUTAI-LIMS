import type {
  AnalysisAssignment,
  Sample,
  SampleAuditLog,
  SampleConditionOnReceipt,
  SampleCustodyEvent,
  SampleRequest,
  SampleRequestMethod,
  SampleRequestTest,
  SampleStatus,
  SampleStorageRecord,
  SampleTest,
  SampleTestChemical,
  SampleTestStandard,
  SampleTestStatus,
} from "@prisma/client";
import { isSampleOverdue } from "@/lib/services/samples/sample-workflow";
import { mapAnalysisAssignmentView } from "@/lib/services/samples/analysis-assignment";
import type {
  SampleAuditEntry,
  SampleCustodyEntry,
  SampleDetailView,
  SampleListItem,
  SampleRequestDetailView,
  SampleRequestListItem,
  SampleStorageView,
  SampleTestView,
} from "@/types/samples";

type SampleWithRelations = Sample & {
  primaryMethod?: { methodCode: string; methodName: string; currentVersion?: { version: number } | null } | null;
  primaryMethodVersion?: { version: number } | null;
  request?: { requestCode: string } | null;
  chemicalReference?: { name: string; casNumber: string } | null;
  tests?: (SampleTest & {
    method?: { methodCode: string; methodName: string } | null;
    methodVersion?: { version: number } | null;
    equipment?: { code: string; name: string } | null;
    chemicals?: SampleTestChemical[];
    standards?: SampleTestStandard[];
  })[];
  analysisAssignments?: AnalysisAssignment[];
};

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function mapSampleListItem(row: SampleWithRelations): SampleListItem {
  return {
    id: row.id,
    sampleCode: row.sampleCode,
    sampleName: row.sampleName,
    sampleType: row.sampleType,
    receivedAt: row.receivedAt.toISOString(),
    receivedBy: row.receivedBy,
    status: row.status,
    methodName: row.primaryMethod?.methodName ?? (row.needsMethodAssignment ? "Cần chỉ định phương pháp" : ""),
    methodCode: row.primaryMethod?.methodCode ?? "",
    assignedTo: row.assignedTo,
    dueDate: iso(row.dueDate),
    isOverdue: isSampleOverdue(row.dueDate, row.status),
    needsMethodAssignment: row.needsMethodAssignment,
  };
}

export function mapSampleTestView(
  row: SampleTest & {
    method?: { methodCode: string; methodName: string } | null;
    methodVersion?: { version: number } | null;
    equipment?: { code: string; name: string } | null;
    chemicals?: SampleTestChemical[];
    standards?: SampleTestStandard[];
  },
  warnings: string[] = [],
): SampleTestView {
  return {
    id: row.id,
    parameterName: row.parameterName,
    methodId: row.methodId,
    methodCode: row.method?.methodCode ?? null,
    methodName: row.method?.methodName ?? null,
    methodVersion: row.methodVersion?.version ?? null,
    equipmentId: row.equipmentId,
    equipmentCode: row.equipment?.code ?? null,
    equipmentName: row.equipment?.name ?? null,
    assignedTo: row.assignedTo,
    status: row.status,
    dueDate: iso(row.dueDate),
    note: row.note,
    chemicalIds: row.chemicals?.map((c) => c.chemicalId) ?? [],
    standardIds: row.standards?.map((s) => s.standardId) ?? [],
    warnings,
  };
}

export function mapSampleDetail(row: SampleWithRelations, testWarnings: Record<string, string[]> = {}): SampleDetailView {
  return {
    id: row.id,
    sampleCode: row.sampleCode,
    customerSampleCode: row.customerSampleCode,
    requestId: row.requestId,
    requestCode: row.request?.requestCode ?? null,
    sampleName: row.sampleName,
    sampleType: row.sampleType,
    receivedAt: row.receivedAt.toISOString(),
    deliveredBy: row.deliveredBy,
    receivedBy: row.receivedBy,
    conditionOnReceipt: row.conditionOnReceipt,
    conditionNote: row.conditionNote,
    quantity: row.quantity,
    unit: row.unit,
    containerType: row.containerType,
    preservationCondition: row.preservationCondition,
    storageLocation: row.storageLocation,
    retentionUntil: iso(row.retentionUntil),
    status: row.status,
    assignedTo: row.assignedTo,
    dueDate: iso(row.dueDate),
    note: row.note,
    needsMethodAssignment: row.needsMethodAssignment,
    primaryMethodId: row.primaryMethodId,
    primaryMethodCode: row.primaryMethod?.methodCode ?? null,
    primaryMethodName: row.primaryMethod?.methodName ?? null,
    primaryMethodVersion: row.primaryMethodVersion?.version ?? row.primaryMethod?.currentVersion?.version ?? null,
    chemicalReferenceId: row.chemicalReferenceId,
    chemicalReferenceName: row.chemicalReference?.name ?? null,
    chemicalReferenceCas: row.chemicalReference?.casNumber ?? null,
    tests: (row.tests ?? []).map((t) => mapSampleTestView(t, testWarnings[t.id] ?? [])),
    analysisAssignments: (row.analysisAssignments ?? []).map((a) =>
      mapAnalysisAssignmentView({
        ...a,
        sample: { sampleCode: row.sampleCode, sampleName: row.sampleName },
      }),
    ),
    isOverdue: isSampleOverdue(row.dueDate, row.status),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type RequestWithRelations = SampleRequest & {
  requestedTests?: SampleRequestTest[];
  methods?: (SampleRequestMethod & {
    method: { methodCode: string; methodName: string };
    methodVersion?: { version: number } | null;
  })[];
  _count?: { samples: number };
};

export function mapSampleRequestListItem(row: RequestWithRelations): SampleRequestListItem {
  return {
    id: row.id,
    requestCode: row.requestCode,
    requestDate: row.requestDate.toISOString(),
    requesterName: row.requesterName,
    customerName: row.customerName,
    department: row.department,
    sampleType: row.sampleType,
    sampleCount: row.sampleCount,
    status: row.status,
    dueDate: iso(row.dueDate),
    testCount: row.requestedTests?.length ?? 0,
    methodCount: row.methods?.length ?? 0,
  };
}

export function mapSampleRequestDetail(row: RequestWithRelations): SampleRequestDetailView {
  return {
    id: row.id,
    requestCode: row.requestCode,
    requestDate: row.requestDate.toISOString(),
    requesterName: row.requesterName,
    customerName: row.customerName,
    department: row.department,
    purpose: row.purpose,
    sampleType: row.sampleType,
    sampleCount: row.sampleCount,
    status: row.status,
    dueDate: iso(row.dueDate),
    note: row.note,
    priority: row.priority,
    requestedTests: row.requestedTests?.map((t) => t.parameterName) ?? [],
    methods:
      row.methods?.map((m) => ({
        methodId: m.methodId,
        methodCode: m.method.methodCode,
        methodName: m.method.methodName,
        version: m.methodVersion?.version ?? null,
      })) ?? [],
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapSampleAuditEntry(row: SampleAuditLog): SampleAuditEntry {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    changedBy: row.changedBy,
    changedAt: row.changedAt.toISOString(),
    before: JSON.parse(row.beforeJson || "{}"),
    after: JSON.parse(row.afterJson || "{}"),
  };
}

export function mapSampleCustodyEntry(row: SampleCustodyEvent): SampleCustodyEntry {
  return {
    id: row.id,
    action: row.action,
    fromPerson: row.fromPerson,
    toPerson: row.toPerson,
    location: row.location,
    note: row.note,
    performedBy: row.performedBy,
    performedAt: row.performedAt.toISOString(),
  };
}

export function mapSampleStorageView(row: SampleStorageRecord): SampleStorageView {
  return {
    id: row.id,
    storageLocation: row.storageLocation,
    preservationCondition: row.preservationCondition,
    storedAt: row.storedAt.toISOString(),
    retentionUntil: iso(row.retentionUntil),
    storedBy: row.storedBy,
    disposedBy: row.disposedBy,
    disposedAt: iso(row.disposedAt),
    disposeReason: row.disposeReason,
  };
}
