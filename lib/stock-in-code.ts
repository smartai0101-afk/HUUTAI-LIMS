import type { StockInSourceType } from "@prisma/client";
import { formatMasterCode, parseSequenceInput, type CodePrefix } from "@/lib/code-prefixes";

export function stockInCodePrefix(sourceType: StockInSourceType): CodePrefix {
  if (sourceType === "Chemical") return "CHEM";
  if (sourceType === "Standard") return "STD";
  return "STR";
}

export function resolveStockInCode(
  sourceType: StockInSourceType,
  code: string,
  sequenceNumber: string,
): string {
  const trimmed = code.trim();
  if (trimmed) return trimmed;
  const seq = sequenceNumber.trim();
  if (!seq) return "";
  const n = parseSequenceInput(seq);
  if (n === null) return "";
  return formatMasterCode(stockInCodePrefix(sourceType), n);
}

export function formatStockInCodeFromSequence(prefix: CodePrefix, sequence: string): string {
  const n = parseSequenceInput(sequence);
  if (n === null) return "";
  return formatMasterCode(prefix, n);
}
