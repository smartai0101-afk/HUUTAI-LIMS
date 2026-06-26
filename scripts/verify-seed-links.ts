/**
 * Verify extended seed links after npm run db:seed
 * Run: npx tsx scripts/verify-seed-links.ts
 */
import { db } from "@/lib/db";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("=== Verify extended seed links ===\n");

  const chemCount = await db.chemical.count();
  const stdCount = await db.standard.count();
  const strainCount = await db.microbialStrain.count();
  const eqCount = await db.equipment.count();

  assert(chemCount >= 20, `chemicals count ${chemCount} >= 20`);
  assert(stdCount >= 20, `standards count ${stdCount} >= 20`);
  assert(strainCount >= 20, `strains count ${strainCount} >= 20`);
  assert(eqCount >= 20, `equipment count ${eqCount} >= 20`);

  const multiLotChem = await db.chemical.findFirst({ where: { code: "CHEM-0010", lot: "Nhiều lot" } });
  assert(!!multiLotChem, "CHEM-0010 has Nhiều lot");

  const multiLotStd = await db.standard.findFirst({ where: { code: "STD-0007", lot: "Nhiều lot" } });
  assert(!!multiLotStd, "STD-0007 has Nhiều lot");

  const pchem2 = await db.preparedChemical.findUnique({
    where: { code: "PCHEM-0002" },
    include: { ingredients: true },
  });
  assert(!!pchem2 && pchem2.ingredients.length >= 2, "PCHEM-0002 with ingredients");
  assert(!!pchem2?.ingredients.some((i) => i.stockLotId), "PCHEM-0002 has stockLotId on ingredient");

  const pstd5 = await db.preparedStandard.findUnique({
    where: { code: "PSTD-0005" },
    include: { components: true, solvents: true },
  });
  assert(!!pstd5 && pstd5.components.length >= 1, "PSTD-0005 linked to STD-0007");
  assert(!!pstd5?.components[0]?.standardId, "PSTD-0005 component has standardId");

  const pms2 = await db.preparedStrain.findUnique({ where: { code: "PMS-0002" } });
  assert(!!pms2?.sourceStockLotId, "PMS-0002 has sourceStockLotId");

  const calRecords = await db.calibrationRecord.count();
  assert(calRecords >= 4, `calibration records ${calRecords} >= 4`);

  const maintLogs = await db.maintenanceLog.count({ where: { NOT: { completedDate: null } } });
  assert(maintLogs >= 1, "completed maintenance log exists");

  const attachments = await db.equipmentAttachment.count({
    where: { entityType: "EquipmentHistoryEvent" },
  });
  assert(attachments >= 2, `history attachments ${attachments} >= 2`);

  const spareLinks = await db.equipmentSparePartLink.count();
  assert(spareLinks >= 5, `equipment-spare links ${spareLinks} >= 5`);

  const coaWithImage = await db.chemical.count({
    where: { coaPath: { startsWith: "/seed-assets/" } },
  });
  assert(coaWithImage >= 10, `chemicals with seed COA images ${coaWithImage} >= 10`);

  console.log("\n=== All seed link verifications passed ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
