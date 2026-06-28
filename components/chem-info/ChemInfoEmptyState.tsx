"use client";

import { FlaskConical } from "lucide-react";

export function ChemInfoEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <FlaskConical className="h-7 w-7 text-slate-400" />
      </div>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
    </div>
  );
}
