import type {
  CalibrationPlan,
  CalibrationRecord,
  Equipment,
  EquipmentAttachment,
  EquipmentDisposal,
  EquipmentHistoryEvent,
  EquipmentSparePartLink,
  MaintenanceLog,
  MaintenancePlan,
  PostCalibrationEvaluation,
  RepairProposal,
  SparePart,
} from "@prisma/client";
import {
  formatCalibrationResults,
  formatEvaluationSummary,
  resolveCalibrationResults,
} from "@/lib/calibration-results";
import {
  CALIBRATION_RESULT_LABELS,
  DISPOSAL_STATUS_LABELS,
  EQUIPMENT_STATUS_LABELS,
  EVALUATION_STATUS_LABELS,
  REPAIR_PRIORITY_LABELS,
  REPAIR_STATUS_LABELS,
  equipmentStatusLabel,
} from "@/lib/equipment-fields";
import { historyEventTypeLabel, isAutoSyncedHistory } from "@/lib/equipment-history";
import { mergeHistoryEventMedia, type SourceMediaBatch } from "@/lib/equipment-history-media";
import { scheduleStatusLabel } from "@/lib/equipment-schedule";
import { toDateString } from "@/lib/mappers";
import type {
  CalibrationPlanView,
  CalibrationRecordView,
  EquipmentDisposalView,
  EquipmentHistoryEventView,
  EquipmentView,
  MaintenanceLogView,
  MaintenancePlanView,
  PostCalibrationEvaluationView,
  RepairProposalView,
  SparePartEquipmentLinkView,
  SparePartView,
} from "@/types";

type EquipmentRef = Pick<Equipment, "id" | "code" | "name">;

function optionalDate(value: Date | null | undefined): string {
  return value ? toDateString(value) : "";
}

function parseAttachmentPaths(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return raw ? [raw] : [];
}

export function mapEquipment(equipment: Equipment): EquipmentView {
  return {
    id: equipment.id,
    code: equipment.code,
    name: equipment.name,
    model: equipment.model,
    serialNumber: equipment.serialNumber,
    specifications: equipment.specifications,
    manufacturer: equipment.manufacturer,
    countryOfOrigin: equipment.countryOfOrigin,
    manufacturingYear: equipment.manufacturingYear,
    purchaseDate: optionalDate(equipment.purchaseDate),
    commissioningDate: optionalDate(equipment.commissioningDate),
    lastCalibrationDate: optionalDate(equipment.lastCalibrationDate),
    calibrator: equipment.calibrator,
    calibrationExpiryDate: optionalDate(equipment.calibrationExpiryDate),
    department: equipment.department,
    location: equipment.location,
    manager: equipment.manager,
    status: equipmentStatusLabel(equipment.status),
    installDate: optionalDate(equipment.installDate),
    iqOqPqNotes: equipment.iqOqPqNotes,
    userManualPath: equipment.userManualPath ?? "",
    createdBy: equipment.createdBy,
    updatedBy: equipment.updatedBy,
    createdAt: optionalDate(equipment.createdAt),
    updatedAt: optionalDate(equipment.updatedAt),
  };
}

export function mapCalibrationPlan(
  plan: CalibrationPlan & { equipment: EquipmentRef },
): CalibrationPlanView {
  return {
    id: plan.id,
    equipmentId: plan.equipmentId,
    equipmentCode: plan.equipment.code,
    equipmentName: plan.equipment.name,
    name: plan.name,
    cycleMonths: plan.cycleMonths,
    lastDate: optionalDate(plan.lastDate),
    nextDate: optionalDate(plan.nextDate),
    vendor: plan.vendor,
    status: plan.status,
    statusLabel: scheduleStatusLabel(plan.status),
    notes: plan.notes,
    createdBy: plan.createdBy,
    updatedBy: plan.updatedBy,
    createdAt: optionalDate(plan.createdAt),
    updatedAt: optionalDate(plan.updatedAt),
  };
}

