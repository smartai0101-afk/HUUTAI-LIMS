import { db as prisma } from "../lib/db";
import { seedChemInfoModule } from "../prisma/seed-data/chem-info/index";

async function main() {
  await seedChemInfoModule(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
