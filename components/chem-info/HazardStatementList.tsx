"use client";

import type { GhsStatement } from "@/types/chem-info";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";

type Props = {
  title: string;
  statements: GhsStatement[];
};

export function HazardStatementList({ title, statements }: Props) {
  if (!statements.length) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
        <ChemInfoEmptyState message={`Chưa có ${title.toLowerCase()}.`} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      <ul className="space-y-2">
        {statements.map((stmt) => (
          <li
            key={`${stmt.code}-${stmt.text.slice(0, 24)}`}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span className="font-mono font-semibold text-cyan-700">{stmt.code}</span>
            <span className="text-slate-700"> — {stmt.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
