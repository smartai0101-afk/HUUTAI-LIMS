export const PREPARED_CHEMICAL_FORM_FIELD_KEYS = [
  "parentCode",
  "sequenceNumber",
  "code",
  "name",
  "concentration",
  "concentrationUnit",
  "preparedQuantity",
  "unit",
  "preparedDate",
  "expiryDate",
  "preparedBy",
  "storageLocation",
  "storageCondition",
  "formula",
  "originalConcentration",
  "finalConcentration",
  "equipmentUsed",
  "preparationCondition",
  "equipmentId",
  "notes",
] as const;

export const PREPARED_CHEMICAL_CSV_FIELD_KEYS = [
  "Mã nhóm",
  "Mã hóa chất pha",
  "Tên hóa chất pha",
  "Công thức",
  "Nồng độ lý thuyết",
  "Đơn vị nồng độ",
  "Nồng độ thực tế",
  "Thể tích/Khối lượng pha chế",
  "ĐVT",
  "Ngày pha chế",
  "Ngày hết hạn",
  "Người pha",
  "Vị trí lưu",
  "Điều kiện bảo quản",
  "Trạng thái",
  "Trạng thái quy trình",
  "Ghi chú",
  "Hóa chất gốc sử dụng",
] as const;

export function formatIngredientLine(
  name: string,
  lot: string,
  quantityUsed: number,
  unit: string,
): string {
  const lotLabel = lot.trim() || "/";
  const qty = Number.isInteger(quantityUsed) ? String(quantityUsed) : String(quantityUsed);
  const unitSuffix = unit.trim() ? ` ${unit.trim()}` : "";
  return `${name} — ${lotLabel} — ${qty}${unitSuffix}`;
}

export function buildPreparedChemicalExportRows(
  items: import("@/types").PreparedChemicalView[],
): Array<Record<string, string | number>> {
  return items.map((item) => ({
    "Mã nhóm": item.parentCode,
    "Mã hóa chất pha": item.code,
    "Tên hóa chất pha": item.name,
    "Công thức": item.formula,
    "Nồng độ lý thuyết": item.concentration,
    "Đơn vị nồng độ": item.concentrationUnit,
    "Nồng độ thực tế": item.finalConcentration,
    "Thể tích/Khối lượng pha chế": item.preparedQuantity,
    "ĐVT": item.unit,
    "Ngày pha chế": item.preparedDate,
    "Ngày hết hạn": item.expiryDate,
    "Người pha": item.preparedBy,
    "Vị trí lưu": item.storageLocation,
    "Điều kiện bảo quản": item.storageCondition,
    "Trạng thái": item.status,
    "Trạng thái quy trình": item.workflowStatusLabel,
    "Ghi chú": item.notes,
    "Hóa chất gốc sử dụng": item.ingredientsSummary,
  }));
}
