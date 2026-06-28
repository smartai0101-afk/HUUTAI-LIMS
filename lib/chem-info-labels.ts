export const CHEM_INFO_NAV = {
  module: "Thông tin hóa học",
  periodicTable: "Bảng tuần hoàn",
  chemicalLookup: "Tra cứu hóa chất",
  calculators: "Máy tính hóa chất",
  compatibility: "Tương thích hóa chất",
} as const;

export {
  HAZARD_CATEGORY_OPTIONS as HAZARD_CATEGORIES,
  type HazardCategoryOptionId as HazardCategoryId,
} from "@/lib/chem-info/hazard-category-map";
