import { PrismaClient } from "@prisma/client";
import { seedSamples } from "./seed-samples";

const prisma = new PrismaClient();

seedSamples(prisma)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
