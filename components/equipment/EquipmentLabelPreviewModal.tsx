"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentLabelPrint } from "@/components/equipment/EquipmentLabelPrint";
import {
  equipmentToLabelData,
  getProfileBadgeLabel,
  LABEL_LAYOUT_PROFILES,
  type LabelLayoutProfile,
} from "@/lib/equipment-label-print";
import type { EquipmentView } from "@/types";
import "./equipment-label-print.css";

type Props = {
  open: boolean;
  onClose: () => void;
  items: EquipmentView[];
};

function LabelPreviewCard({
  data,
  included,
  onToggle,
  code,
}: {
  data: ReturnType<typeof equipmentToLabelData>;
  included: boolean;
  onToggle: (checked: boolean) => void;
  code: string;
}) {
  const [resolvedProfile, setResolvedProfile] = useState<LabelLayoutProfile>(
    LABEL_LAYOUT_PROFILES[0],
  );

  return (
    <div
      className={`rounded-xl border p-4 ${
        included ? "border-slate-200 bg-slate-50/50" : "border-slate-100 bg-slate-50/20 opacity-60"
      }`}
    >
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={included}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
        In tem này
        <span className="font-normal text-slate-500">({code})</span>
        <span className="ml-auto text-xs font-normal text-slate-400">
          {getProfileBadgeLabel(resolvedProfile)}
        </span>
      </label>
      <div className="label-preview-item">
        <EquipmentLabelPrint data={data} onProfileResolved={setResolvedProfile} />
      </div>
    </div>
  );
}

export function EquipmentLabelPreviewModal({ open, onClose, items }: Props) {
  const [includedIds, setIncludedIds] = useState<Set<string>>(() => new Set());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIncludedIds(new Set(items.map((item) => item.id)));
    setPrinting(false);
  }, [open, items]);

  const labelDataById = useMemo(
    () => new Map(items.map((item) => [item.id, equipmentToLabelData(item)])),
    [items],
  );

  const printLabelData = useMemo(
    () => items.filter((item) => includedIds.has(item.id)).map((item) => labelDataById.get(item.id)!),
    [items, includedIds, labelDataById],
  );

  const toggleIncluded = (id: string, checked: boolean) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handlePrint = useCallback(() => {
    if (printLabelData.length === 0) return;
    setPrinting(true);
  }, [printLabelData.length]);

  useEffect(() => {
    if (!printing || printLabelData.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 150);

    const onAfterPrint = () => {
      setPrinting(false);
    };

    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printing, printLabelData]);

  const printPortal =
    printing && typeof document !== "undefined"
      ? createPortal(
          <div className="equipment-print-area-host">
            <div className="print-area">
              {printLabelData.map((data) => (
                <EquipmentLabelPrint key={data.id} data={data} />
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <ModalShell
        open={open}
        onClose={onClose}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        align="start"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Xem trước tem nhãn</h2>
            <p className="mt-1 text-sm text-slate-500">
              {printLabelData.length} / {items.length} tem sẽ in · Tự chọn kích thước và font theo
              nội dung (tối đa 7×6cm)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {items.map((item) => {
              const data = labelDataById.get(item.id)!;
              const included = includedIds.has(item.id);
              return (
                <LabelPreviewCard
                  key={item.id}
                  data={data}
                  code={item.code}
                  included={included}
                  onToggle={(checked) => toggleIncluded(item.id, checked)}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printLabelData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Printer className="h-4 w-4" />
              In
            </button>
          </div>
        </div>
      </ModalShell>
      {printPortal}
    </>
  );
}
