import { PrismaClient } from "@prisma/client";
import { seedAnalysisAnalysts } from "../prisma/seed-data/analysis-analysts";
import { seedDemoAnalysis } from "../prisma/seed-data/analysis/demo-analysis";
import { seedDemoReports } from "../prisma/seed-data/results-delivery/demo-reports";

const prisma = new PrismaClient();

async function main() {
  await seedAnalysisAnalysts(prisma);
  await seedDemoAnalysis(prisma);
  await seedDemoReports(prisma);
  console.log("Analysis seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
