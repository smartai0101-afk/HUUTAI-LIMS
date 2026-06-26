import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import { preparationDetailHref } from "@/lib/services/preparation-traceability";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import { PREPARATION_WORKFLOW_STATUS_LABELS } from "@/lib/preparation-workflow-labels";
import type { ExcelColumn } from "@/lib/excel";

export const PREPARATION_HISTORY_REPORT_HEADERS = [
  "Mã pha chế",
  "Loại",
  "Tên thành phẩm",
  "Ngày pha",
  "Người pha",
  "Người duyệt",
  "Nguồn gốc",
  "Số lô gốc",
  "Lượng sử dụng",
  "Nồng độ gốc",
  "Nồng độ sau pha",
  "Hạn sử dụng",
  "Trạng thái",
  "Ghi chú",
] as const;

export const PREPARATION_HISTORY_REPORT_COLUMNS: ExcelColumn[] =
  PREPARATION_HISTORY_REPORT_HEADERS.map((header) => ({ key: header, header }));

const TYPE_LABELS: Record<PreparationRecordType, string> = {
  CHEMICAL: "Hóa chất pha chế",
  STANDARD: "Chuẩn pha chế",
  STRAIN: "Chủng pha chế",
};

export type PreparationHistoryReportRow = {
  id: string;
  preparationId: string;
  preparationType: PreparationRecordType;
  detailHref: string;
  code: string;
  type: string;
  name: string;
  preparedDate: string;
  preparedBy: string;
  approvedBy: string;
  sourceOrigin: string;
  sourceLot: string;
  quantityUsed: string;
  originalConcentration: string;
  finalConcentration: string;
  expiryDate: string;
  status: string;
  notes: string;
};

function formatQuantity(qty: number, unit: string): string {
  const value = Number.isInteger(qty) ? String(qty) : String(qty);
  const u = unit.trim();
  return u ? `${value} ${u}` : value;
}

function formatConcentration(value: string, unit: string): string {
  const v = value.trim();
  if (!v) return "";
  const u = unit.trim();
  return u ? `${v} ${u}` : v;
}

function resolveApprovedBy(
  approvedStaffName: string,
  approvedByStaffId: string | null,
  fallback = "",
): string {
  return approvedStaffName.trim() || (approvedByStaffId ? fallback : fallback);
}

function baseRow(
  type: PreparationRecordType,
  id: string,
  code: string,
  name: string,
  preparedDate: Date,
  preparedBy: string,
  approvedBy: string,
  originalConcentration: string,
  finalConcentration: string,
  expiryDate: Date,
  workflowStatus: keyof typeof PREPARATION_WORKFLOW_STATUS_LABELS,
  notes: string,
  source: {
    origin: string;
    lot: string;
    quantityUsed: string;
    originalConcentration?: string;
  },
  rowSuffix = "",
): PreparationHistoryReportRow {
  return {
    id: `${type}-${id}${rowSuffix}`,
    preparationId: id,
    preparationType: type,
    detailHref: preparationDetailHref(type, id),
    code,
    type: TYPE_LABELS[type],
    name,
    preparedDate: toDateString(preparedDate),
    preparedBy: preparedBy.trim(),
    approvedBy: approvedBy.trim(),
    sourceOrigin: source.origin,
    sourceLot: source.lot,
    quantityUsed: source.quantityUsed,
    originalConcentration: source.originalConcentration?.trim() || originalConcentration.trim(),
    finalConcentration: finalConcentration.trim(),
    expiryDate: toDateString(expiryDate),
    status: PREPARATION_WORKFLOW_STATUS_LABELS[workflowStatus],
    notes: notes.trim(),
  };
}

