"use client";

import { useMemo } from "react";
import type { TestMethodView } from "@/types/catalog";

type Props = {
  matrixName: string;
  selectedTests: TestMethodView[];
  totalCount: number;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function MappingSelectedPanel({
  matrixName,
  selectedTests,
  totalCount,
  onRemove,
  disabled,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, TestMethodView[]>();
    for (const test of selectedTests) {
      const list = map.get(test.categoryName) ?? [];
      list.push(test);
      map.set(test.categoryName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "vi"));
  }, [selectedTests]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Chỉ tiêu đã gán
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900" title={matrixName}>
          {matrixName || "—"}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          <span className="font-semibold text-cyan-700">{selectedTests.length}</span>
          <span className="text-slate-400"> / {totalCount}</span> chỉ tiêu
        </p>
      </div>

      <div
        className="table-scroll-viewport min-h-0 flex-1 overflow-auto p-4"
        style={{ ["--table-max-height" as string]: "560px", maxHeight: "560px" }}
      >
        {selectedTests.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa chọn chỉ tiêu nào cho nền này.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category} ({items.length})
                </p>
                <ul className="space-y-1">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs text-slate-400">{t.code}</span>
                        <p className="font-medium text-slate-900">{t.name}</p>
                      </div>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onRemove(t.id)}
                        className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-40"
                      >
                        Bỏ
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