export function mapCalibrationRecord(
  record: CalibrationRecord & {
    equipment: EquipmentRef;
    evaluation?: PostCalibrationEvaluation | null;
  },
): CalibrationRecordView {
  const calibrationResults = resolveCalibrationResults(record.calibrationResults, record.deviation);
  return {
    id: record.id,
    equipmentId: record.equipmentId,
    equipmentCode: record.equipment.code,
    equipmentName: record.equipment.name,
    calibrationDate: toDateString(record.calibrationDate),
    certificateNo: record.certificateNo,
    result: record.result,
    resultLabel: CALIBRATION_RESULT_LABELS[record.result],
    deviation: record.deviation,
    calibrationResults,
    calibrationResultsLabel: formatCalibrationResults(calibrationResults),
    evaluationSummary: formatEvaluationSummary(calibrationResults),
    certificatePath: record.certificatePath ?? "",
    cost: record.cost,
    vendor: record.vendor,
    notes: record.notes,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: optionalDate(record.createdAt),
    updatedAt: optionalDate(record.updatedAt),
    hasEvaluation: !!record.evaluation,
  };
}

export function mapPostCalibrationEvaluation(
  evaluation: PostCalibrationEvaluation & {
    equipment: EquipmentRef;
    calibrationRecord: Pick<CalibrationRecord, "calibrationDate" | "certificateNo">;
  },
): PostCalibrationEvaluationView {
  return {
    id: evaluation.id,
    equipmentId: evaluation.equipmentId,
    equipmentCode: evaluation.equipment.code,
    equipmentName: evaluation.equipment.name,
    calibrationRecordId: evaluation.calibrationRecordId,
    calibrationDate: toDateString(evaluation.calibrationRecord.calibrationDate),
    certificateNo: evaluation.calibrationRecord.certificateNo,
    impactAssessment: evaluation.impactAssessment,
    correctiveAction: evaluation.correctiveAction,
    status: evaluation.status,
    statusLabel: EVALUATION_STATUS_LABELS[evaluation.status],
    approvedBy: evaluation.approvedBy,
    notes: evaluation.notes,
    createdBy: evaluation.createdBy,
    updatedBy: evaluation.updatedBy,
    createdAt: optionalDate(evaluation.createdAt),
    updatedAt: optionalDate(evaluation.updatedAt),
  };
}

export function mapMaintenancePlan(
  plan: MaintenancePlan & { equipment: EquipmentRef },
): MaintenancePlanView {
  return {
    id: plan.id,
    equipmentId: plan.equipmentId,
    equipmentCode: plan.equipment.code,
    equipmentName: plan.equipment.name,
    name: plan.name,
    cycleMonths: plan.cycleMonths,
    lastDate: optionalDate(plan.lastDate),
    nextDate: optionalDate(plan.nextDate),
    vendor: plan.vendor,
    status: plan.status,
    statusLabel: scheduleStatusLabel(plan.status),
    notes: plan.notes,
    createdBy: plan.createdBy,
    updatedBy: plan.updatedBy,
    createdAt: optionalDate(plan.createdAt),
    updatedAt: optionalDate(plan.updatedAt),
  };
}

export function mapMaintenanceLog(
  log: MaintenanceLog & {
    equipment: EquipmentRef;
    repairProposal?: Pick<RepairProposal, "ticketNo"> | null;
  },
): MaintenanceLogView {
  return {
    id: log.id,
    equipmentId: log.equipmentId,
    equipmentCode: log.equipment.code,
    equipmentName: log.equipment.name,
    repairProposalId: log.repairProposalId ?? "",
    repairTicketNo: log.repairProposal?.ticketNo ?? "",
    issueDate: toDateString(log.issueDate),
    description: log.description,
    rootCause: log.rootCause,
    action: log.action,
    vendor: log.vendor,
    cost: log.cost,
    completedDate: optionalDate(log.completedDate),
    attachmentPaths: parseAttachmentPaths(log.attachmentPaths),
    notes: log.notes,
    createdBy: log.createdBy,
    updatedBy: log.updatedBy,
    createdAt: optionalDate(log.createdAt),
    updatedAt: optionalDate(log.updatedAt),
  };
}

