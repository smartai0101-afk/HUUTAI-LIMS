import { ContainerStatus } from "@prisma/client";
import type {
  AlertItem,
  AuditLogView,
  ChemicalView,
  ContainerView,
  DashboardStats,
  MicrobialStrainView,
  StandardView,
  UsageLogView,
} from "@/types";
import { containerStatusLabel } from "@/lib/container-status";
import { standardStatusLabel } from "@/lib/standard-status";
import { usageSourceLabel } from "@/lib/usage-source";

export function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toDateTimeString(value: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function parseJsonField(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
    if (parsed === null) return "-";
    return String(parsed);
  } catch {
    return value || "-";
  }
}

export function mapAuditLog(log: {
  id: string;
  time: Date;
  user: string;
  action: string;
  object: string;
  beforeJson: string;
  afterJson: string;
}): AuditLogView {
  return {
    id: log.id,
    time: toDateTimeString(log.time),
    user: log.user,
    action: log.action,
    object: log.object,
    before: parseJsonField(log.beforeJson),
    after: parseJsonField(log.afterJson),
  };
}

export function mapChemical(
  chemical: {
    id: string;
    code: string;
    name: string;
    chemicalGroup: string;
    manufacturer: string;
    casNumber: string;
    productCode: string;
    lot: string;
    purity: string;
    uncertainty: string;
    coaPath: string | null;
    unit: string;
    quantity: number;
    expiryDate: Date | null;
    storageCondition: string;
    status: string;
    storageLocation: string;
    notes: string;
    reorderLevel: number;
  },
): ChemicalView {
  return {
    id: chemical.id,
    code: chemical.code,
    name: chemical.name,
    chemicalGroup: chemical.chemicalGroup,
    manufacturer: chemical.manufacturer,
    casNumber: chemical.casNumber,
    productCode: chemical.productCode,
    lot: chemical.lot,
    purity: chemical.purity,
    uncertainty: chemical.uncertainty,
    coaPath: chemical.coaPath ?? "",
    unit: chemical.unit,
    quantity: chemical.quantity,
    expiryDate: chemical.expiryDate ? toDateString(chemical.expiryDate) : "",
    storageCondition: chemical.storageCondition,
    status: standardStatusLabel(chemical.status),
    storageLocation: chemical.storageLocation,
    notes: chemical.notes,
    stockLots: [],
  };
}

export function mapMicrobialStrain(
  strain: {
    id: string;
    code: string;
    name: string;
    strainGroup: string;
    manufacturer: string;
    atccProductCode: string;
    lot: string;
    purity: string;
    uncertainty: string;
    coaPath: string | null;
    unit: string;
    quantity: number;
    expiryDate: Date | null;
    storageCondition: string;
    status: string;
    storageLocation: string;
    notes: string;
  },
): MicrobialStrainView {
  return {
    id: strain.id,
    code: strain.code,
    name: strain.name,
    strainGroup: strain.strainGroup,
    manufacturer: strain.manufacturer,
    atccProductCode: strain.atccProductCode,
    lot: strain.lot,
    purity: strain.purity,
    uncertainty: strain.uncertainty,
    coaPath: strain.coaPath ?? "",
    unit: strain.unit,
    quantity: strain.quantity,
    expiryDate: strain.expiryDate ? toDateString(strain.expiryDate) : "",
    storageCondition: strain.storageCondition,
    status: standardStatusLabel(strain.status),
    storageLocation: strain.storageLocation,
    notes: strain.notes,
    stockLots: [],
  };
}

export function mapStandard(
  standard: {
    id: string;
    code: string;
    name: string;
    standardGroup: string;
    manufacturer: string;
    casNumber: string;
    productCode: string;
    lot: string;
    purity: string;
    uncertainty: string;
    coaPath: string | null;
    unit: string;
    quantity: number;
    expiryDate: Date | null;
    afterOpenExpiry: Date | null;
    storageCondition: string;
    status: string;
    storageLocation: string;
    notes: string;
    containers: unknown[];
  },
): StandardView {
  return {
    id: standard.id,
    code: standard.code,
    name: standard.name,
    standardGroup: standard.standardGroup,
    manufacturer: standard.manufacturer,
    casNumber: standard.casNumber,
    productCode: standard.productCode,
    lot: standard.lot,
    purity: standard.purity,
    uncertainty: standard.uncertainty,
    coaPath: standard.coaPath ?? "",
    unit: standard.unit,
    quantity: standard.quantity,
    expiryDate: standard.expiryDate ? toDateString(standard.expiryDate) : "",
    afterOpenExpiry: standard.afterOpenExpiry ? toDateString(standard.afterOpenExpiry) : "",
    storageCondition: standard.storageCondition,
    status: standardStatusLabel(standard.status),
    storageLocation: standard.storageLocation,
    notes: standard.notes,
    containerCount: standard.containers.length,
    stockLots: [],
  };
}

export function mapContainer(
  container: {
    id: string;
    code: string;
    lot: string;
    location: string;
    quantity: number;
    unit: string;
    expiryDate: Date;
    afterOpenExpiry: Date | null;
    status: ContainerStatus;
    chemicalId: string | null;
    standardId: string | null;
    chemical: { id: string; code: string; name: string; reorderLevel: number } | null;
    standard: { id: string; code: string; name: string } | null;
  },
): ContainerView {
  const itemType = container.chemicalId ? "chemical" : "standard";
  const item = container.chemical ?? container.standard!;

  return {
    id: container.id,
    code: container.code,
    itemType,
    itemCode: item.code,
    itemName: item.name,
    lot: container.lot,
    location: container.location,
    quantity: container.quantity,
    unit: container.unit,
    expiryDate: toDateString(container.expiryDate),
    afterOpenExpiry: container.afterOpenExpiry ? toDateString(container.afterOpenExpiry) : undefined,
    status: containerStatusLabel(container.status),
    chemicalId: container.chemicalId ?? undefined,
    standardId: container.standardId ?? undefined,
  };
}

export function mapUsageLog(
  log: {
    id: string;
    date: Date;
    type: string;
    sourceType: string;
    sourceId: string;
    containerId?: string | null;
    quantity: number;
    unit: string;
    performedBy: string;
    performedByStaffId?: string | null;
    purpose: string;
    notes: string;
    referenceCode?: string;
    itemCode?: string;
    itemName?: string;
    containerCode?: string;
    container?: {
      code: string;
      chemical: { code: string; name: string } | null;
      standard: { code: string; name: string } | null;
    } | null;
  },
): UsageLogView {
  const fallbackItem = log.container?.chemical ?? log.container?.standard ?? { code: "—", name: "—" };

  return {
    id: log.id,
    date: toDateString(log.date),
    type: log.type,
    sourceType: log.sourceType,
    sourceLabel: usageSourceLabel(log.sourceType as "Chemical" | "Standard" | "MicrobialStrain"),
    sourceId: log.sourceId,
    itemCode: log.itemCode ?? fallbackItem.code,
    itemName: log.itemName ?? fallbackItem.name,
    containerId: log.containerId ?? undefined,
    containerCode: log.containerCode ?? log.container?.code,
    quantity: log.quantity,
    unit: log.unit,
    performedBy: log.performedBy,
    performedByStaffId: log.performedByStaffId ?? undefined,
    purpose: log.purpose,
    notes: log.notes,
    referenceCode: log.referenceCode ?? "",
  };
}

export type { AlertItem, DashboardStats };
