/**
 * Remap prepared strain intermediate prefixes IST1/2/3 → PST1/2/3 (keeps sequence numbers).
 * Run BEFORE migrate-prepared-standard-level-prefix.ts.
 * Usage: npx tsx scripts/migrate-strain-prefix-pst.ts
 */
import { db } from "@/lib/db";
import { formatMasterCode, parseMasterCode, type CodePrefix } from "@/lib/code-prefixes";
import { formatPreparedBatchCode } from "@/lib/prepared-batch-code";

const IST_TO_PST: Record<string, CodePrefix> = {
  IST1: "PST1",
  IST2: "PST2",
  IST3: "PST3",
};

type StrainRow = {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  codePrefix: string;
  sequenceNumber: number;
};

async function remapStrainPrefix(oldPrefix: CodePrefix, newPrefix: CodePrefix) {
  const rows: StrainRow[] = await db.preparedStrain.findMany({
    where: { codePrefix: oldPrefix },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) {
    console.log(`PreparedStrain ${oldPrefix}: no rows`);
    return;
  }

  const parentMap = new Map<string, string>();

  for (const row of rows) {
    const parsed = parseMasterCode(row.parentCode);
    const seq = parsed?.sequenceNumber ?? row.sequenceNumber;
    if (seq < 1) {
      console.warn(`Skip ${row.code}: invalid sequence`);
      continue;
    }
    parentMap.set(row.parentCode, formatMasterCode(newPrefix, seq));
  }

  const originals = rows.map((row) => ({
    ...row,
    originalParent: row.parentCode,
    originalCode: row.code,
  }));

  // Phase 1 — temp codes
  for (const row of originals) {
    const tempParent = `__MIGSTR__${row.id.slice(0, 12)}`;
    await db.preparedStrain.update({
      where: { id: row.id },
      data: {
        parentCode: tempParent,
        code: `${tempParent}-${String(row.batchNumber).padStart(3, "0")}`,
      },
    });
  }

  // Phase 2 — final codes + aliases
  for (const row of originals) {
    const newParent = parentMap.get(row.originalParent);
    if (!newParent) continue;
    const parsed = parseMasterCode(newParent)!;
    const newCode = formatPreparedBatchCode(newParent, row.batchNumber);
    const oldCode = row.originalCode;

    if (oldCode !== newCode) {
      await db.codeAlias.upsert({
        where: { oldCode_entityType: { oldCode, entityType: "PreparedStrain" } },
        create: { oldCode, newCode, entityType: "PreparedStrain", entityId: row.id },
        update: { newCode, entityId: row.id },
      });
    }

    await db.preparedStrain.update({
      where: { id: row.id },
      data: {
        parentCode: newParent,
        codePrefix: parsed.prefix,
        sequenceNumber: parsed.sequenceNumber,
        code: newCode,
      },
    });
    console.log(`PreparedStrain ${oldCode} -> ${newCode}`);
  }

  const maxSeq = Math.max(
    ...[...parentMap.values()]
      .map((p) => parseMasterCode(p)?.sequenceNumber ?? 0)
      .filter((n) => n > 0),
  );
  if (maxSeq > 0) {
    await db.codeSequence.upsert({
      where: { prefix: newPrefix },
      create: { prefix: newPrefix, lastValue: maxSeq },
      update: { lastValue: maxSeq },
    });
  }
}

async function main() {
  for (const [oldPrefix, newPrefix] of Object.entries(IST_TO_PST) as [CodePrefix, CodePrefix][]) {
    await remapStrainPrefix(oldPrefix, newPrefix);
  }
  console.log("migrate-strain-prefix-pst: done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
