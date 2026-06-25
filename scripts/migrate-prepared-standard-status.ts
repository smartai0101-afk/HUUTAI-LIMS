import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE PreparedStandard
    SET status = CASE status
      WHEN 'Available' THEN 'Ready'
      WHEN 'InUse' THEN 'Ready'
      WHEN 'LowStock' THEN 'ExpiringSoon'
      WHEN 'PendingReview' THEN 'Ready'
      WHEN 'PendingDisposal' THEN 'Expired'
      WHEN 'Expired' THEN 'Expired'
      ELSE 'Ready'
    END
  `);
  const rows = await prisma.preparedStandard.findMany({
    select: { code: true, status: true },
    orderBy: { code: "asc" },
  });
  console.log("Migrated PreparedStandard.status:");
  rows.forEach((r) => console.log(`  ${r.code}: ${r.status}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
