/**
 * Backfill PreparationHistory v0 for existing Prepared* records (ISO workflow).
 * Idempotent: skips records that already have a Created history entry.
 *
 * Usage: npx tsx scripts/backfill-preparation-history.ts
 */
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { buildPreparationSnapshot } from "@/lib/services/preparation-workflow";

async function backfillType(
  preparationType: "CHEMICAL" | "STANDARD" | "STRAIN",
  records: { id: string; version?: number; preparedBy?: string }[],
) {
  let created = 0;
  let skipped = 0;

  for (const record of records) {
    const existing = await db.preparationHistory.findFirst({
      where: {
        preparationType,
        preparationId: record.id,
        event: "Created",
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const full =
      preparationType === "CHEMICAL"
        ? await db.preparedChemical.findUnique({
            where: { id: record.id },
            include: { ingredients: true },
          })
        : preparationType === "STANDARD"
          ? await db.preparedStandard.findUnique({
              where: { id: record.id },
              include: { components: true, solvents: true },
            })
          : await db.preparedStrain.findUnique({
              where: { id: record.id },
              include: { sourceStrain: true },
            });

    if (!full) continue;

    const version = full.version && full.version > 0 ? full.version : 1;
    const performedBy = ("preparedBy" in full && full.preparedBy) || "System";

    await db.preparationHistory.create({
      data: {
        id: randomUUID(),
        preparationType,
        preparationId: record.id,
        version,
        event: "BackfillCreated",
        snapshotJson: JSON.stringify(buildPreparationSnapshot(full)),
        reason: "Backfill ISO workflow history for legacy record",
        performedBy,
      },
    });

    await db.preparationAuditLog.create({
      data: {
        id: randomUUID(),
        preparationType,
        preparationId: record.id,
        action: "BackfillCreated",
        beforeJson: "{}",
        afterJson: JSON.stringify(buildPreparationSnapshot(full)),
        reason: "Backfill ISO workflow audit for legacy record",
        performedBy,
      },
    });

    if (full.workflowStatus !== "Approved" || (full.version ?? 0) < 1) {
      const data = { workflowStatus: "Approved" as const, version };
      if (preparationType === "CHEMICAL") {
        await db.preparedChemical.update({ where: { id: record.id }, data });
      } else if (preparationType === "STANDARD") {
        await db.preparedStandard.update({ where: { id: record.id }, data });
      } else {
        await db.preparedStrain.update({ where: { id: record.id }, data });
      }
    }

    created++;
  }

  return { created, skipped };
}

async function main() {
  const chemicals = await db.preparedChemical.findMany({
    select: { id: true, version: true, preparedBy: true },
  });
  const standards = await db.preparedStandard.findMany({
    select: { id: true, version: true, preparedBy: true },
  });
  const strains = await db.preparedStrain.findMany({
    select: { id: true, version: true, preparedBy: true },
  });

  const chem = await backfillType("CHEMICAL", chemicals);
  const std = await backfillType("STANDARD", standards);
  const str = await backfillType("STRAIN", strains);

  console.log("Backfill preparation history complete:");
  console.log(`  CHEMICAL: ${chem.created} created, ${chem.skipped} skipped (${chemicals.length} total)`);
  console.log(`  STANDARD: ${std.created} created, ${std.skipped} skipped (${standards.length} total)`);
  console.log(`  STRAIN:   ${str.created} created, ${str.skipped} skipped (${strains.length} total)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
