import type { Prisma } from "@prisma/client";
import type { CodePrefix } from "@/lib/code-prefixes";
import { formatMasterCode, parseMasterCode, parseSequenceInput } from "@/lib/code-prefixes";
import { reserveMasterCode } from "@/lib/services/code-generator";

export type PreparedBatchTable = "PreparedChemical" | "PreparedStandard" | "PreparedStrain";

const LEGACY_CODE_PREFIX = /^(PSTD|PCHEM|PMS|PSTR|WSTD|IST[123]|PST[123])-/i;
const BATCH_CODE_SUFFIX = /^(.+)-(\d{3})$/;
const STANDARDIZED_PARENT = /^[A-Z0-9]+-\d{4}$/;

export function isStandardizedParentCode(parentCode: string): boolean {
  return STANDARDIZED_PARENT.test(parentCode);
}

export function formatPreparedBatchCode(parentCode: string, batchNumber: number): string {
  return `${parentCode}-${String(batchNumber).padStart(3, "0")}`;
}

export function parsePreparedBatchCode(code: string): { parentCode: string; batchNumber: number } | null {
  const standardized = code.match(/^([A-Z0-9]+-\d{4})-(\d{3})$/);
  if (standardized) {
    const batchNumber = Number.parseInt(standardized[2]!, 10);
    if (!Number.isFinite(batchNumber) || batchNumber <= 0) return null;
    return { parentCode: standardized[1]!, batchNumber };
  }

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
  if (LEGACY_CODE_PREFIX.test(code)) {
    return { parentCode: code, batchNumber: 1 };
  }
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

export async function previewPreparedBatchFromSequence(
  tx: Tx,
  table: PreparedBatchTable,
  prefix: CodePrefix,
  sequenceInput: string | number,
  fixedParentCode?: string,
): Promise<
  | {
      parentCode: string;
      batchNumber: number;
      code: string;
      codePrefix: CodePrefix;
      sequenceNumber: number;
    }
  | { error: string }
> {
  let parentCode: string;
  let codePrefix: CodePrefix = prefix;
  let sequenceNumber: number;

  if (fixedParentCode?.trim()) {
    parentCode = normalizeParentCode(fixedParentCode);
    const parsed = parseMasterCode(parentCode);
    sequenceNumber = parsed?.sequenceNumber ?? 0;
    if (parsed) codePrefix = parsed.prefix;
  } else {
    const seq =
      typeof sequenceInput === "number" ? sequenceInput : parseSequenceInput(String(sequenceInput));
    if (seq === null) return { error: "Số thứ tự không hợp lệ" };
    parentCode = formatMasterCode(prefix, seq);
    sequenceNumber = seq;
  }

  const batchNumber = await getNextBatchNumber(tx, table, parentCode);
  return {
    parentCode,
    codePrefix,
    sequenceNumber,
    batchNumber,
    code: formatPreparedBatchCode(parentCode, batchNumber),
  };
}

export async function resolvePreparedBatchFromSequence(
  tx: Tx,
  table: PreparedBatchTable,
  prefix: CodePrefix,
  sequenceInput?: string | number | null,
  fixedParentCode?: string,
): Promise<
  | {
      parentCode: string;
      batchNumber: number;
      code: string;
      codePrefix: CodePrefix;
      sequenceNumber: number;
    }
  | { error: string }
> {
  let parentCode: string;
  let codePrefix: CodePrefix = prefix;
  let sequenceNumber: number;

  if (fixedParentCode?.trim()) {
    parentCode = normalizeParentCode(fixedParentCode);
    const parsed = parseMasterCode(parentCode);
    sequenceNumber = parsed?.sequenceNumber ?? 0;
    if (parsed) codePrefix = parsed.prefix;
  } else {
    const reserved = await reserveMasterCode(tx, prefix, sequenceInput);
    if ("error" in reserved) return { error: reserved.error };
    parentCode = reserved.code;
    codePrefix = reserved.prefix;
    sequenceNumber = reserved.sequenceNumber;
  }

  const batchNumber = await getNextBatchNumber(tx, table, parentCode);
  return {
    parentCode,
    codePrefix,
    sequenceNumber,
    batchNumber,
    code: formatPreparedBatchCode(parentCode, batchNumber),
  };
}

export async function resolvePreparedBatchIdentity(
  tx: Tx,
  table: PreparedBatchTable,
  parentCodeRaw: string,
): Promise<{ parentCode: string; batchNumber: number; code: string } | { error: string }> {
  const parentError = assertValidParentCode(parentCodeRaw);
  if (parentError) return { error: parentError };
  const parentCode = normalizeParentCode(parentCodeRaw);

  if (isStandardizedParentCode(parentCode)) {
    const parsed = parseMasterCode(parentCode);
    if (parsed) {
      return resolvePreparedBatchFromSequence(tx, table, parsed.prefix, parsed.sequenceNumber, parentCode);
    }
  }

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
