"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ElementDetailPanel } from "@/components/chem-info/ElementDetailPanel";
import { PeriodicTableGrid } from "@/components/chem-info/PeriodicTableGrid";
import type { ElementView } from "@/types/chem-info";

function matchesQuery(el: ElementView, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    el.symbol.toLowerCase().includes(q) ||
    el.name.toLowerCase().includes(q) ||
    el.nameVi.toLowerCase().includes(q) ||
    String(el.atomicNumber) === q ||
    String(el.atomicNumber).includes(q)
  );
}

export function PeriodicTableClient({ elements }: { elements: ElementView[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ElementView | null>(null);

  const highlightedIds = useMemo(() => {
    if (!search.trim()) return undefined;
    return new Set(elements.filter((el) => matchesQuery(el, search)).map((el) => el.id));
  }, [elements, search]);

  const selectedElement = useMemo(() => {
    if (selected && elements.some((el) => el.id === selected.id)) return selected;
    return null;
  }, [elements, selected]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Thông tin hóa học</p>
        <h1 className="text-2xl font-semibold text-slate-900">Bảng tuần hoàn</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ký hiệu, tên, số nguyên tử..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <PeriodicTableGrid
          elements={elements}
          selectedId={selectedElement?.id ?? null}
          highlightedIds={highlightedIds}
          onSelect={setSelected}
        />
        <ElementDetailPanel element={selectedElement} />
      </div>
    </div>
  );
}
