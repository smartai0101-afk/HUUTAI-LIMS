import { standardStatusLabel } from "@/lib/standard-status";
import type { StockLotView } from "@/types";

function toDateString(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function mapStockLot(lot: {
  id: string;
  lot: string;
  quantity: number;
  unit: string;
  purity?: string;
  uncertainty?: string;
  expiryDate: Date | null;
  afterOpenExpiry?: Date | null;
  coaPath?: string | null;
  storageLocation: string;
  notes: string;
  status: string;
}): StockLotView {
  return {
    id: lot.id,
    lot: lot.lot,
    quantity: lot.quantity,
    unit: lot.unit,
    purity: lot.purity ?? "",
    uncertainty: lot.uncertainty ?? "",
    expiryDate: toDateString(lot.expiryDate),
    afterOpenExpiry: toDateString(lot.afterOpenExpiry),
    coaPath: lot.coaPath ?? "",
    storageLocation: lot.storageLocation,
    notes: lot.notes,
    status: standardStatusLabel(lot.status),
  };
}
