/**
 * Release codes held by soft-deleted Prepared* rows (ISO soft delete keeps @unique code).
 * Idempotent: skips rows whose code already contains __deleted__.
 *
 * Usage: $env:NODE_ENV="production"; npx tsx scripts/backfill-archived-prepared-codes.ts
 */
import { archivePreparedCode, PREPARED_CODE_DELETED_MARKER } from "@/lib/prepared-code-guard";
import { db } from "@/lib/db";

async function backfillTable(
  label: string,
  rows: { id: string; code: string }[],
  update: (id: string, code: string) => Promise<unknown>,
) {
  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    if (row.code.includes(PREPARED_CODE_DELETED_MARKER)) {
      skipped++;
      continue;
    }
    await update(row.id, archivePreparedCode(row.code, row.id));
    updated++;
    console.log(`  ${label}: ${row.code} → ${archivePreparedCode(row.code, row.id)}`);
  }
  console.log(`${label}: ${updated} updated, ${skipped} skipped`);
}

async function main() {
  const [chemicals, standards, strains] = await Promise.all([
    db.preparedChemical.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, code: true },
    }),
    db.preparedStandard.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, code: true },
    }),
    db.preparedStrain.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, code: true },
    }),
  ]);

  await backfillTable("PreparedChemical", chemicals, (id, code) =>
    db.preparedChemical.update({ where: { id }, data: { code } }),
  );
  await backfillTable("PreparedStandard", standards, (id, code) =>
    db.preparedStandard.update({ where: { id }, data: { code } }),
  );
  await backfillTable("PreparedStrain", strains, (id, code) =>
    db.preparedStrain.update({ where: { id }, data: { code } }),
  );

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
