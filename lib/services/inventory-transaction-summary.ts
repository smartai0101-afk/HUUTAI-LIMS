import type { InventoryTransactionType } from "@prisma/client";
import { convertQuantity, roundStockQuantity } from "@/lib/inventory-units";
import {
  QUANTITY_DECREASING_TYPES,
  QUANTITY_INCREASING_TYPES,
} from "@/lib/services/inventory-transaction-types";

export type InventorySummary = {
  created: number;
  consumed: number;
  discarded: number;
  adjustmentIn: number;
  adjustmentOut: number;
  reversed: number;
  available: number;
};

export type TxSummaryRow = {
  transactionType: InventoryTransactionType | null;
  quantityUsed: number;
  unit?: string;
};

export function normalizeTxQuantityUsed(
  quantityUsed: number,
  txUnit: string | undefined,
  catalogUnit: string,
): number {
  if (!catalogUnit.trim() || !txUnit?.trim()) return quantityUsed;
  if (normalizeUnitKey(txUnit) === normalizeUnitKey(catalogUnit)) return quantityUsed;
  const converted = convertQuantity(quantityUsed, txUnit, catalogUnit);
  if (typeof converted === "object") return quantityUsed;
  return converted;
}

function normalizeUnitKey(unit: string): string {
  return unit.trim().toLowerCase();
}

export function summarizeTransactions(
  rows: TxSummaryRow[],
  catalogUnit?: string,
): InventorySummary {
  let created = 0;
  let consumed = 0;
  let discarded = 0;
  let adjustmentIn = 0;
  let adjustmentOut = 0;
  let reversed = 0;

  for (const row of rows) {
    const type = row.transactionType;
    if (!type) continue;
    const qty = catalogUnit
      ? normalizeTxQuantityUsed(row.quantityUsed, row.unit, catalogUnit)
      : row.quantityUsed;
    if (type === "CREATE") created += qty;
    else if (type === "CONSUME") consumed += qty;
    else if (type === "DISCARD") discarded += qty;
    else if (type === "ADJUSTMENT_IN") adjustmentIn += qty;
    else if (type === "ADJUSTMENT_OUT") adjustmentOut += qty;
    else if (type === "REVERSAL") reversed += qty;
  }

  const increases = created + adjustmentIn + reversed;
  const decreases = consumed + discarded + adjustmentOut;
  const available = roundStockQuantity(increases - decreases);

  return {
    created: roundStockQuantity(created),
    consumed: roundStockQuantity(consumed),
    discarded: roundStockQuantity(discarded),
    adjustmentIn: roundStockQuantity(adjustmentIn),
    adjustmentOut: roundStockQuantity(adjustmentOut),
    reversed: roundStockQuantity(reversed),
    available: Math.max(0, available),
  };
}

/** Running ledger balance after each tx (chronological order). */
export function computeRunningLedgerBalances(
  rows: Array<TxSummaryRow & { id: string }>,
  catalogUnit?: string,
): Map<string, number> {
  const result = new Map<string, number>();
  const typed: TxSummaryRow[] = [];
  for (const row of rows) {
    if (!row.transactionType) continue;
    typed.push({
      transactionType: row.transactionType,
      quantityUsed: row.quantityUsed,
      unit: row.unit,
    });
    result.set(row.id, summarizeTransactions(typed, catalogUnit).available);
  }
  return result;
}

export function legacySummaryFromBalances(
  quantityBefore: number,
  rows: { actionType: string; quantityUsed: number }[],
): InventorySummary {
  let consumed = 0;
  let reversed = 0;
  for (const row of rows) {
    if (row.actionType === "Deduct") consumed += row.quantityUsed;
    if (row.actionType === "Restore") reversed += row.quantityUsed;
  }
  return {
    created: roundStockQuantity(quantityBefore + consumed - reversed),
    consumed: roundStockQuantity(consumed),
    discarded: 0,
    adjustmentIn: 0,
    adjustmentOut: 0,
    reversed: roundStockQuantity(reversed),
    available: roundStockQuantity(quantityBefore),
  };
}

export { QUANTITY_DECREASING_TYPES, QUANTITY_INCREASING_TYPES };
