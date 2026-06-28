"use client";

import { cn } from "@/lib/utils";
import { classificationStyles } from "@/components/chem-info/element-colors";
import type { ElementView } from "@/types/chem-info";

const GRID_ROWS = 10;
const GRID_COLS = 18;

type Props = {
  elements: ElementView[];
  selectedId: string | null;
  highlightedIds?: Set<string>;
  onSelect: (element: ElementView) => void;
};

export function PeriodicTableGrid({ elements, selectedId, highlightedIds, onSelect }: Props) {
  const byPosition = new Map<string, ElementView>();
  for (const el of elements) {
    byPosition.set(`${el.gridRow}-${el.gridColumn}`, el);
  }

  const cells: Array<{ row: number; col: number; element?: ElementView }> = [];
  for (let row = 1; row <= GRID_ROWS; row += 1) {
    for (let col = 1; col <= GRID_COLS; col += 1) {
      cells.push({ row, col, element: byPosition.get(`${row}-${col}`) });
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div
        className="grid min-w-[720px] gap-0.5"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
        {cells.map(({ row, col, element }) => {
          if (!element) {
            return <div key={`${row}-${col}`} className="aspect-square" aria-hidden />;
          }

          const isSelected = element.id === selectedId;
          const isDimmed = highlightedIds != null && !highlightedIds.has(element.id);

          return (
            <button
              key={element.id}
              type="button"
              title={`${element.symbol} — ${element.nameVi || element.name}`}
              onClick={() => onSelect(element)}
              className={cn(
                "aspect-square rounded-md p-0.5 text-center ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                classificationStyles(element.classification),
                isSelected && "ring-2 ring-cyan-500 ring-offset-1",
                isDimmed && "opacity-25",
              )}
            >
              <span className="block text-[9px] leading-none opacity-70">{element.atomicNumber}</span>
              <span className="block text-xs font-bold leading-tight">{element.symbol}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {[
          "alkali metal",
          "alkaline earth metal",
          "transition metal",
          "metalloid",
          "nonmetal",
          "halogen",
          "noble gas",
          "lanthanide",
          "actinide",
        ].map((cls) => (
          <span
            key={cls}
            className={cn("rounded-md px-1.5 py-0.5 ring-1", classificationStyles(cls))}
          >
            {cls.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
