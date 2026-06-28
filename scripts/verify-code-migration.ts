/**
 * Verify code migration integrity.
 * Usage: npx tsx scripts/verify-code-migration.ts
 */
import { db } from "@/lib/db";
import {
  CODE_PATTERN,
  parseMasterCode,
  prefixForPreparedStandard,
  prefixForPreparedStrain,
  prefixMatchesPreparedStandardLevel,
} from "@/lib/code-prefixes";

async function assertUniqueCodes(label: string, codes: string[]) {
  const seen = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) throw new Error(`Duplicate ${label} code: ${code}`);
    seen.add(code);
  }
}

async function main() {
  const errors: string[] = [];

  const chem = await db.chemical.findMany({ select: { code: true, sequenceNumber: true, codePrefix: true } });
  const std = await db.standard.findMany({ select: { code: true, sequenceNumber: true, codePrefix: true } });
  const strains = await db.microbialStrain.findMany({ select: { code: true, sequenceNumber: true, codePrefix: true } });

  for (const row of [...chem, ...std, ...strains]) {
    if (!CODE_PATTERN.test(row.code)) {
      errors.push(`Non-standard master code: ${row.code}`);
    }
    if (row.code.startsWith("MS-")) {
      errors.push(`Legacy MS code remains: ${row.code}`);
    }
  }

  await assertUniqueCodes("chemical", chem.map((r) => r.code));
  await assertUniqueCodes("standard", std.map((r) => r.code));
  await assertUniqueCodes("strain", strains.map((r) => r.code));

  for (const prefix of [
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
  ]) {
    const seq = await db.codeSequence.findUnique({ where: { prefix } });
    if (!seq) errors.push(`Missing CodeSequence row: ${prefix}`);
  }

  const preparedStandards = await db.preparedStandard.findMany({
    where: { deletedAt: null },
    select: { code: true, parentCode: true, codePrefix: true, level: true },
  });

  for (const row of preparedStandards) {
    const parent = parseMasterCode(row.parentCode);
    if (!parent && !row.parentCode.includes("__deleted__")) {
      errors.push(`Non-standardized parentCode: ${row.parentCode} (code ${row.code})`);
    }
    if (!prefixMatchesPreparedStandardLevel(row.codePrefix as never, row.level)) {
      errors.push(
        `PreparedStandard ${row.code}: prefix ${row.codePrefix} không khớp level ${row.level} (expected ${prefixForPreparedStandard(row.level)})`,
      );
    }
  }

  const preparedStrains = await db.preparedStrain.findMany({
    where: { deletedAt: null },
    select: { code: true, parentCode: true, codePrefix: true, level: true },
  });

  for (const row of preparedStrains) {
    const parent = parseMasterCode(row.parentCode);
    if (!parent && !row.parentCode.includes("__deleted__")) {
      errors.push(`Non-standardized strain parentCode: ${row.parentCode} (code ${row.code})`);
    }
    const expected = prefixForPreparedStrain(row.level);
    if (row.codePrefix !== expected) {
      errors.push(
        `PreparedStrain ${row.code}: prefix ${row.codePrefix} không khớp level ${row.level} (expected ${expected})`,
      );
    }
  }

  const prepared = [
    ...(await db.preparedChemical.findMany({ select: { code: true, parentCode: true } })),
    ...preparedStandards.map((r) => ({ code: r.code, parentCode: r.parentCode })),
    ...preparedStrains.map((r) => ({ code: r.code, parentCode: r.parentCode })),
  ];

  if (errors.length) {
    console.error("verify-code-migration: FAIL");
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  }

  console.log("verify-code-migration: PASS");
  console.log(`Masters: ${chem.length} chem, ${std.length} std, ${strains.length} strains`);
  console.log(`Prepared rows checked: ${prepared.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
