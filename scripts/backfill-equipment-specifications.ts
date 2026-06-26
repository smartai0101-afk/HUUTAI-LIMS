/**
 * Backfill Equipment.specifications from seed map (idempotent — chỉ ghi khi đang rỗng).
 */
import { PrismaClient } from "@prisma/client";
import { EQUIPMENT_SPECIFICATIONS } from "../prisma/seed-data/equipment-specifications";

const db = new PrismaClient();

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [code, specs] of Object.entries(EQUIPMENT_SPECIFICATIONS)) {
    const row = await db.equipment.findUnique({ where: { code } });
    if (!row) {
      console.log(`  skip ${code}: not in DB`);
      skipped++;
      continue;
    }
    if (row.specifications.trim()) {
      console.log(`  skip ${code}: already has specifications`);
      skipped++;
      continue;
    }
    await db.equipment.update({
      where: { code },
      data: { specifications: specs },
    });
    console.log(`  updated ${code}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
