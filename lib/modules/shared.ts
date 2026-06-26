import { InventoryItemStatus, PreparedStandardLevel } from "@prisma/client";

export const STATUS_LABELS: Record<InventoryItemStatus, string> = {
  Available: "Available",
  LowStock: "Low Stock",
  Expired: "Expired",
  PendingDisposal: "Pending Disposal",
  PendingReview: "Pending Review",
  InUse: "In Use",
};

export const STATUS_FILTERS = ["All", ...Object.values(STATUS_LABELS)];

export const LEVEL_LABELS: Record<PreparedStandardLevel, string> = {
  RootPrepared: "Chuẩn gốc pha",
  Intermediate1: "Chuẩn trung gian pha cấp 1",
  Intermediate2: "Chuẩn trung gian pha cấp 2",
  Intermediate3: "Chuẩn trung gian pha cấp 3",
  WorkingPrepared: "Chuẩn làm việc",
};

export function statusLabel(s: InventoryItemStatus | string): string {
  return STATUS_LABELS[s as InventoryItemStatus] ?? String(s);
}

export function statusFromLabel(label: string): InventoryItemStatus {
  const entry = Object.entries(STATUS_LABELS).find(([, v]) => v === label);
  return (entry?.[0] as InventoryItemStatus) ?? InventoryItemStatus.Available;
}

export function isValidFormDate(value: string): boolean {
  if (!value.trim()) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

export function parseFormDate(value: string): Date | null {
  if (!isValidFormDate(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function missingFieldsMessage(labels: string[]): string {
  return labels.length ? `Thiếu: ${labels.join(", ")}` : "Thiếu thông tin bắt buộc";
}

export function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export type ModuleRow = Record<string, string | number | null>;

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "stockLot";
  options?: { value: string; label: string }[];
  required?: boolean;
  colSpan?: 2;
  /** Master field for stockLot picker (e.g. sourceStrainId). */
  masterFieldKey?: string;
  /** Snapshot lot number field updated when lot is picked. */
  lotNumberField?: string;
};

export type ColumnDef = {
  key: string;
  header: string;
};
