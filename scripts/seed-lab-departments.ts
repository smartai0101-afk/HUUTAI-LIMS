import { db } from "../lib/db";
import { seedLabDepartments } from "../prisma/seed-data/lab-departments";

async function main() {
  await seedLabDepartments(db);
  console.log("Lab departments seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
