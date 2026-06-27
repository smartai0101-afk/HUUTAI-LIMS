import type { Prisma } from "@prisma/client";

export type PreparedBatchTable = "PreparedChemical" | "PreparedStandard" | "PreparedStrain";

const LEGACY_CODE_PREFIX = /^(PSTD|PCHEM|PMS)-/i;
const BATCH_CODE_SUFFIX = /^(.+)-(\d{3})$/;

export function formatPreparedBatchCode(parentCode: string, batchNumber: number): string {
  return `${parentCode}-${String(batchNumber).padStart(3, "0")}`;
}

export function parsePreparedBatchCode(code: string): { parentCode: string; batchNumber: number } | null {
  if (LEGACY_CODE_PREFIX.test(code)) return null;
  const match = code.match(BATCH_CODE_SUFFIX);
  if (!match) return null;
  const batchNumber = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(batchNumber) || batchNumber <= 0) return null;
  return { parentCode: match[1]!, batchNumber };
}

export function inferPreparedBatchFields(code: string): { parentCode: string; batchNumber: number } {
  const parsed = parsePreparedBatchCode(code);
  if (parsed) return parsed;
  return { parentCode: code, batchNumber: 1 };
}

export function normalizeParentCode(raw: string): string {
  return raw.trim();
}

export function assertValidParentCode(raw: string): string | null {
  const parentCode = normalizeParentCode(raw);
  if (!parentCode) return "Mã nhóm là bắt buộc";
  if (parentCode.endsWith("-")) return "Mã nhóm không được kết thúc bằng dấu gạch ngang";
  if (parentCode.length > 64) return "Mã nhóm quá dài (tối đa 64 ký tự)";
  return null;
}

type Tx = Prisma.TransactionClient;

async function maxBatchNumberForParent(
  tx: Tx,
  table: PreparedBatchTable,
  parentCode: string,
): Promise<number> {
  if (table === "PreparedChemical") {
    const row = await tx.preparedChemical.aggregate({
      where: { parentCode },
      _max: { batchNumber: true },
    });
    return row._max.batchNumber ?? 0;
  }
  if (table === "PreparedStandard") {
    const row = await tx.preparedStandard.aggregate({
      where: { parentCode },
      _max: { batchNumber: true },
    });
    return row._max.batchNumber ?? 0;
  }
  const row = await tx.preparedStrain.aggregate({
    where: { parentCode },
    _max: { batchNumber: true },
  });
  return row._max.batchNumber ?? 0;
}

export async function getNextBatchNumber(
  tx: Tx,
  table: PreparedBatchTable,
  parentCode: string,
): Promise<number> {
  const normalized = normalizeParentCode(parentCode);
  const max = await maxBatchNumberForParent(tx, table, normalized);
  return max + 1;
}

export async function resolvePreparedBatchIdentity(
  tx: Tx,
  table: PreparedBatchTable,
  parentCodeRaw: string,
): Promise<{ parentCode: string; batchNumber: number; code: string } | { error: string }> {
  const parentError = assertValidParentCode(parentCodeRaw);
  if (parentError) return { error: parentError };
  const parentCode = normalizeParentCode(parentCodeRaw);
  const batchNumber = await getNextBatchNumber(tx, table, parentCode);
  return {
    parentCode,
    batchNumber,
    code: formatPreparedBatchCode(parentCode, batchNumber),
  };
}

export async function previewNextPreparedBatchCode(
  tx: Tx,
  table: PreparedBatchTable,
  parentCodeRaw: string,
): Promise<{ parentCode: string; batchNumber: number; code: string } | { error: string }> {
  return resolvePreparedBatchIdentity(tx, table, parentCodeRaw);
}
