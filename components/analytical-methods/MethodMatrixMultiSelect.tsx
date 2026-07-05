"use client";

import { useState } from "react";
import { matrixOptionLabel } from "@/lib/catalog/matrix-label";
import type { SampleMatrixView } from "@/types/catalog";

type Props = {
  matrices: SampleMatrixView[];
  defaultSelectedIds?: string[];
  disabled?: boolean;
};

export function MethodMatrixMultiSelect({
  matrices,
  defaultSelectedIds = [],
  disabled,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(defaultSelectedIds),
  );

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Đã chọn: <span className="font-medium text-slate-700">{selectedIds.size}</span> nền mẫu
        </p>
        {selectedIds.size > 0 && !disabled ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-cyan-700 hover:underline"
          >
            Bỏ chọn tất cả
          </button>
        ) : null}
      </div>

      <div className="max-h-[240px] overflow-auto rounded-xl border border-slate-200 p-2">
        {matrices.length === 0 ? (
          <p className="px-2 py-1 text-sm text-slate-500">Chưa có nền mẫu trong danh mục.</p>
        ) : (
          <div className="space-y-0.5">
            {matrices.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(m.id)}
                  disabled={disabled}
                  onChange={(e) => toggle(m.id, e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <span className="text-slate-800">{matrixOptionLabel(m)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {[...selectedIds].map((id) => (
        <input key={id} type="hidden" name="matrixIds" value={id} />
      ))}
    </div>
  );
}
