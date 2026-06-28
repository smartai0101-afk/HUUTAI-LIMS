/**
 * Migrate MS-* master strain codes to STR-* with CodeAlias audit trail.
 * Usage: npx tsx scripts/migrate-master-codes.ts
 */
import { db } from "@/lib/db";
import { formatMasterCode, parseLegacyStrainCode } from "@/lib/code-prefixes";

async function main() {
  const strains = await db.microbialStrain.findMany({ orderBy: { code: "asc" } });
  let migrated = 0;

  for (const row of strains) {
    const legacy = parseLegacyStrainCode(row.code);
    if (!legacy) {
      const parsed = row.code.match(/^STR-(\d{4})$/);
      if (parsed) {
        await db.microbialStrain.update({
          where: { id: row.id },
          data: {
            codePrefix: "STR",
            sequenceNumber: Number.parseInt(parsed[1]!, 10),
          },
        });
      }
      continue;
    }

    const newCode = formatMasterCode("STR", legacy.sequenceNumber);
    if (row.code === newCode) continue;

    const conflict = await db.microbialStrain.findUnique({ where: { code: newCode } });
    if (conflict && conflict.id !== row.id) {
      console.error(`Conflict: ${row.code} -> ${newCode} already taken by ${conflict.id}`);
      continue;
    }

    await db.$transaction(async (tx) => {
      await tx.codeAlias.upsert({
        where: { oldCode_entityType: { oldCode: row.code, entityType: "MicrobialStrain" } },
        create: {
          oldCode: row.code,
          newCode,
          entityType: "MicrobialStrain",
          entityId: row.id,
        },
        update: { newCode, entityId: row.id },
      });

      await tx.microbialStrain.update({
        where: { id: row.id },
        data: {
          code: newCode,
          codePrefix: "STR",
          sequenceNumber: legacy.sequenceNumber,
        },
      });
    });

    migrated += 1;
    console.log(`${row.code} -> ${newCode}`);
  }

  const max = strains.reduce((acc, row) => {
    const legacy = parseLegacyStrainCode(row.code);
    const seq = legacy?.sequenceNumber ?? 0;
    return Math.max(acc, seq);
  }, 0);

  await db.codeSequence.upsert({
    where: { prefix: "STR" },
    create: { prefix: "STR", lastValue: max },
    update: { lastValue: max },
  });

  console.log(`migrate-master-codes: migrated ${migrated} strains, STR lastValue=${max}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
