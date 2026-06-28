/**
 * Remap legacy prepared parent codes (CG01, PSTD-0000, etc.) to PREFIX-NNNN format.
 * Usage: npx tsx scripts/migrate-prepared-codes.ts
 */
import { db } from "@/lib/db";
import {
  formatMasterCode,
  parseMasterCode,
  prefixForPreparedStandard,
  prefixForPreparedStrain,
} from "@/lib/code-prefixes";
import { formatPreparedBatchCode } from "@/lib/prepared-batch-code";
import type { PreparedStrainLevel } from "@prisma/client";

function nextSequence(used: Set<number>): number {
  let n = 1;
  while (used.has(n)) n += 1;
  used.add(n);
  return n;
}

async function remapTable<T extends { id: string; parentCode: string; batchNumber: number; code: string }>(
  label: string,
  entityType: "PreparedChemical" | "PreparedStandard" | "PreparedStrain",
  fetchRows: () => Promise<T[]>,
  resolvePrefix: (row: T) => string,
  updateRow: (
    id: string,
    data: { parentCode: string; codePrefix: string; sequenceNumber: number; batchNumber: number; code: string },
  ) => Promise<unknown>,
) {
  const rows = await fetchRows();
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(row.parentCode) ?? [];
    list.push(row);
    groups.set(row.parentCode, list);
  }

  const usedByPrefix = new Map<string, Set<number>>();
  const parentMap = new Map<string, string>();

  for (const oldParent of groups.keys()) {
    const parsed = parseMasterCode(oldParent);
    if (parsed) {
      parentMap.set(oldParent, oldParent);
      const used = usedByPrefix.get(parsed.prefix) ?? new Set<number>();
      used.add(parsed.sequenceNumber);
      usedByPrefix.set(parsed.prefix, used);
    }
  }

  for (const oldParent of groups.keys()) {
    if (parentMap.has(oldParent)) continue;
    const sample = groups.get(oldParent)![0]!;
    const prefix = resolvePrefix(sample);
    const used = usedByPrefix.get(prefix) ?? new Set<number>();
    const seq = nextSequence(used);
    usedByPrefix.set(prefix, used);
    parentMap.set(oldParent, formatMasterCode(prefix as never, seq));
  }

  // Phase 1 — temp parent codes to avoid unique collisions mid-update
  for (const row of rows) {
    await updateRow(row.id, {
      parentCode: `__MIG__${row.id.slice(0, 12)}`,
      codePrefix: row.parentCode.startsWith("WSTD") ? "WSTD" : resolvePrefix(row).startsWith("IST") ? resolvePrefix(row) : resolvePrefix(row),
      sequenceNumber: 0,
      batchNumber: row.batchNumber,
      code: `__MIG__${row.id.slice(0, 12)}-${String(row.batchNumber).padStart(3, "0")}`,
    });
  }

  // Phase 2 — final codes
  for (const row of rows) {
    const newParent = parentMap.get(row.parentCode)!;
    const parsed = parseMasterCode(newParent)!;
    const newCode = formatPreparedBatchCode(newParent, row.batchNumber);
    const oldCode = row.code;

    await db.$transaction(async (tx) => {
      if (oldCode !== newCode) {
        await tx.codeAlias.upsert({
          where: { oldCode_entityType: { oldCode, entityType } },
          create: { oldCode, newCode, entityType, entityId: row.id },
          update: { newCode, entityId: row.id },
        });
      }
    });

    await updateRow(row.id, {
      parentCode: newParent,
      codePrefix: parsed.prefix,
      sequenceNumber: parsed.sequenceNumber,
      batchNumber: row.batchNumber,
      code: newCode,
    });
    console.log(`${label} ${oldCode} -> ${newCode}`);
  }

  for (const [prefix, used] of usedByPrefix.entries()) {
    const max = Math.max(0, ...used);
    if (max > 0) {
      await db.codeSequence.upsert({
        where: { prefix },
        create: { prefix, lastValue: max },
        update: { lastValue: max },
      });
    }
  }
}

async function main() {
  await remapTable(
    "PreparedStandard",
    "PreparedStandard",
    () => db.preparedStandard.findMany({ orderBy: { createdAt: "asc" } }),
    (row) => prefixForPreparedStandard(row.level),
    (id, data) => db.preparedStandard.update({ where: { id }, data }),
  );

  await remapTable(
    "PreparedChemical",
    "PreparedChemical",
    () => db.preparedChemical.findMany({ orderBy: { createdAt: "asc" } }),
    () => "PCHEM",
    (id, data) => db.preparedChemical.update({ where: { id }, data }),
  );

  await remapTable(
    "PreparedStrain",
    "PreparedStrain",
    () => db.preparedStrain.findMany({ orderBy: { createdAt: "asc" } }),
    (row) => prefixForPreparedStrain((row.level ?? "RootPrepared") as PreparedStrainLevel),
    (id, data) => db.preparedStrain.update({ where: { id }, data }),
  );

  console.log("migrate-prepared-codes: done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
