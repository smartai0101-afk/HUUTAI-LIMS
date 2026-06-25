"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { ModalShell } from "@/components/ModalShell";

type PrintLabelsDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  defaultLabelTotal: number;
  onConfirm: (options: { useDefaultQuantity: boolean; copiesPerSample: number }) => void;
};

export function PrintLabelsDialog({
  open,
  onClose,
  selectedCount,
  defaultLabelTotal,
  onConfirm,
}: PrintLabelsDialogProps) {
  const [useDefaultQuantity, setUseDefaultQuantity] = useState(true);
  const [copiesPerSample, setCopiesPerSample] = useState(1);

  useEffect(() => {
    if (!open) return;
    setUseDefaultQuantity(true);
    setCopiesPerSample(1);
  }, [open]);

  const totalLabels = useMemo(() => {
    if (useDefaultQuantity) return defaultLabelTotal;
    return selectedCount * Math.max(1, copiesPerSample);
  }, [useDefaultQuantity, defaultLabelTotal, selectedCount, copiesPerSample]);

  const handleConfirm = () => {
    onConfirm({
      useDefaultQuantity,
      copiesPerSample: Math.max(1, Math.floor(copiesPerSample) || 1),
    });
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">In tem nhãn</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đã chọn {selectedCount} mẫu · Tổng cộng {totalLabels} tem
        </p>

        <div className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={useDefaultQuantity}
              onChange={(e) => setUseDefaultQuantity(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">Theo số lượng mặc định</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Mỗi mẫu in 1 tem (mặc định)
              </span>
            </span>
          </label>

          <div className={useDefaultQuantity ? "opacity-50" : undefined}>
            <label className="mb-1 block text-sm text-slate-700">Số tem mỗi mẫu</label>
            <input
              type="number"
              min={1}
              step={1}
              value={copiesPerSample}
              disabled={useDefaultQuantity}
              onChange={(e) => setCopiesPerSample(Number(e.target.value))}
              className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            <Printer className="h-4 w-4" />
            In tem nhãn
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
