/**
 * Safe prod seed: methods permissions + demo analytical methods only.
 * Usage: $env:NODE_ENV="production"; npx tsx scripts/seed-methods-prod.ts
 */
import { db } from "../lib/db";
import { PERMISSION_LABELS } from "../lib/auth/permissions";
import { seedAnalyticalMethods } from "../prisma/seed-data/analytical-methods";

const METHOD_KEYS = ["methods_dashboard", "methods_list"] as const;

async function main() {
  for (const key of METHOD_KEYS) {
    await db.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key] },
      create: { key, name: PERMISSION_LABELS[key] },
    });
    console.log(`permission upsert: ${key}`);
  }

  await seedAnalyticalMethods(db);
  console.log("seed-methods-prod.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
