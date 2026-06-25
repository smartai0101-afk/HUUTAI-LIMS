import type { StockLotView } from "@/types";
import { formatStockQty } from "@/lib/inventory-units";
import { formatDate } from "@/lib/utils";

export type StockLotSelection = {
  stockLotId: string;
  lotNumber: string;
};

export function formatStockLotOptionLabel(lot: StockLotView): string {
  const qty = formatStockQty(lot.quantity);
  const unit = lot.unit.trim();
  const expiry = lot.expiryDate ? formatDate(lot.expiryDate) : "-";
  return `${lot.lot} · ${qty}${unit ? ` ${unit}` : ""} · HH ${expiry}`;
}

export function pickDefaultStockLot(stockLots: StockLotView[]): StockLotSelection | null {
  if (stockLots.length !== 1) return null;
  const lot = stockLots[0]!;
  return { stockLotId: lot.id, lotNumber: lot.lot };
}

export function requiresLotSelection(stockLots: StockLotView[]): boolean {
  return stockLots.length >= 2;
}

export function findStockLotById(stockLots: StockLotView[], stockLotId: string): StockLotView | undefined {
  return stockLots.find((lot) => lot.id === stockLotId);
}

export function emptyStockLotSelection(): StockLotSelection {
  return { stockLotId: "", lotNumber: "" };
}
