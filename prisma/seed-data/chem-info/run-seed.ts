import { db } from "@/lib/db";
import { seedChemInfoModule } from "./index";

async function main() {
  await seedChemInfoModule(db);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
