"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ModalShell } from "@/components/ModalShell";
import { useToast } from "@/components/ToastProvider";
import type { CatalogDuplicateInDb } from "@/lib/excel-import-utils";
import { parseXlsx } from "@/lib/excel";

export type ExcelImportResult = {
  error?: string;
  success?: boolean;
  count?: number;
  errors?: string[];
};

type ImportOptions = {
  mergeDuplicates?: boolean;
};

type ImportPhase = "idle" | "preview" | "import";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  columnMap: Record<string, string>;
  onImport: (rows: Record<string, string>[], options?: ImportOptions) => Promise<ExcelImportResult>;
  onPreview?: (
    rows: Record<string, string>[],
  ) => Promise<{ error?: string; duplicates?: CatalogDuplicateInDb[]; errors?: string[] }>;
  onImported?: () => void;
  previewHeaders?: { key: string; label: string }[];
};

export function ExcelImportDialog({
  open,
  onClose,
  title = "Import Excel",
  columnMap,
  onImport,
  onPreview,
  onImported,
  previewHeaders,
}: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<CatalogDuplicateInDb[]>([]);
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const { addToast } = useToast();

  const isBusy = phase !== "idle";

  const headers =
    previewHeaders ??
    Object.entries(columnMap).map(([label, key]) => ({ key, label }));

  const handleFile = async (file: File | null) => {
    setImportErrors([]);
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

  const executeImport = async (mergeDuplicates: boolean) => {
    setPhase("import");
    try {
      const result = await onImport(rows, { mergeDuplicates });
      if (result.error) {
        addToast(result.error, "error");
        setImportErrors(result.errors ?? [result.error]);
        return;
      }
      addToast(`Đã import ${result.count ?? rows.length} dòng`, "success");
      if (result.errors?.length) {
        setImportErrors(result.errors);
      } else {
        setRows([]);
        setFileName("");
        onClose();
        onImported?.();
      }
    } catch {
      addToast("Import thất bại — vui lòng thử lại", "error");
    } finally {
      setPhase("idle");
    }
  };

  const handleConfirm = async () => {
    if (!rows.length) {
      addToast("Không có dòng hợp lệ để import", "error");
      return;
    }
    setImportErrors([]);

    if (!onPreview) {
      await executeImport(false);
      return;
    }

    setPhase("preview");
    try {
      const preview = await onPreview(rows);
      if (preview.error) {
        addToast(preview.error, "error");
        return;
      }
      if (preview.errors?.length) {
        setImportErrors(preview.errors);
      }
      if (preview.duplicates?.length) {
        setPendingDuplicates(preview.duplicates);
        setMergeConfirmOpen(true);
        return;
      }
      await executeImport(false);
    } catch {
      addToast("Không thể kiểm tra file", "error");
    } finally {
      setPhase("idle");
    }
  };

  const handleClose = () => {
    setRows([]);
    setFileName("");
    setImportErrors([]);
    setPendingDuplicates([]);
    setMergeConfirmOpen(false);
    setPhase("idle");
    onClose();
  };

  const confirmLabel =
    phase === "preview"
      ? "Đang kiểm tra..."
      : phase === "import"
        ? "Đang import..."
        : "Xác nhận import";

  return (
    <>
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
          {fileName ? (
            <p className="mt-1 text-xs text-slate-500">
              {fileName} — {rows.length} dòng
            </p>
          ) : null}
        </div>

        {rows.length ? (
          <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {headers.slice(0, 8).map((h) => (
                    <th key={h.key} className="px-3 py-2 text-left font-medium text-slate-600">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {headers.slice(0, 8).map((h) => (
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

        {importErrors.length ? (
          <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-medium text-amber-900">Cảnh báo / dòng bỏ qua</p>
            <ul className="space-y-1 text-xs text-amber-800">
              {importErrors.slice(0, 20).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            {importErrors.length > 20 ? (
              <p className="mt-2 text-xs text-amber-700">… và {importErrors.length - 20} dòng khác</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={isBusy || !rows.length}
            onClick={() => void handleConfirm()}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={mergeConfirmOpen}
        title="Lot đã tồn tại"
        message={
          pendingDuplicates.length
            ? `${pendingDuplicates.length} dòng trùng lot đã có trong kho (ví dụ: dòng ${pendingDuplicates[0]!.line} — ${pendingDuplicates[0]!.code}, lot ${pendingDuplicates[0]!.lot}). Cộng thêm tồn cho các dòng này?`
            : "Có dòng trùng lot trong kho. Cộng thêm tồn?"
        }
        confirmLabel="Cộng thêm tồn"
        cancelLabel="Bỏ qua dòng trùng"
        onConfirm={() => {
          setMergeConfirmOpen(false);
          void executeImport(true);
        }}
        onCancel={() => {
          setMergeConfirmOpen(false);
          void executeImport(false);
        }}
      />
    </>
  );
}
