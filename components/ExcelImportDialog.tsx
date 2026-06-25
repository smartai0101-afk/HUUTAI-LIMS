"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { ModalShell } from "@/components/ModalShell";
import { useToast } from "@/components/ToastProvider";
import { parseXlsx } from "@/lib/excel";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  columnMap: Record<string, string>;
  onImport: (rows: Record<string, string>[]) => Promise<{ error?: string; success?: boolean; count?: number }>;
  previewHeaders?: { key: string; label: string }[];
};

export function ExcelImportDialog({
  open,
  onClose,
  title = "Import Excel",
  columnMap,
  onImport,
  previewHeaders,
}: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const { addToast } = useToast();

  const headers =
    previewHeaders ??
    Object.entries(columnMap).map(([label, key]) => ({ key, label }));

  const handleFile = async (file: File | null) => {
    if (!file) {
      setRows([]);
      setFileName("");
      return;
    }
    const buffer = await file.arrayBuffer();
    const parsed = parseXlsx(buffer, columnMap);
    if (parsed.error) {
      addToast(parsed.error, "error");
      setRows([]);
      setFileName("");
      return;
    }
    setRows(parsed.rows.filter((r) => Object.values(r).some((v) => v.trim())));
    setFileName(file.name);
  };

  const handleConfirm = () => {
    if (!rows.length) {
      addToast("Không có dòng hợp lệ để import", "error");
      return;
    }
    startTransition(async () => {
      const result = await onImport(rows);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(`Đã import ${result.count ?? rows.length} dòng`, "success");
      setRows([]);
      setFileName("");
      onClose();
    });
  };

  const handleClose = () => {
    setRows([]);
    setFileName("");
    onClose();
  };

  return (
    <ModalShell open={open} onClose={handleClose} className="max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button type="button" onClick={handleClose}>
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-slate-600">Chọn file Excel (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        {fileName ? <p className="mt-1 text-xs text-slate-500">{fileName} — {rows.length} dòng</p> : null}
      </div>

      {rows.length ? (
        <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {headers.map((h) => (
                  <th key={h.key} className="px-3 py-2 text-left font-medium text-slate-600">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {headers.map((h) => (
                    <td key={h.key} className="px-3 py-2 text-slate-700">
                      {row[h.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 20 ? (
            <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              Hiển thị 20/{rows.length} dòng đầu tiên
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={handleClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
          Huỷ
        </button>
        <button
          type="button"
          disabled={pending || !rows.length}
          onClick={handleConfirm}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Đang import..." : "Xác nhận import"}
        </button>
      </div>
    </ModalShell>
  );
}
