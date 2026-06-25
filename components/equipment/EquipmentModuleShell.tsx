"use client";

import { Download, Plus, Search, Upload } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onExport?: () => void;
  exportLabel?: string;
  onImport?: () => void;
  onCreate?: () => void;
  createLabel?: string;
  canEdit?: boolean;
  children: ReactNode;
};

export function EquipmentModuleShell({
  title,
  subtitle,
  query,
  onQueryChange,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  onExport,
  exportLabel = "Export Excel",
  onImport,
  onCreate,
  createLabel = "Thêm mới",
  canEdit = false,
  children,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{subtitle}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {onExport ? (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              <Download className="h-4 w-4" />
              {exportLabel}
            </button>
          ) : null}
          {onImport && canEdit ? (
            <button
              type="button"
              onClick={onImport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </button>
          ) : null}
          {onCreate && canEdit ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              {createLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
        {filters}
      </div>

      {children}
    </div>
  );
}
