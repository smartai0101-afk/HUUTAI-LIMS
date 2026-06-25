export const STOCK_IN_TYPE_OPTIONS = [
  { value: "Chemical", label: "Hoá chất gốc" },
  { value: "Standard", label: "Chất chuẩn gốc" },
  { value: "MicrobialStrain", label: "Chủng gốc vi sinh" },
] as const;

export type StockInType = (typeof STOCK_IN_TYPE_OPTIONS)[number]["value"];

export const STOCK_IN_QUANTITY_FIELD = "quantityIn";

export const STOCK_IN_VALIDATION = {
  missingType: "Vui lòng chọn loại nhập kho",
  missingCode: "Thiếu mã vật tư",
  missingName: "Thiếu tên vật tư",
  missingLot: "Thiếu Lot Number",
  missingQuantity: "Thiếu số lượng nhập",
  invalidQuantity: "Số lượng nhập phải lớn hơn 0",
  missingUnit: "Thiếu đơn vị",
  duplicateCode: "Mã vật tư đã tồn tại",
  identityMismatch: "Thông tin vật tư không khớp với vật tư đã chọn trong danh sách",
} as const;
