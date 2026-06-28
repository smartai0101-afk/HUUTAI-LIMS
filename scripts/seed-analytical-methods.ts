import { db } from "../lib/db";
import { seedAnalyticalMethods } from "../prisma/seed-data/analytical-methods";

async function main() {
  await seedAnalyticalMethods(db);
  console.log("seed-analytical-methods.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
