import * as XLSX from "xlsx";

export type ExcelColumn = { key: string; header: string };

export function exportToXlsx(
  filename: string,
  rows: Record<string, unknown>[],
  columns: ExcelColumn[],
) {
  const data = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.header] = row[col.key] ?? "";
    }
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportToXlsxBuffer(rows: Record<string, unknown>[], columns: ExcelColumn[]): Buffer {
  const data = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      out[col.header] = row[col.key] ?? "";
    }
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export function parseXlsx(
  buffer: ArrayBuffer,
  columnMap: Record<string, string>,
): { rows: Record<string, string>[]; error?: string } {
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return { rows: [], error: "File Excel trống" };
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const rows = raw.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [header, key] of Object.entries(columnMap)) {
        mapped[key] = String(row[header] ?? "").trim();
      }
      return mapped;
    });
    return { rows };
  } catch {
    return { rows: [], error: "Không đọc được file Excel" };
  }
}

/** Trigger a browser download from an xlsx buffer (client-side). */
export function downloadXlsx(filename: string, buffer: BlobPart) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
