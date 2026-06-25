import type { EquipmentStatus } from "@prisma/client";

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  InUse: "Đang dùng",
  Maintenance: "Bảo trì",
  Broken: "Hỏng",
  Disposed: "Thanh lý",
};

export const EQUIPMENT_STATUS_FILTER_ALL = "All" as const;

export type EquipmentStatusFilter =
  | typeof EQUIPMENT_STATUS_FILTER_ALL
  | EquipmentStatus;

export const EQUIPMENT_STATUS_FILTER_OPTIONS: {
  value: EquipmentStatusFilter;
  label: string;
}[] = [
  { value: EQUIPMENT_STATUS_FILTER_ALL, label: "Tất cả tình trạng" },
  ...(Object.entries(EQUIPMENT_STATUS_LABELS) as [EquipmentStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

/** @deprecated Prefer EQUIPMENT_STATUS_FILTER_OPTIONS */
export const EQUIPMENT_STATUS_FILTERS = ["All", ...Object.values(EQUIPMENT_STATUS_LABELS)] as const;

export function equipmentStatusLabel(status: EquipmentStatus | string): string {
  return EQUIPMENT_STATUS_LABELS[status as EquipmentStatus] ?? String(status);
}

export function equipmentStatusFromLabel(label: string): EquipmentStatus {
  const entry = Object.entries(EQUIPMENT_STATUS_LABELS).find(([, v]) => v === label);
  return (entry?.[0] as EquipmentStatus) ?? "InUse";
}

export const EQUIPMENT_FORM_FIELD_KEYS = [
  "code",
  "name",
  "model",
  "serialNumber",
  "specifications",
  "manufacturer",
  "countryOfOrigin",
  "manufacturingYear",
  "purchaseDate",
  "commissioningDate",
  "lastCalibrationDate",
  "calibrator",
  "calibrationExpiryDate",
  "department",
  "location",
  "manager",
  "status",
  "installDate",
  "iqOqPqNotes",
  "userManualPath",
] as const;

export const EQUIPMENT_PRISMA_FIELD_KEYS = [
  ...EQUIPMENT_FORM_FIELD_KEYS,
  "createdBy",
  "updatedBy",
] as const;

export const EQUIPMENT_IMPORT_FIELD_KEYS = [
  "code",
  "name",
  "model",
  "serialNumber",
  "manufacturer",
  "department",
  "location",
  "manager",
  "status",
] as const;

export const EQUIPMENT_CATALOG_COLUMNS = [
  { key: "code", header: "Mã thiết bị" },
  { key: "name", header: "Tên thiết bị" },
  { key: "model", header: "Model" },
  { key: "serialNumber", header: "Số serial" },
  { key: "manufacturer", header: "Hãng SX" },
  { key: "department", header: "Bộ phận" },
  { key: "location", header: "Vị trí" },
  { key: "manager", header: "Người quản lý" },
  { key: "status", header: "Tình trạng" },
  { key: "lastCalibrationDate", header: "Hiệu chuẩn gần nhất" },
  { key: "calibrationExpiryDate", header: "Hạn hiệu chuẩn" },
] as const;

export const EQUIPMENT_IMPORT_COLUMN_MAP: Record<string, string> = {
  "Mã thiết bị": "code",
  "Tên thiết bị": "name",
  Model: "model",
  "Số serial": "serialNumber",
  "Hãng SX": "manufacturer",
  "Bộ phận": "department",
  "Vị trí": "location",
  "Người quản lý": "manager",
  "Tình trạng": "status",
};

export const DEFAULT_EQUIPMENT_DEPARTMENTS = ["Phòng thí nghiệm", "QC", "QA", "Sản xuất", "Kho"];

export const EQUIPMENT_DEPARTMENT_FILTER_ALL = "All" as const;

export type EquipmentDepartmentFilter =
  | typeof EQUIPMENT_DEPARTMENT_FILTER_ALL
  | string;

export const CALIBRATION_RESULT_LABELS = {
  Pass: "Đạt",
  Fail: "Không đạt",
} as const;

export const REPAIR_PRIORITY_LABELS = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
  Critical: "Khẩn cấp",
} as const;

export const REPAIR_STATUS_LABELS = {
  Open: "Mở",
  InProgress: "Đang xử lý",
  Completed: "Hoàn thành",
  Cancelled: "Hủy",
} as const;

export const DISPOSAL_STATUS_LABELS = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
} as const;

export const EVALUATION_STATUS_LABELS = {
  Draft: "Nháp",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
} as const;
