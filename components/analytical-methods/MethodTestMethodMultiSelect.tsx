"use client";

import { useMemo, useState } from "react";
import { testMethodOptionLabel } from "@/lib/catalog/test-method-label";
import type { TestMethodView } from "@/types/catalog";

type Props = {
  testMethods: TestMethodView[];
  defaultSelectedIds?: string[];
  disabled?: boolean;
};

export function MethodTestMethodMultiSelect({
  testMethods,
  defaultSelectedIds = [],
  disabled,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(defaultSelectedIds),
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const categoryOptions = useMemo(() => {
    const names = [...new Set(testMethods.map((t) => t.categoryName))].sort((a, b) =>
      a.localeCompare(b, "vi"),
    );
    return names;
  }, [testMethods]);

  const visibleMethods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testMethods.filter((t) => {
      if (categoryFilter !== "all" && t.categoryName !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q)
      );
    });
  }, [testMethods, categoryFilter, search]);

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
          Đã chọn: <span className="font-medium text-slate-700">{selectedIds.size}</span> chỉ tiêu
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:w-48">
          <select
            value={categoryFilter}
            disabled={disabled}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm disabled:bg-slate-50"
          >
            <option value="all">Tất cả nhóm ({testMethods.length})</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="search"
          value={search}
          disabled={disabled}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã hoặc tên chỉ tiêu..."
          className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm disabled:bg-slate-50"
        />
      </div>

      <div className="max-h-[240px] overflow-auto rounded-xl border border-slate-200 p-2">
        {visibleMethods.length === 0 ? (
          <p className="px-2 py-1 text-sm text-slate-500">
            {testMethods.length === 0
              ? "Chưa có chỉ tiêu trong danh mục."
              : "Không có chỉ tiêu khớp bộ lọc."}
          </p>
        ) : (
          <div className="space-y-0.5">
            {visibleMethods.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(t.id)}
                  disabled={disabled}
                  onChange={(e) => toggle(t.id, e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <span className="min-w-0 text-slate-800">
                  <span className="font-mono text-xs text-slate-400">{t.code}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  {testMethodOptionLabel(t)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {[...selectedIds].map((id) => (
        <input key={id} type="hidden" name="testMethodIds" value={id} />
      ))}
    </div>
  );
}