export function mapRepairProposal(
  proposal: RepairProposal & { equipment: EquipmentRef },
): RepairProposalView {
  return {
    id: proposal.id,
    equipmentId: proposal.equipmentId,
    equipmentCode: proposal.equipment.code,
    equipmentName: proposal.equipment.name,
    ticketNo: proposal.ticketNo,
    priority: proposal.priority,
    priorityLabel: REPAIR_PRIORITY_LABELS[proposal.priority],
    status: proposal.status,
    statusLabel: REPAIR_STATUS_LABELS[proposal.status],
    description: proposal.description,
    reportedBy: proposal.reportedBy,
    notes: proposal.notes,
    createdBy: proposal.createdBy,
    updatedBy: proposal.updatedBy,
    createdAt: optionalDate(proposal.createdAt),
    updatedAt: optionalDate(proposal.updatedAt),
  };
}

export function mapSparePartLink(
  link: EquipmentSparePartLink & { equipment: EquipmentRef },
): SparePartEquipmentLinkView {
  return {
    id: link.id,
    equipmentId: link.equipmentId,
    equipmentCode: link.equipment.code,
    equipmentName: link.equipment.name,
    notes: link.notes,
  };
}

export function mapSparePart(
  part: SparePart & {
    equipmentLinks?: (EquipmentSparePartLink & { equipment: EquipmentRef })[];
  },
): SparePartView {
  const links = part.equipmentLinks ?? [];
  return {
    id: part.id,
    code: part.code,
    name: part.name,
    manufacturer: part.manufacturer,
    productCode: part.productCode,
    lotNumber: part.lotNumber,
    stockQty: part.stockQty,
    minQty: part.minQty,
    unit: part.unit,
    notes: part.notes,
    isLowStock: part.stockQty <= part.minQty,
    equipmentLinks: links.map(mapSparePartLink),
    createdBy: part.createdBy,
    updatedBy: part.updatedBy,
    createdAt: optionalDate(part.createdAt),
    updatedAt: optionalDate(part.updatedAt),
  };
}

export function mapEquipmentDisposal(
  disposal: EquipmentDisposal & { equipment: EquipmentRef },
): EquipmentDisposalView {
  return {
    id: disposal.id,
    equipmentId: disposal.equipmentId,
    equipmentCode: disposal.equipment.code,
    equipmentName: disposal.equipment.name,
    disposalDate: toDateString(disposal.disposalDate),
    residualValue: disposal.residualValue,
    decision: disposal.decision,
    approver: disposal.approver,
    documentPath: disposal.documentPath ?? "",
    status: disposal.status,
    statusLabel: DISPOSAL_STATUS_LABELS[disposal.status],
    notes: disposal.notes,
    createdBy: disposal.createdBy,
    updatedBy: disposal.updatedBy,
    createdAt: optionalDate(disposal.createdAt),
    updatedAt: optionalDate(disposal.updatedAt),
  };
}

export function mapEquipmentHistoryEvent(
  event: EquipmentHistoryEvent & { equipment: EquipmentRef },
  media?: { batch: SourceMediaBatch; historyAttachments: EquipmentAttachment[] },
): EquipmentHistoryEventView {
  const { images, otherFiles } = media
    ? mergeHistoryEventMedia(event, media.batch, media.historyAttachments)
    : { images: [], otherFiles: [] };

  return {
    id: event.id,
    equipmentId: event.equipmentId,
    equipmentCode: event.equipment.code,
    equipmentName: event.equipment.name,
    eventType: event.eventType,
    eventTypeLabel: historyEventTypeLabel(event.eventType),
    eventDate: toDateString(event.eventDate),
    title: event.title,
    description: event.description,
    sourceType: event.sourceType,
    sourceId: event.sourceId ?? "",
    isAutoSynced: isAutoSyncedHistory(event.sourceType),
    createdBy: event.createdBy,
    updatedBy: event.updatedBy,
    createdAt: optionalDate(event.createdAt),
    updatedAt: optionalDate(event.updatedAt),
    images,
    otherFiles,
  };
}

export { EQUIPMENT_STATUS_LABELS };
