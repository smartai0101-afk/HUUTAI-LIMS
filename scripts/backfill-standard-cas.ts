/**
 * Backfill Standard.casNumber for rows that were created before the CAS migration.
 * Safe to run multiple times — only updates rows where casNumber is empty.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAS_BY_CODE: Record<string, string> = {
  "STD-0001": "58-08-2",
  "STD-0002": "65-85-0",
  "STD-0003": "7647-14-5",
  "STD-0004": "7440-02-0",
  "STD-0005": "124-38-9",
  "STD-0006": "7440-18-8",
};

async function main() {
  let updated = 0;

  for (const [code, casNumber] of Object.entries(CAS_BY_CODE)) {
    const result = await prisma.standard.updateMany({
      where: { code, casNumber: "" },
      data: { casNumber },
    });
    if (result.count > 0) {
      updated += result.count;
      console.log(`Updated ${code} → CAS ${casNumber}`);
    }
  }

  const remaining = await prisma.standard.count({ where: { casNumber: "" } });
  console.log(`Backfill complete: ${updated} updated, ${remaining} standards still without CAS`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
