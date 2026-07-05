"use client";

import { useMemo, useState } from "react";
import type { SampleMatrixView } from "@/types/catalog";

type Props = {
  matrices: SampleMatrixView[];
  value: string | null;
  onChange: (matrixId: string | null) => void;
  disabled?: boolean;
  required?: boolean;
};

export function MatrixSelector({ matrices, value, onChange, disabled, required }: Props) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");

  const groups = useMemo(() => {
    const set = new Set(matrices.map((m) => m.groupName).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [matrices]);

  const filtered = useMemo(() => {
    return matrices.filter((m) => {
      if (groupFilter !== "All" && m.groupName !== groupFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    });
  }, [matrices, search, groupFilter]);

  const selected = matrices.find((m) => m.id === value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Tìm nền mẫu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "Tất cả nhóm" : g}
            </option>
          ))}
        </select>
      </div>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        required={required}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      >
        <option value="">— Chọn nền mẫu —</option>
        {filtered.map((m) => (
          <option key={m.id} value={m.id}>
            {m.groupName ? `[${m.groupName}] ` : ""}
            {m.name} ({m.code})
          </option>
        ))}
      </select>
      {selected ? (
        <p className="text-xs text-slate-500">
          Đã chọn: <span className="font-medium text-slate-700">{selected.name}</span>
        </p>
      ) : null}
    </div>
  );
}
