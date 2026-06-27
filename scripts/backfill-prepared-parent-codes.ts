/**
 * Backfill parentCode + batchNumber on Prepared* from existing code values.
 *
 * Usage: npx tsx scripts/backfill-prepared-parent-codes.ts
 */
import { db } from "@/lib/db";
import { inferPreparedBatchFields } from "@/lib/prepared-batch-code";

type Row = { id: string; code: string; parentCode: string; batchNumber: number };

function assignWithoutCollisions(rows: Row[]): Row[] {
  const used = new Set<string>();
  const result: Row[] = [];

  for (const row of rows) {
    let { parentCode, batchNumber } = inferPreparedBatchFields(row.code);
    let key = `${parentCode}\0${batchNumber}`;
    while (used.has(key)) {
      batchNumber += 1;
      key = `${parentCode}\0${batchNumber}`;
    }
    used.add(key);
    result.push({ ...row, parentCode, batchNumber });
  }

  return result;
}

async function backfillTable(
  label: string,
  fetchRows: () => Promise<Array<{ id: string; code: string }>>,
  updateRow: (id: string, parentCode: string, batchNumber: number) => Promise<unknown>,
) {
  const rows = await fetchRows();
  const assigned = assignWithoutCollisions(
    rows.map((r) => ({ ...r, parentCode: "", batchNumber: 1 })),
  );

  for (const row of assigned) {
    await updateRow(row.id, row.parentCode, row.batchNumber);
  }

  console.log(`${label}: updated ${assigned.length} rows`);
}

async function main() {
  await backfillTable(
    "PreparedChemical",
    () => db.preparedChemical.findMany({ select: { id: true, code: true }, orderBy: { createdAt: "asc" } }),
    (id, parentCode, batchNumber) =>
      db.preparedChemical.update({ where: { id }, data: { parentCode, batchNumber } }),
  );

  await backfillTable(
    "PreparedStandard",
    () => db.preparedStandard.findMany({ select: { id: true, code: true }, orderBy: { createdAt: "asc" } }),
    (id, parentCode, batchNumber) =>
      db.preparedStandard.update({ where: { id }, data: { parentCode, batchNumber } }),
  );

  await backfillTable(
    "PreparedStrain",
    () => db.preparedStrain.findMany({ select: { id: true, code: true }, orderBy: { createdAt: "asc" } }),
    (id, parentCode, batchNumber) =>
      db.preparedStrain.update({ where: { id }, data: { parentCode, batchNumber } }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
