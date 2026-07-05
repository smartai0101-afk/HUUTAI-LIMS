import type { ExcelColumn } from "@/lib/excel";
import type { TestMethodRow } from "@/lib/services/catalog/test-methods";

export const TEST_METHOD_EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "code", header: "Mã" },
  { key: "name", header: "Tên" },
  { key: "categoryCode", header: "Mã nhóm" },
  { key: "categoryName", header: "Nhóm" },
  { key: "defaultMethodCode", header: "Phương pháp thử" },
  { key: "defaultUnit", header: "ĐVT" },
  { key: "lod", header: "LOD" },
];

export function buildTestMethodExportRows(rows: TestMethodRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    categoryCode: r.categoryCode,
    categoryName: r.categoryName,
    defaultMethodCode: r.defaultMethodCode ?? "",
    defaultUnit: r.defaultUnit,
    lod: r.lod,
  }));
}

export const TEST_METHOD_TEMPLATE_ROW: Record<string, unknown> = {
  code: "ASH",
  name: "Tro (Ash)",
  categoryCode: "CHEM",
  categoryName: "Hóa lý",
  defaultMethodCode: "",
  defaultUnit: "%",
  lod: "",
};
