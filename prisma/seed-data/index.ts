import type { PrismaClient } from "@prisma/client";
import { seedExtendedChemicals } from "./chemicals";
import { seedExtendedEquipment } from "./equipment";
import { seedExtendedEquipmentLifecycle } from "./equipment-lifecycle";
import { seedExtendedPostStockLots } from "./links";
import { seedExtendedStandards } from "./standards";
import { seedExtendedStrains } from "./strains";

export { seedAnalyticalMethods } from "./analytical-methods";
export { seedSamples } from "./samples";

export async function seedExtendedCatalog(prisma: PrismaClient) {
  console.log("Seeding extended catalog demo data...");
  await seedExtendedChemicals(prisma);
  await seedExtendedStandards(prisma);
  await seedExtendedStrains(prisma);
}

export async function seedExtendedEquipmentAll(prisma: PrismaClient) {
  console.log("Seeding extended equipment demo data...");
  await seedExtendedEquipment(prisma);
  await seedExtendedEquipmentLifecycle(prisma);
}

export { seedExtendedPostStockLots };
