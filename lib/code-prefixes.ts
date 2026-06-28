import type { PreparedStandardLevel, PreparedStrainLevel } from "@prisma/client";

/** All supported business-code prefixes. */
export const CODE_PREFIXES = [
  "CHEM",
  "STD",
  "STR",
  "PCHEM",
  "PSTD",
  "WSTD",
  "PSTR",
  "IST1",
  "IST2",
  "IST3",
  "PST1",
  "PST2",
  "PST3",
] as const;

export type CodePrefix = (typeof CODE_PREFIXES)[number];

export const MASTER_PREFIXES = ["CHEM", "STD", "STR"] as const satisfies readonly CodePrefix[];

export const PREPARED_STANDARD_PREFIXES = [
  "PSTD",
  "IST1",
  "IST2",
  "IST3",
  "WSTD",
] as const satisfies readonly CodePrefix[];

export const PREPARED_STRAIN_PREFIXES = [
  "PSTR",
  "PST1",
  "PST2",
  "PST3",
] as const satisfies readonly CodePrefix[];

export const CODE_PATTERN = /^([A-Z0-9]+)-(\d{1,4})$/;
export const PREPARED_FULL_CODE_PATTERN = /^([A-Z0-9]+-\d{4})-(\d{3})$/;

/** Master/group codes for prepared standards (not batch suffix). */
export const PREPARED_STANDARD_MASTER_CODE_PATTERN = /^(PSTD|IST[123]|WSTD)-/i;

export function isPreparedStandardMasterCode(value: string): boolean {
  return PREPARED_STANDARD_MASTER_CODE_PATTERN.test(value.trim());
}

export function isCodePrefix(value: string): value is CodePrefix {
  return (CODE_PREFIXES as readonly string[]).includes(value);
}

export function formatMasterCode(prefix: CodePrefix, sequenceNumber: number): string {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1 || sequenceNumber > 9999) {
    throw new Error(`Sequence out of range: ${sequenceNumber}`);
  }
  return `${prefix}-${String(sequenceNumber).padStart(4, "0")}`;
}

export function parseMasterCode(code: string): { prefix: CodePrefix; sequenceNumber: number } | null {
  const match = code.trim().match(CODE_PATTERN);
  if (!match) return null;
  const prefix = match[1]!;
  if (!isCodePrefix(prefix)) return null;
  const sequenceNumber = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 1) return null;
  return { prefix, sequenceNumber };
}

/** Legacy MS-* strain codes map to STR prefix with same sequence. */
export function parseLegacyStrainCode(code: string): { prefix: "STR"; sequenceNumber: number } | null {
  const match = code.trim().match(/^MS-(\d{4})$/i);
  if (!match) return null;
  const sequenceNumber = Number.parseInt(match[1]!, 10);
  if (!Number.isFinite(sequenceNumber) || sequenceNumber < 1) return null;
  return { prefix: "STR", sequenceNumber };
}

export function parseSequenceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1 || n > 9999) return null;
  return n;
}

export function formatSequenceDisplay(sequenceNumber: number): string {
  return String(sequenceNumber).padStart(4, "0");
}

export function prefixForPreparedStandard(level: PreparedStandardLevel): CodePrefix {
  switch (level) {
    case "RootPrepared":
      return "PSTD";
    case "Intermediate1":
      return "IST1";
    case "Intermediate2":
      return "IST2";
    case "Intermediate3":
      return "IST3";
    case "WorkingPrepared":
      return "WSTD";
  }
}

export function prefixForPreparedStrain(level: PreparedStrainLevel): CodePrefix {
  switch (level) {
    case "Intermediate1":
      return "PST1";
    case "Intermediate2":
      return "PST2";
    case "Intermediate3":
      return "PST3";
    default:
      return "PSTR";
  }
}

export function prefixMatchesPreparedStandardLevel(
  prefix: CodePrefix,
  level: PreparedStandardLevel,
): boolean {
  return prefixForPreparedStandard(level) === prefix;
}

export function assertPrefixMatchesPreparedStandardLevel(
  prefix: CodePrefix,
  level: PreparedStandardLevel,
): string | null {
  const expected = prefixForPreparedStandard(level);
  if (prefix !== expected) {
    return `Prefix ${prefix} không khớp cấp chuẩn (yêu cầu ${expected})`;
  }
  return null;
}

export function masterPrefixForEntity(entity: "Chemical" | "Standard" | "MicrobialStrain"): CodePrefix {
  switch (entity) {
    case "Chemical":
      return "CHEM";
    case "Standard":
      return "STD";
    case "MicrobialStrain":
      return "STR";
  }
}
