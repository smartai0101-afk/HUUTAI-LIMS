/**
 * Safe prod seed: samples module permissions only (6 nav keys).
 * Usage: $env:NODE_ENV="production"; npx tsx scripts/seed-samples-prod.ts
 */
import { db } from "../lib/db";
import { PERMISSION_LABELS } from "../lib/auth/permissions";

const SAMPLE_KEYS = [
  "samples_requests",
  "samples_list",
  "samples_receive",
  "samples_assign",
  "samples_tracking",
  "samples_storage",
] as const;

async function main() {
  for (const key of SAMPLE_KEYS) {
    await db.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key] },
      create: { key, name: PERMISSION_LABELS[key] },
    });
    console.log(`permission upsert: ${key}`);
  }

  console.log("seed-samples-prod.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
