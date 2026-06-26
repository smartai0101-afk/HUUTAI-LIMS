import { lotsMatch } from "@/lib/services/stock-in-match";

export type CatalogDuplicateInDb = {
  line: number;
  code: string;
  lot: string;
  quantity: number;
  unit: string;
};

export type ImportResultMessage = {
  success?: boolean;
  count?: number;
  error?: string;
  errors?: string[];
  duplicates?: CatalogDuplicateInDb[];
  needsMergeConfirm?: boolean;
};

/** Detect duplicate keys within an import file; returns line numbers (Excel, 1-based + header). */
export function detectWithinFileDuplicates(
  rows: Record<string, string>[],
  keyFn: (row: Record<string, string>) => string,
  labelFn: (row: Record<string, string>, key: string) => string,
): { errors: string[]; skipIndices: Set<number> } {
  const seen = new Map<string, number>();
  const errors: string[] = [];
  const skipIndices = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const key = keyFn(rows[i]!).trim();
    if (!key) continue;
    const line = i + 2;
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      errors.push(`Dòng ${line} trùng dòng ${firstLine} (${labelFn(rows[i]!, key)})`);
      skipIndices.add(i);
    } else {
      seen.set(key, line);
    }
  }

  return { errors, skipIndices };
}

export function catalogRowKey(code: string, lot: string): string {
  return `${code.trim().toLowerCase()}|${lot.trim().toLowerCase()}`;
}

export function catalogLotsMatch(a: string, b: string): boolean {
  return lotsMatch(a, b);
}

/** Parse "10 mg" or "10" into quantity + unit. */
export function parseQuantityWithUnit(value: string, defaultUnit = ""): { quantity: number; unit: string } {
  const trimmed = value.trim();
  if (!trimmed) return { quantity: 0, unit: defaultUnit };
  const match = trimmed.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) {
    const n = Number(trimmed);
    return { quantity: Number.isFinite(n) ? n : 0, unit: defaultUnit };
  }
  const quantity = Number(match[1]!.replace(",", "."));
  const unit = match[2]?.trim() || defaultUnit;
  return { quantity: Number.isFinite(quantity) ? quantity : 0, unit };
}
