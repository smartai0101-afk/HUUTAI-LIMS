"use client";

import type { GhsPictogramView } from "@/types/chem-info";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";

export function GhsPictogramGrid({ pictograms }: { pictograms: GhsPictogramView[] }) {
  if (!pictograms.length) {
    return <ChemInfoEmptyState message="Chưa có pictogram GHS cho hóa chất này." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pictograms.map((pic) => (
        <div
          key={pic.code}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-slate-200">
            <img src={pic.imagePath} alt={pic.label} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {pic.code} — {pic.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{pic.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