export async function getPreparationHistoryReportRows(): Promise<PreparationHistoryReportRow[]> {
  const [chemicals, standards, strains] = await Promise.all([
    db.preparedChemical.findMany({
      where: { deletedAt: null },
      include: {
        ingredients: {
          orderBy: { id: "asc" },
          include: { chemical: { select: { code: true } } },
        },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
    db.preparedStandard.findMany({
      where: { deletedAt: null },
      include: {
        components: { orderBy: { id: "asc" } },
        solvents: { orderBy: { id: "asc" } },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
    db.preparedStrain.findMany({
      where: { deletedAt: null },
      include: {
        sourceStrain: { select: { code: true, name: true } },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
  ]);

  const rows: PreparationHistoryReportRow[] = [];

  for (const row of chemicals) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      row.concentrationUnit,
    );
    const defaultOriginal = formatConcentration(row.originalConcentration, row.concentrationUnit);

    if (row.ingredients.length === 0) {
      rows.push(
        baseRow(
          "CHEMICAL",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          defaultOriginal,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          { origin: "", lot: "", quantityUsed: "" },
        ),
      );
      continue;
    }

    row.ingredients.forEach((ing, index) => {
      rows.push(
        baseRow(
          "CHEMICAL",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          defaultOriginal,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          {
            origin: ing.chemical.code || ing.chemicalNameSnapshot,
            lot: ing.lotNumberSnapshot,
            quantityUsed: formatQuantity(ing.quantityUsed, ing.unit),
          },
          `-ing-${index}`,
        ),
      );
    });
  }

  for (const row of standards) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      row.concentrationUnit,
    );
    const defaultOriginal = formatConcentration(row.originalConcentration, row.concentrationUnit);
    const sources = [
      ...row.components.map((comp) => ({
        origin: comp.standardCodeSnapshot || comp.standardNameSnapshot,
        lot: comp.lotNumberSnapshot,
        quantityUsed: formatQuantity(comp.quantityUsed, comp.unit),
        originalConcentration: formatConcentration(
          comp.concentrationSnapshot || comp.puritySnapshot,
          comp.concentrationUnitSnapshot,
        ),
      })),
      ...row.solvents.map((sol) => ({
        origin: sol.chemicalCodeSnapshot
          ? `Dung môi: ${sol.chemicalCodeSnapshot}`
          : `Dung môi: ${sol.chemicalNameSnapshot}`,
        lot: sol.lotNumberSnapshot,
        quantityUsed: formatQuantity(sol.quantityUsed, sol.unit),
        originalConcentration: "",
      })),
    ];

    if (sources.length === 0) {
      rows.push(
        baseRow(
          "STANDARD",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          defaultOriginal,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          { origin: "", lot: "", quantityUsed: "" },
        ),
      );
      continue;
    }

    sources.forEach((source, index) => {
      rows.push(
        baseRow(
          "STANDARD",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          defaultOriginal,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          source,
          `-src-${index}`,
        ),
      );
    });
  }

  for (const row of strains) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      "",
    );
    const defaultOriginal = formatConcentration(row.originalConcentration, "");

    rows.push(
      baseRow(
        "STRAIN",
        row.id,
        row.code,
        row.name,
        row.preparedDate,
        row.preparedByStaff?.name || row.preparedBy,
        approvedBy,
        defaultOriginal,
        finalConc,
        row.expiryDate,
        row.workflowStatus,
        row.notes,
        {
          origin: row.sourceStrain.code,
          lot: row.sourceLotNumberSnapshot,
          quantityUsed: "1",
        },
      ),
    );
  }

  return rows.sort((a, b) => {
    const dateCmp = b.preparedDate.localeCompare(a.preparedDate);
    if (dateCmp !== 0) return dateCmp;
    return a.code.localeCompare(b.code);
  });
}

export function preparationHistoryReportToExcelRows(
  rows: PreparationHistoryReportRow[],
): Record<string, string>[] {
  return rows.map((row) => ({
    "Mã pha chế": row.code,
    Loại: row.type,
    "Tên thành phẩm": row.name,
    "Ngày pha": row.preparedDate,
    "Người pha": row.preparedBy,
    "Người duyệt": row.approvedBy,
    "Nguồn gốc": row.sourceOrigin,
    "Số lô gốc": row.sourceLot,
    "Lượng sử dụng": row.quantityUsed,
    "Nồng độ gốc": row.originalConcentration,
    "Nồng độ sau pha": row.finalConcentration,
    "Hạn sử dụng": row.expiryDate,
    "Trạng thái": row.status,
    "Ghi chú": row.notes,
  }));
}
