import type { ReactNode } from "react";
import type { StockLotView } from "@/types";

export type CatalogLotRowMeta = {
  rowKey: string;
  showMasterFields: boolean;
  stockLotId: string | null;
};

type LotFieldSource = {
  lot: string;
  quantity: number;
  unit: string;
  purity: string;
  uncertainty: string;
  expiryDate: string;
  afterOpenExpiry?: string;
  coaPath: string;
  storageLocation: string;
  notes: string;
  status: string;
  stockLots: StockLotView[];
};

function lotFieldsFromStockLot(lot: StockLotView, master: LotFieldSource) {
  return {
    lot: lot.lot,
    quantity: lot.quantity,
    unit: lot.unit,
    purity: lot.purity || master.purity,
    uncertainty: lot.uncertainty || master.uncertainty,
    expiryDate: lot.expiryDate || master.expiryDate,
    afterOpenExpiry: lot.afterOpenExpiry || master.afterOpenExpiry || "",
    coaPath: lot.coaPath || master.coaPath,
    storageLocation: lot.storageLocation || master.storageLocation,
    notes: lot.notes || master.notes,
    status: lot.status || master.status,
  };
}

/** Expand catalog masters into one table row per lot (Excel-style grouping). */
export function expandCatalogToLotRows<T extends LotFieldSource & { id: string }>(
  items: T[],
): Array<T & CatalogLotRowMeta> {
  const rows: Array<T & CatalogLotRowMeta> = [];

  for (const item of items) {
    if (item.stockLots.length === 0) {
      rows.push({
        ...item,
        rowKey: item.id,
        showMasterFields: true,
        stockLotId: null,
      });
      continue;
    }

    if (item.stockLots.length === 1) {
      const lot = item.stockLots[0]!;
      rows.push({
        ...item,
        ...lotFieldsFromStockLot(lot, item),
        rowKey: `${item.id}:${lot.id}`,
        showMasterFields: true,
        stockLotId: lot.id,
      });
      continue;
    }

    item.stockLots.forEach((lot, index) => {
      rows.push({
        ...item,
        ...lotFieldsFromStockLot(lot, item),
        rowKey: `${item.id}:${lot.id}`,
        showMasterFields: index === 0,
        stockLotId: lot.id,
      });
    });
  }

  return rows;
}

/** Recompute showMasterFields after server-side sort (consecutive rows with same master id). */
export function applyShowMasterFieldsToCatalogRows<T extends CatalogLotRowMeta & { id: string }>(
  rows: T[],
): T[] {
  let prevMasterId: string | null = null;
  return rows.map((row) => {
    const showMasterFields = row.id !== prevMasterId;
    prevMasterId = row.id;
    return { ...row, showMasterFields };
  });
}

/** Render a cell value only on the first row of a multi-lot group. */
export function groupedCell<T>(showMasterFields: boolean, value: T, render?: (v: T) => ReactNode): ReactNode {
  if (!showMasterFields) return "";
  return render ? render(value) : (value as ReactNode);
}

/** Export row: master identity columns blank on continuation lot rows. */
export function exportGroupedValue(showMasterFields: boolean, value: string | number): string | number {
  return showMasterFields ? value : "";
}
