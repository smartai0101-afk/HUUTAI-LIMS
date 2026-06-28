/**
 * Remap prepared standard parent codes by level:
 * RootPrepared→PSTD, Intermediate1→IST1, …, WorkingPrepared→WSTD (keeps sequence + batch).
 * Run AFTER migrate-strain-prefix-pst.ts.
 * Usage: npx tsx scripts/migrate-prepared-standard-level-prefix.ts
 */
import type { PreparedStandardLevel } from "@prisma/client";
import { db } from "@/lib/db";
import {
  formatMasterCode,
  parseMasterCode,
  prefixForPreparedStandard,
  type CodePrefix,
} from "@/lib/code-prefixes";
import { formatPreparedBatchCode } from "@/lib/prepared-batch-code";

type StandardRow = {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  codePrefix: string;
  sequenceNumber: number;
  level: PreparedStandardLevel;
};

function nextSequence(used: Set<number>): number {
  let n = 1;
  while (used.has(n)) n += 1;
  used.add(n);
  return n;
}

async function parentExists(prefix: CodePrefix, sequenceNumber: number, excludeIds: Set<string>) {
  const parentCode = formatMasterCode(prefix, sequenceNumber);
  const row = await db.preparedStandard.findFirst({
    where: {
      parentCode,
      codePrefix: prefix,
      deletedAt: null,
      id: { notIn: [...excludeIds] },
    },
    select: { id: true },
  });
  return !!row;
}

async function main() {
  const rows = await db.preparedStandard.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, StandardRow[]>();
  for (const row of rows) {
    const list = groups.get(row.parentCode) ?? [];
    list.push(row);
    groups.set(row.parentCode, list);
  }

  const parentMap = new Map<string, string>();
  const usedByPrefix = new Map<CodePrefix, Set<number>>();

  for (const [oldParent, groupRows] of groups) {
    const levels = new Set(groupRows.map((r) => r.level));
    if (levels.size > 1) {
      console.warn(`Group ${oldParent} has mixed levels — using first row level`);
    }
    const level = groupRows[0]!.level;
    const targetPrefix = prefixForPreparedStandard(level);

    const parsed = parseMasterCode(oldParent);
    const seq = parsed?.sequenceNumber ?? groupRows[0]!.sequenceNumber;
    const groupIds = new Set(groupRows.map((r) => r.id));

    if (parsed && parsed.prefix === targetPrefix && parsed.sequenceNumber === seq) {
      parentMap.set(oldParent, oldParent);
      const used = usedByPrefix.get(targetPrefix) ?? new Set<number>();
      used.add(seq);
      usedByPrefix.set(targetPrefix, used);
      continue;
    }

    let sequenceNumber = seq >= 1 ? seq : 1;
    const used = usedByPrefix.get(targetPrefix) ?? new Set<number>();

    while (
      used.has(sequenceNumber) ||
      (await parentExists(targetPrefix, sequenceNumber, groupIds))
    ) {
      sequenceNumber = nextSequence(used);
    }
    used.add(sequenceNumber);
    usedByPrefix.set(targetPrefix, used);

    const newParent = formatMasterCode(targetPrefix, sequenceNumber);
    parentMap.set(oldParent, newParent);
  }

  const originals = rows.map((row) => ({
    ...row,
    originalParent: row.parentCode,
    originalCode: row.code,
  }));

  // Phase 1 — temp
  for (const row of originals) {
    const tempParent = `__MIGSTD__${row.id.slice(0, 12)}`;
    await db.preparedStandard.update({
      where: { id: row.id },
      data: {
        parentCode: tempParent,
        code: `${tempParent}-${String(row.batchNumber).padStart(3, "0")}`,
      },
    });
  }

  // Phase 2 — final
  for (const row of originals) {
    const newParent = parentMap.get(row.originalParent)!;
    const parsed = parseMasterCode(newParent)!;
    const newCode = formatPreparedBatchCode(newParent, row.batchNumber);
    const oldCode = row.originalCode;

    if (oldCode !== newCode) {
      await db.codeAlias.upsert({
        where: { oldCode_entityType: { oldCode, entityType: "PreparedStandard" } },
        create: { oldCode, newCode, entityType: "PreparedStandard", entityId: row.id },
        update: { newCode, entityId: row.id },
      });
    }

    await db.preparedStandard.update({
      where: { id: row.id },
      data: {
        parentCode: newParent,
        codePrefix: parsed.prefix,
        sequenceNumber: parsed.sequenceNumber,
        code: newCode,
      },
    });
    console.log(`PreparedStandard ${oldCode} -> ${newCode}`);
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

  console.log("migrate-prepared-standard-level-prefix: done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
