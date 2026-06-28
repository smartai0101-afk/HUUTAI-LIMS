"use client";

import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";

export type CopyableTableColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => string;
};

type Props<T extends Record<string, unknown>> = {
  columns: CopyableTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
};

function cellValue<T extends Record<string, unknown>>(
  row: T,
  col: CopyableTableColumn<T>,
): string {
  if (col.render) return col.render(row);
  const val = row[col.key as keyof T];
  return val == null ? "" : String(val);
}

export function CopyableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
}: Props<T>) {
  const [copied, setCopied] = useState(false);

  const tsv = [
    columns.map((c) => c.header).join("\t"),
    ...rows.map((row) => columns.map((col) => cellValue(row, col)).join("\t")),
  ].join("\n");

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [tsv]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Đã sao chép
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Sao chép bảng
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-600">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className="whitespace-nowrap px-3 py-2">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={getRowKey(row, i)} className="text-slate-800">
                {columns.map((col) => (
                  <td key={col.header} className="whitespace-nowrap px-3 py-2">
                    {cellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
