"use client";

import type { StockLotView } from "@/types";
import {
  formatStockLotOptionLabel,
  pickDefaultStockLot,
  requiresLotSelection,
  type StockLotSelection,
} from "@/lib/stock-lot-selection";

type StockLotPickerProps = {
  stockLots: StockLotView[];
  value: StockLotSelection;
  onChange: (value: StockLotSelection) => void;
  disabled?: boolean;
  label?: string;
};

export function StockLotPicker({
  stockLots,
  value,
  onChange,
  disabled,
  label = "Lot",
}: StockLotPickerProps) {
  const mustPick = requiresLotSelection(stockLots);
  const singleLot = stockLots.length === 1 ? stockLots[0] : null;

  if (stockLots.length === 0) {
    return (
      <div>
        <label className="mb-1 block text-xs text-slate-600">{label}</label>
        <input
          readOnly
          value={value.lotNumber || "/"}
          className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm text-slate-600"
        />
      </div>
    );
  }

  if (singleLot && !mustPick) {
    return (
      <div>
        <label className="mb-1 block text-xs text-slate-600">{label}</label>
        <input
          readOnly
          value={formatStockLotOptionLabel(singleLot)}
          className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm text-slate-600"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600">
        {label} <span className="text-rose-600">*</span>
      </label>
      <select
        value={value.stockLotId}
        disabled={disabled}
        onChange={(e) => {
          const lot = stockLots.find((row) => row.id === e.target.value);
          onChange({
            stockLotId: e.target.value,
            lotNumber: lot?.lot ?? "",
          });
        }}
        className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm"
      >
        <option value="">Chọn lot</option>
        {stockLots.map((lot) => (
          <option key={lot.id} value={lot.id}>
            {formatStockLotOptionLabel(lot)}
          </option>
        ))}
      </select>
      {mustPick && !value.stockLotId ? (
        <p className="mt-1 text-xs text-amber-700">Bắt buộc chọn lot khi vật tư có nhiều lot</p>
      ) : null}
    </div>
  );
}

export function applyDefaultLotIfSingle(
  stockLots: StockLotView[],
  current: StockLotSelection,
): StockLotSelection {
  const picked = pickDefaultStockLot(stockLots);
  if (picked) return picked;
  return current;
}
