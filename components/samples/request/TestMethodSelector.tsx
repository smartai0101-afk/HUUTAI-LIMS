"use client";

import { useMemo, useState } from "react";
import type { TestMethodView } from "@/types/catalog";

type Props = {
  testMethods: TestMethodView[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  invalidIds?: Set<string>;
};

export function TestMethodSelector({
  testMethods,
  selectedIds,
  onChange,
  disabled,
  invalidIds,
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
    for (const t of filtered) {
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Tìm chỉ tiêu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "Tất cả nhóm" : c}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {[...grouped.entries()].map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{category}</p>
            <ul className="space-y-1">
              {items.map((t) => {
                const checked = selectedIds.includes(t.id);
                const invalid = invalidIds?.has(t.id);
                return (
                  <li key={t.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${invalid ? "bg-amber-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(t.id)}
                        disabled={disabled}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        <span className="font-medium text-slate-900">{t.name}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {t.defaultUnit}
                          {t.estimatedMinutes ? ` · ~${t.estimatedMinutes} phút` : ""}
                          {t.defaultMethodCode ? ` · ${t.defaultMethodCode}` : ""}
                        </span>
                        {invalid ? (
                          <span className="mt-0.5 block text-xs text-amber-700">
                            Chỉ tiêu không phù hợp nền mẫu
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {grouped.size === 0 ? (
          <p className="text-sm text-slate-500">Chọn nền mẫu để xem chỉ tiêu phù hợp.</p>
        ) : null}
      </div>
    </div>
  );
}
