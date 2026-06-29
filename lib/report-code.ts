import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function formatDatePrefix(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function nextSequenceForPrefix(tx: Tx, prefix: string): Promise<number> {
  await tx.codeSequence.upsert({
    where: { prefix },
    create: { prefix, lastValue: 0 },
    update: {},
  });
  const row = await tx.codeSequence.update({
    where: { prefix },
    data: { lastValue: { increment: 1 } },
  });
  return row.lastValue;
}

export async function generateReportCode(tx: Tx, date = new Date()): Promise<string> {
  const dateStr = formatDatePrefix(date);
  const prefix = `RPT-${dateStr}`;
  const seq = await nextSequenceForPrefix(tx, prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function parseJsonArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export function toJsonArray(values: string[]): string {
  return JSON.stringify(values.map((v) => v.trim()).filter(Boolean));
}
