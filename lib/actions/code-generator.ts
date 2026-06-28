"use server";

import type { CodePrefix } from "@/lib/code-prefixes";
import { isCodePrefix } from "@/lib/code-prefixes";
import { checkCodeAvailability, previewNextMasterCode } from "@/lib/services/code-generator";

export async function previewNextCode(prefixRaw: string) {
  if (!isCodePrefix(prefixRaw)) {
    return { error: "Prefix không hợp lệ" };
  }
  return previewNextMasterCode(prefixRaw as CodePrefix);
}

export async function checkCodeAvailabilityAction(prefixRaw: string, sequenceInput: string) {
  if (!isCodePrefix(prefixRaw)) {
    return { error: "Prefix không hợp lệ" };
  }
  const digits = sequenceInput.trim().replace(/\D/g, "");
  if (!digits) {
    return { available: false, formattedCode: "", message: "Nhập số thứ tự" };
  }
  const sequenceNumber = Number.parseInt(digits, 10);
  return checkCodeAvailability(prefixRaw as CodePrefix, sequenceNumber);
}

export async function resolveCodeAliasAction(code: string) {
  const { db } = await import("@/lib/db");
  const trimmed = code.trim();
  if (!trimmed) return { codes: [trimmed] };

  const aliases = await db.codeAlias.findMany({
    where: { OR: [{ oldCode: trimmed }, { newCode: trimmed }] },
    select: { oldCode: true, newCode: true },
  });

  const codes = new Set<string>([trimmed]);
  for (const a of aliases) {
    codes.add(a.oldCode);
    codes.add(a.newCode);
  }
  return { codes: [...codes] };
}
