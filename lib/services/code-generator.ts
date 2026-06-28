import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  type CodePrefix,
  formatMasterCode,
  formatSequenceDisplay,
  isCodePrefix,
  parseLegacyStrainCode,
  parseMasterCode,
  parseSequenceInput,
  prefixForPreparedStandard,
  prefixForPreparedStrain,
} from "@/lib/code-prefixes";
import type { PreparedStandardLevel, PreparedStrainLevel } from "@prisma/client";

export type CodeAvailabilityResult = {
  available: boolean;
  formattedCode: string;
  message: string;
};

type Tx = Prisma.TransactionClient;

async function ensureSequenceRow(tx: Tx, prefix: CodePrefix) {
  await tx.codeSequence.upsert({
    where: { prefix },
    create: { prefix, lastValue: 0 },
    update: {},
  });
}

async function readLastValue(tx: Tx, prefix: CodePrefix): Promise<number> {
  await ensureSequenceRow(tx, prefix);
  const row = await tx.codeSequence.findUnique({ where: { prefix } });
  return row?.lastValue ?? 0;
}

async function bumpLastValue(tx: Tx, prefix: CodePrefix, sequenceNumber: number) {
  await ensureSequenceRow(tx, prefix);
  const current = await readLastValue(tx, prefix);
  if (sequenceNumber > current) {
    await tx.codeSequence.update({
      where: { prefix },
      data: { lastValue: sequenceNumber },
    });
  }
}

async function masterCodeExists(tx: Tx, prefix: CodePrefix, sequenceNumber: number): Promise<boolean> {
  const code = formatMasterCode(prefix, sequenceNumber);
  if (prefix === "CHEM") {
    return !!(await tx.chemical.findUnique({ where: { code }, select: { id: true } }));
  }
  if (prefix === "STD") {
    return !!(await tx.standard.findUnique({ where: { code }, select: { id: true } }));
  }
  if (prefix === "STR") {
    const strCode = formatMasterCode("STR", sequenceNumber);
    const msCode = `MS-${formatSequenceDisplay(sequenceNumber)}`;
    const [str, ms] = await Promise.all([
      tx.microbialStrain.findUnique({ where: { code: strCode }, select: { id: true } }),
      tx.microbialStrain.findUnique({ where: { code: msCode }, select: { id: true } }),
    ]);
    return !!(str || ms);
  }
  // Prepared parent codes share master-style format
  const parentCode = formatMasterCode(prefix, sequenceNumber);
  if (prefix === "PCHEM") {
    return !!(await tx.preparedChemical.findFirst({
      where: { parentCode, deletedAt: null },
      select: { id: true },
    }));
  }
  if (
    prefix === "PSTD" ||
    prefix === "IST1" ||
    prefix === "IST2" ||
    prefix === "IST3" ||
    prefix === "WSTD"
  ) {
    return !!(await tx.preparedStandard.findFirst({
      where: { parentCode, codePrefix: prefix, deletedAt: null },
      select: { id: true },
    }));
  }
  if (prefix === "PSTR" || prefix === "PST1" || prefix === "PST2" || prefix === "PST3") {
    return !!(await tx.preparedStrain.findFirst({
      where: { parentCode, codePrefix: prefix, deletedAt: null },
      select: { id: true },
    }));
  }
  return !!(await tx.codeAlias.findFirst({ where: { oldCode: code }, select: { id: true } }));
}

export async function getNextSequenceNumber(
  tx: Tx | typeof db,
  prefix: CodePrefix,
): Promise<number> {
  const last = await readLastValue(tx as Tx, prefix);
  return last + 1;
}

export async function checkCodeAvailability(
  prefix: CodePrefix,
  sequenceNumber: number,
): Promise<CodeAvailabilityResult> {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1 || sequenceNumber > 9999) {
    return {
      available: false,
      formattedCode: "",
      message: "Số thứ tự phải từ 0001 đến 9999",
    };
  }

  const formattedCode = formatMasterCode(prefix, sequenceNumber);
  const exists = await masterCodeExists(db, prefix, sequenceNumber);

  if (exists) {
    return {
      available: false,
      formattedCode,
      message: `${formattedCode} đã tồn tại`,
    };
  }

  return {
    available: true,
    formattedCode,
    message: "Có thể sử dụng",
  };
}

export type ReserveMasterCodeResult =
  | { code: string; prefix: CodePrefix; sequenceNumber: number }
  | { error: string };

export async function reserveMasterCode(
  tx: Tx,
  prefix: CodePrefix,
  sequenceInput?: string | number | null,
): Promise<ReserveMasterCodeResult> {
  let sequenceNumber: number;

  if (sequenceInput === undefined || sequenceInput === null || sequenceInput === "") {
    sequenceNumber = await getNextSequenceNumber(tx, prefix);
  } else if (typeof sequenceInput === "number") {
    sequenceNumber = sequenceInput;
  } else {
    const parsed = parseSequenceInput(sequenceInput);
    if (parsed === null) return { error: "Số thứ tự không hợp lệ" };
    sequenceNumber = parsed;
  }

  const last = await readLastValue(tx, prefix);
  if (sequenceNumber > last + 1) {
    return {
      error: `Không được bỏ qua số. Số tiếp theo là ${formatSequenceDisplay(last + 1)}`,
    };
  }

  const check = await masterCodeExists(tx, prefix, sequenceNumber);
  if (check) {
    return { error: `${formatMasterCode(prefix, sequenceNumber)} đã tồn tại` };
  }

  const code = formatMasterCode(prefix, sequenceNumber);
  await bumpLastValue(tx, prefix, sequenceNumber);

  return { code, prefix, sequenceNumber };
}

export function resolveCodeFromForm(
  prefix: CodePrefix,
  formCode: string | undefined,
  formSequence: string | undefined,
): { sequenceInput?: string; legacyFullCode?: string } {
  const seq = formSequence?.trim();
  if (seq) return { sequenceInput: seq };

  const code = formCode?.trim();
  if (!code) return {};

  const parsed = parseMasterCode(code);
  if (parsed && parsed.prefix === prefix) {
    return { sequenceInput: String(parsed.sequenceNumber) };
  }

  if (prefix === "STR") {
    const legacy = parseLegacyStrainCode(code);
    if (legacy) return { sequenceInput: String(legacy.sequenceNumber) };
  }

  return { legacyFullCode: code };
}

export async function previewNextMasterCode(prefix: CodePrefix) {
  const next = await getNextSequenceNumber(db, prefix);
  return {
    prefix,
    sequenceNumber: next,
    sequenceDisplay: formatSequenceDisplay(next),
    code: formatMasterCode(prefix, next),
  };
}

export function preparedParentFromReserve(
  reserve: ReserveMasterCodeResult & { code: string },
): { parentCode: string; codePrefix: CodePrefix; sequenceNumber: number } | { error: string } {
  if ("error" in reserve) return reserve;
  return {
    parentCode: reserve.code,
    codePrefix: reserve.prefix,
    sequenceNumber: reserve.sequenceNumber,
  };
}

export async function reservePreparedParentCode(
  tx: Tx,
  prefix: CodePrefix,
  sequenceInput?: string | number | null,
): Promise<ReserveMasterCodeResult> {
  return reserveMasterCode(tx, prefix, sequenceInput);
}

export { prefixForPreparedStandard, prefixForPreparedStrain, parseSequenceInput, formatMasterCode, isCodePrefix };
