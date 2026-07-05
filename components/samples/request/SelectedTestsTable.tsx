"use client";

import { useMemo } from "react";
import type { TestMethodView } from "@/types/catalog";

type Props = {
  testMethods: TestMethodView[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function SelectedTestsTable({ testMethods, selectedIds, onChange, disabled }: Props) {
  const selected = useMemo(() => {
    const map = new Map(testMethods.map((t) => [t.id, t]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as TestMethodView[];
  }, [testMethods, selectedIds]);

  const totalMinutes = selected.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);

  function remove(id: string) {
    if (disabled) return;
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Chỉ tiêu đã chọn
        </p>
        <p className="mt-1 text-sm text-slate-700">
          <span className="font-semibold text-cyan-700">{selected.length}</span> chỉ tiêu
          {totalMinutes > 0 ? (
            <span className="text-slate-500"> · Ước tính ~{totalMinutes} phút</span>
          ) : null}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2">Chỉ tiêu</th>
              <th className="px-2 py-2">PP</th>
              <th className="px-2 py-2">ĐVT</th>
              <th className="w-14 px-2 py-2">~p</th>
              {!disabled ? <th className="w-12 px-2 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {selected.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 4 : 5} className="px-4 py-6 text-center text-slate-400">
                  Chưa chọn chỉ tiêu
                </td>
              </tr>
            ) : (
              selected.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="max-w-[180px] truncate px-2 py-1.5 font-medium" title={t.name}>
                    {t.name}
                  </td>
                  <td className="max-w-[100px] truncate px-2 py-1.5 text-xs text-slate-500">
                    {t.defaultMethodCode ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-slate-600">{t.defaultUnit}</td>
                  <td className="px-2 py-1.5 text-slate-500">{t.estimatedMinutes ?? "—"}</td>
                  {!disabled ? (
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
