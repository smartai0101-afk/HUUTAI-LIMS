import type { CalibrationResult } from "@prisma/client";

export type CalibrationResultRow = {
  result: string;
  error: string;
  standardResult: string;
  correctiveAction: string;
  evaluatedBy: string;
  evaluationDate: string;
  notes: string;
};

export const EMPTY_CALIBRATION_RESULT_ROW: CalibrationResultRow = {
  result: "",
  error: "",
  standardResult: "",
  correctiveAction: "",
  evaluatedBy: "",
  evaluationDate: "",
  notes: "",
};

function normalizeRow(row: Partial<CalibrationResultRow>): CalibrationResultRow {
  return {
    result: String(row.result ?? "").trim(),
    error: String(row.error ?? "").trim(),
    standardResult: String(row.standardResult ?? "").trim(),
    correctiveAction: String(row.correctiveAction ?? "").trim(),
    evaluatedBy: String(row.evaluatedBy ?? "").trim(),
    evaluationDate: String(row.evaluationDate ?? "").trim(),
    notes: String(row.notes ?? "").trim(),
  };
}

function hasMeasurementContent(row: CalibrationResultRow) {
  return Boolean(row.result || row.error);
}

export function parseCalibrationResults(value: unknown): CalibrationResultRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => normalizeRow(row as Partial<CalibrationResultRow>))
    .filter((row) => hasMeasurementContent(row));
}

export function parseCalibrationResultsJson(json: string): CalibrationResultRow[] {
  if (!json.trim()) return [];
  try {
    return parseCalibrationResults(JSON.parse(json));
  } catch {
    return [];
  }
}

/** Ensure at least one editable row in forms. */
export function normalizeCalibrationResultRows(rows: CalibrationResultRow[]): CalibrationResultRow[] {
  const normalized = rows.map(normalizeRow).filter((row) => hasMeasurementContent(row));
  return normalized.length > 0 ? normalized : [{ ...EMPTY_CALIBRATION_RESULT_ROW }];
}

export function formatCalibrationResults(rows: CalibrationResultRow[]): string {
  const normalized = parseCalibrationResults(rows);
  if (normalized.length === 0) return "-";
  return normalized
    .map((row) => (row.error ? `${row.result} (±${row.error})` : row.result))
    .join("; ");
}

export function formatEvaluationSummary(rows: CalibrationResultRow[]): string {
  const normalized = rows.map(normalizeRow).filter((row) => hasMeasurementContent(row));
  if (normalized.length === 0) return "-";
  const recordDate = resolveRecordEvaluationDate(normalized);
  const recordEvaluator = resolveRecordEvaluatedBy(normalized);
  const parts = normalized
    .map((row, index) => {
      const details: string[] = [];
      if (row.standardResult) details.push(`Quy chuẩn: ${row.standardResult}`);
      if (row.correctiveAction) details.push(`Khắc phục: ${row.correctiveAction}`);
      if (row.notes) details.push(`Ghi chú: ${row.notes}`);
      return details.length > 0 ? `Dòng ${index + 1}: ${details.join(", ")}` : null;
    })
    .filter(Boolean);
  const meta: string[] = [];
  if (recordDate) meta.push(`Ngày đánh giá: ${recordDate}`);
  if (recordEvaluator) meta.push(`Người đánh giá: ${recordEvaluator}`);
  const summary = parts.length > 0 ? parts.join("; ") : "";
  if (meta.length > 0 && summary) return `${meta.join("; ")}; ${summary}`;
  if (meta.length > 0) return meta.join("; ");
  return summary || "-";
}

/** One evaluation date per calibration record — read from first non-empty row. */
export function resolveRecordEvaluationDate(rows: CalibrationResultRow[]): string {
  for (const row of rows) {
    const date = row.evaluationDate.trim();
    if (date) return date;
  }
  return "";
}

/** One evaluator per calibration record — read from first non-empty row. */
export function resolveRecordEvaluatedBy(rows: CalibrationResultRow[]): string {
  for (const row of rows) {
    const name = row.evaluatedBy.trim();
    if (name) return name;
  }
  return "";
}

export type RecordEvaluationMeta = {
  evaluationDate: string;
  evaluatedBy: string;
};

/** Apply shared evaluation date and evaluator to every row before save. */
export function applyRecordEvaluationMeta(
  rows: CalibrationResultRow[],
  meta: RecordEvaluationMeta,
): CalibrationResultRow[] {
  const evaluationDate = meta.evaluationDate.trim();
  const evaluatedBy = meta.evaluatedBy.trim();
  return rows.map((row) => ({ ...row, evaluationDate, evaluatedBy }));
}

/** @deprecated Use applyRecordEvaluationMeta */
export function applyRecordEvaluationDate(
  rows: CalibrationResultRow[],
  evaluationDate: string,
): CalibrationResultRow[] {
  return applyRecordEvaluationMeta(rows, { evaluationDate, evaluatedBy: "" });
}

/** Auto Pass/Fail: compare measured result vs standard per row (string equality, no ±). */
export function deriveCalibrationResult(rows: CalibrationResultRow[]): CalibrationResult {
  for (const row of rows) {
    const measured = row.result.trim();
    const standard = row.standardResult.trim();
    if (measured && standard && measured !== standard) return "Fail";
  }
  return "Pass";
}

/** Backfill rows from legacy single deviation field. */
export function calibrationResultsFromLegacy(deviation: string): CalibrationResultRow[] {
  const trimmed = deviation.trim();
  if (!trimmed) return [{ ...EMPTY_CALIBRATION_RESULT_ROW }];
  return [{ ...EMPTY_CALIBRATION_RESULT_ROW, result: trimmed }];
}

export function resolveCalibrationResults(
  stored: unknown,
  deviation: string,
): CalibrationResultRow[] {
  const parsed = parseCalibrationResults(stored);
  if (parsed.length > 0) return parsed;
  return calibrationResultsFromLegacy(deviation);
}
