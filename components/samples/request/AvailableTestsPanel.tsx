"use client";

import { useMemo, useState } from "react";
import type { TestMethodView } from "@/types/catalog";

type Props = {
  testMethods: TestMethodView[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
};

export function AvailableTestsPanel({
  testMethods,
  selectedIds,
  onChange,
  disabled,
  loading,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(testMethods.map((t) => t.categoryName));
    return ["All", ...Array.from(set).sort()];
  }, [testMethods]);

  const grouped = useMemo(() => {
    const filtered = testMethods.filter((t) => {
      if (categoryFilter !== "All" && t.categoryName !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    });
    const map = new Map<string, TestMethodView[]>();
    for (const t of filtered.sort(
      (a, b) =>
        a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name),
    )) {
      const list = map.get(t.categoryName) ?? [];
      list.push(t);
      map.set(t.categoryName, list);
    }
    return map;
  }, [testMethods, search, categoryFilter]);

  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-slate-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Danh mục chỉ tiêu
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Tìm chỉ tiêu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
            className="min-w-[120px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={disabled}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "Tất cả nhóm" : c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : grouped.size === 0 ? (
          <p className="p-4 text-sm text-slate-500">Chọn nền mẫu để xem chỉ tiêu phù hợp.</p>
        ) : (
          <div className="space-y-3">
            {[...grouped.entries()].map(([category, items]) => (
              <div key={category}>
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category}
                </p>
                <ul className="space-y-0.5">
                  {items.map((t) => {
                    const checked = selectedIds.includes(t.id);
                    return (
                      <li key={t.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 ${checked ? "bg-cyan-50" : ""} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggle(t.id)}
                            className="h-4 w-4 shrink-0 cursor-pointer"
                          />
                          <span
                            className="min-w-0 flex-1 font-medium text-slate-900"
                            title={t.name}
                          >
                            {t.name}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {t.defaultUnit}
                            {t.estimatedMinutes ? ` · ${t.estimatedMinutes}p` : ""}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
