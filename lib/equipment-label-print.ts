import { formatDate } from "@/lib/utils";
import type { EquipmentView } from "@/types";

export type EquipmentLabelData = {
  id: string;
  code: string;
  name: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  specifications: string;
  lastCalibrationDate: string;
  calibrationDueDate: string;
  location: string;
  manager: string;
};

export const EQUIPMENT_LABEL_FIELD_LABELS = {
  code: "Mã thiết bị",
  name: "Tên thiết bị",
  model: "Model",
  serialNumber: "Số serial",
  manufacturer: "Hãng sản xuất",
  specifications: "Thông số kỹ thuật",
  lastCalibrationDate: "Thời hạn hiệu chuẩn gần nhất",
  calibrationDueDate: "Hạn hiệu chuẩn",
  location: "Vị trí",
  manager: "Người quản lý",
} as const;

export const EQUIPMENT_LABEL_ROWS: {
  key: keyof Omit<EquipmentLabelData, "id">;
  label: string;
}[] = [
  { key: "code", label: EQUIPMENT_LABEL_FIELD_LABELS.code },
  { key: "name", label: EQUIPMENT_LABEL_FIELD_LABELS.name },
  { key: "model", label: EQUIPMENT_LABEL_FIELD_LABELS.model },
  { key: "serialNumber", label: EQUIPMENT_LABEL_FIELD_LABELS.serialNumber },
  { key: "manufacturer", label: EQUIPMENT_LABEL_FIELD_LABELS.manufacturer },
  { key: "specifications", label: EQUIPMENT_LABEL_FIELD_LABELS.specifications },
  { key: "lastCalibrationDate", label: EQUIPMENT_LABEL_FIELD_LABELS.lastCalibrationDate },
  { key: "calibrationDueDate", label: EQUIPMENT_LABEL_FIELD_LABELS.calibrationDueDate },
  { key: "location", label: EQUIPMENT_LABEL_FIELD_LABELS.location },
  { key: "manager", label: EQUIPMENT_LABEL_FIELD_LABELS.manager },
];

export const EQUIPMENT_LABEL_PRINT_FIELD_LABELS = {
  code: "Mã thiết bị",
  name: "Tên thiết bị",
  model: "Model",
  serialNumber: "Số serial",
  manufacturer: "Hãng SX",
  specifications: "Thông số KT",
  lastCalibrationDate: "Hiệu chuẩn gần nhất",
  calibrationDueDate: "Hạn HC",
  location: "Vị trí",
  manager: "Quản lý",
} as const;

export const EQUIPMENT_LABEL_PRINT_ROWS: {
  key: keyof Omit<EquipmentLabelData, "id">;
  label: string;
}[] = [
  { key: "code", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.code },
  { key: "name", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.name },
  { key: "model", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.model },
  { key: "serialNumber", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.serialNumber },
  { key: "manufacturer", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.manufacturer },
  { key: "specifications", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.specifications },
  { key: "lastCalibrationDate", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.lastCalibrationDate },
  { key: "calibrationDueDate", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.calibrationDueDate },
  { key: "location", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.location },
  { key: "manager", label: EQUIPMENT_LABEL_PRINT_FIELD_LABELS.manager },
];

export type LabelLayoutProfile = {
  id: string;
  widthCm: number;
  heightCm: number;
  fontSizePt: number;
  titleSizePt: number;
  lineHeight: number;
  rowGapMm: number;
  titleGapMm: number;
};

export const LABEL_LAYOUT_PROFILES: LabelLayoutProfile[] = [
  {
    id: "sparse-8pt",
    widthCm: 7,
    heightCm: 5,
    fontSizePt: 8,
    titleSizePt: 9,
    lineHeight: 1.18,
    rowGapMm: 0.5,
    titleGapMm: 1.2,
  },
  {
    id: "normal-75pt",
    widthCm: 7,
    heightCm: 5,
    fontSizePt: 7.5,
    titleSizePt: 8.5,
    lineHeight: 1.15,
    rowGapMm: 0.45,
    titleGapMm: 1,
  },
  {
    id: "tall-75pt",
    widthCm: 7,
    heightCm: 6,
    fontSizePt: 7.5,
    titleSizePt: 8.5,
    lineHeight: 1.15,
    rowGapMm: 0.4,
    titleGapMm: 1,
  },
  {
    id: "tall-7pt",
    widthCm: 7,
    heightCm: 6,
    fontSizePt: 7,
    titleSizePt: 8,
    lineHeight: 1.1,
    rowGapMm: 0.35,
    titleGapMm: 0.9,
  },
  {
    id: "tall-65pt",
    widthCm: 7,
    heightCm: 6,
    fontSizePt: 6.5,
    titleSizePt: 7.5,
    lineHeight: 1.08,
    rowGapMm: 0.3,
    titleGapMm: 0.8,
  },
  {
    id: "tall-63pt",
    widthCm: 7,
    heightCm: 6,
    fontSizePt: 6.3,
    titleSizePt: 7.5,
    lineHeight: 1.05,
    rowGapMm: 0.25,
    titleGapMm: 0.8,
  },
];

export function getProfileSizeLabel(profile: LabelLayoutProfile): string {
  return `${profile.widthCm}×${profile.heightCm}cm`;
}

export function getProfileBadgeLabel(profile: LabelLayoutProfile): string {
  return `${getProfileSizeLabel(profile)} · ${profile.fontSizePt}pt`;
}

export function profileToStyleVars(profile: LabelLayoutProfile): Record<string, string> {
  return {
    "--label-width": `${profile.widthCm}cm`,
    "--label-height": `${profile.heightCm}cm`,
    "--label-font-size": `${profile.fontSizePt}pt`,
    "--label-title-size": `${profile.titleSizePt}pt`,
    "--label-line-height": String(profile.lineHeight),
    "--label-row-gap": `${profile.rowGapMm}mm`,
    "--label-title-gap": `${profile.titleGapMm}mm`,
  };
}

export function displayLabelValue(value: string): string {
  const trimmed = value.trim();
  return trimmed || "-";
}

export function formatLabelDate(value: string): string {
  if (!value.trim()) return "-";
  try {
    return formatDate(value);
  } catch {
    return value.trim() || "-";
  }
}

export function equipmentToLabelData(item: EquipmentView): EquipmentLabelData {
  return {
    id: item.id,
    code: displayLabelValue(item.code),
    name: displayLabelValue(item.name),
    model: displayLabelValue(item.model),
    serialNumber: displayLabelValue(item.serialNumber),
    manufacturer: displayLabelValue(item.manufacturer),
    specifications: displayLabelValue(item.specifications),
    lastCalibrationDate: formatLabelDate(item.lastCalibrationDate),
    calibrationDueDate: formatLabelDate(item.calibrationExpiryDate),
    location: displayLabelValue(item.location),
    manager: displayLabelValue(item.manager),
  };
}
