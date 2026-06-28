/**
 * Backfill snapshot/sourceCode fields after prefix migration using CodeAlias map.
 * Does NOT modify PreparationHistory / PreparationAuditLog JSON snapshots.
 * Usage: npx tsx scripts/backfill-code-snapshots-after-prefix-migration.ts
 */
import { db } from "@/lib/db";

async function buildAliasMap() {
  const aliases = await db.codeAlias.findMany({
    select: { oldCode: true, newCode: true },
  });
  const map = new Map<string, string>();
  for (const a of aliases) {
    map.set(a.oldCode, a.newCode);
  }
  return map;
}

function remap(value: string, aliasMap: Map<string, string>): string {
  return aliasMap.get(value) ?? value;
}

async function main() {
  const aliasMap = await buildAliasMap();
  if (aliasMap.size === 0) {
    console.log("No CodeAlias rows — nothing to backfill");
    return;
  }

  let componentStandard = 0;
  let componentLot = 0;
  let inventoryTx = 0;
  let auditLog = 0;

  const components = await db.preparedStandardComponent.findMany({
    select: {
      id: true,
      standardCodeSnapshot: true,
      lotNumberSnapshot: true,
    },
  });

  for (const row of components) {
    const nextStandard = remap(row.standardCodeSnapshot, aliasMap);
    const nextLot = remap(row.lotNumberSnapshot, aliasMap);
    if (nextStandard === row.standardCodeSnapshot && nextLot === row.lotNumberSnapshot) continue;

    await db.preparedStandardComponent.update({
      where: { id: row.id },
      data: {
        standardCodeSnapshot: nextStandard,
        lotNumberSnapshot: nextLot,
      },
    });
    if (nextStandard !== row.standardCodeSnapshot) componentStandard++;
    if (nextLot !== row.lotNumberSnapshot) componentLot++;
  }

  const standardIds = new Set(
    (await db.preparedStandard.findMany({ select: { id: true } })).map((r) => r.id),
  );

  const inventoryRows = await db.inventoryTransaction.findMany({
    where: { sourceType: "PreparedStandard" },
    select: { id: true, sourceId: true, sourceCode: true },
  });

  for (const row of inventoryRows) {
    if (!standardIds.has(row.sourceId)) continue;
    const next = remap(row.sourceCode, aliasMap);
    if (next === row.sourceCode) continue;
    await db.inventoryTransaction.update({
      where: { id: row.id },
      data: { sourceCode: next },
    });
    inventoryTx++;
  }

  const auditRows = await db.auditLog.findMany({
    where: { entityType: "PreparedStandard" },
    select: { id: true, object: true },
  });

  for (const row of auditRows) {
    const next = remap(row.object, aliasMap);
    if (next === row.object) continue;
    await db.auditLog.update({
      where: { id: row.id },
      data: { object: next },
    });
    auditLog++;
  }

  console.log("backfill-code-snapshots-after-prefix-migration: done");
  console.log(
    `Updated: ${componentStandard} standardCodeSnapshot, ${componentLot} lotNumberSnapshot, ${inventoryTx} inventory tx, ${auditLog} audit log`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
