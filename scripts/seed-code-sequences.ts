/**
 * Backfill sequenceNumber/codePrefix and sync CodeSequence.lastValue from existing rows.
 * Usage: npx tsx scripts/seed-code-sequences.ts
 */
import { db } from "@/lib/db";
import {
  parseLegacyStrainCode,
  parseMasterCode,
} from "@/lib/code-prefixes";

async function maxFromParentCodes(prefix: string, parentCodes: string[]): Promise<number> {
  let max = 0;
  for (const parentCode of parentCodes) {
    const parsed = parseMasterCode(parentCode);
    if (parsed?.prefix === prefix) max = Math.max(max, parsed.sequenceNumber);
  }
  return max;
}

async function maxFromMasterCodes(prefix: string, codes: string[]): Promise<number> {
  let max = 0;
  for (const code of codes) {
    const parsed = parseMasterCode(code);
    if (parsed?.prefix === prefix) max = Math.max(max, parsed.sequenceNumber);
    if (prefix === "STR") {
      const legacy = parseLegacyStrainCode(code);
      if (legacy) max = Math.max(max, legacy.sequenceNumber);
    }
  }
  return max;
}

async function syncPreparedTable(
  label: string,
  fetchRows: () => Promise<Array<{ parentCode: string }>>,
) {
  const rows = await fetchRows();
  const prefixMax = new Map<string, number>();

  for (const row of rows) {
    const parsed = parseMasterCode(row.parentCode);
    if (!parsed) continue;
    prefixMax.set(
      parsed.prefix,
      Math.max(prefixMax.get(parsed.prefix) ?? 0, parsed.sequenceNumber),
    );
  }

  for (const [prefix, max] of prefixMax.entries()) {
    if (max <= 0) continue;
    await db.codeSequence.upsert({
      where: { prefix },
      create: { prefix, lastValue: max },
      update: { lastValue: max },
    });
    console.log(`${label} prefix ${prefix}: lastValue=${max}`);
  }

  console.log(`${label}: scanned ${rows.length} parent groups`);
}

async function syncMasterTable(
  label: string,
  prefix: string,
  fetchRows: () => Promise<Array<{ id: string; code: string }>>,
  updateRow: (id: string, data: { codePrefix: string; sequenceNumber: number }) => Promise<unknown>,
) {
  const rows = await fetchRows();
  for (const row of rows) {
    const parsed =
      parseMasterCode(row.code) ?? (prefix === "STR" ? parseLegacyStrainCode(row.code) : null);
    if (!parsed) continue;
    await updateRow(row.id, { codePrefix: parsed.prefix, sequenceNumber: parsed.sequenceNumber });
  }
  const max = await maxFromMasterCodes(prefix, rows.map((r) => r.code));
  await db.codeSequence.upsert({
    where: { prefix },
    create: { prefix, lastValue: max },
    update: { lastValue: max },
  });
  console.log(`${label}: ${rows.length} rows, lastValue=${max}`);
}

async function main() {
  await syncMasterTable(
    "Chemical",
    "CHEM",
    () => db.chemical.findMany({ select: { id: true, code: true } }),
    (id, data) => db.chemical.update({ where: { id }, data }),
  );

  await syncMasterTable(
    "Standard",
    "STD",
    () => db.standard.findMany({ select: { id: true, code: true } }),
    (id, data) => db.standard.update({ where: { id }, data }),
  );

  await syncMasterTable(
    "MicrobialStrain",
    "STR",
    () => db.microbialStrain.findMany({ select: { id: true, code: true } }),
    (id, data) => db.microbialStrain.update({ where: { id }, data }),
  );

  await syncPreparedTable("PreparedChemical", () =>
    db.preparedChemical.findMany({ select: { parentCode: true } }),
  );
  await syncPreparedTable("PreparedStandard", () =>
    db.preparedStandard.findMany({ where: { deletedAt: null }, select: { parentCode: true } }),
  );
  await syncPreparedTable("PreparedStrain", () =>
    db.preparedStrain.findMany({ where: { deletedAt: null }, select: { parentCode: true } }),
  );

  for (const prefix of [
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
  ]) {
    await db.codeSequence.upsert({
      where: { prefix },
      create: { prefix, lastValue: 0 },
      update: {},
    });
  }

  console.log("seed-code-sequences: done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
