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

export async function generateSampleCode(tx: Tx, date = new Date()): Promise<string> {
  const dateStr = formatDatePrefix(date);
  const prefix = `SPL-${dateStr}`;
  const seq = await nextSequenceForPrefix(tx, prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export async function generateRequestCode(tx: Tx, date = new Date()): Promise<string> {
  const dateStr = formatDatePrefix(date);
  const prefix = `PR-${dateStr}`;
  const seq = await nextSequenceForPrefix(tx, prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function parseSampleCode(code: string): { datePrefix: string; sequence: number } | null {
  const match = code.trim().match(/^SPL-(\d{8})-(\d{4})$/);
  if (!match) return null;
  return { datePrefix: match[1]!, sequence: Number.parseInt(match[2]!, 10) };
}
