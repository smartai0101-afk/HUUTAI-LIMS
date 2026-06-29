/**
 * Safe prod seed: analysis + delivery module permissions.
 * Usage: $env:NODE_ENV="production"; npx tsx scripts/seed-module-permissions-prod.ts
 */
import { db } from "../lib/db";
import { PERMISSION_LABELS } from "../lib/auth/permissions";

const KEYS = [
  "analysis_inbox",
  "analysis_assign_analyst",
  "analysis_worklist",
  "analysis_worksheet",
  "analysis_results",
  "analysis_qc",
  "analysis_review",
  "delivery_pending",
  "delivery_reports",
  "delivery_history",
  "delivery_issued",
] as const;

async function main() {
  for (const key of KEYS) {
    await db.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key] },
      create: { key, name: PERMISSION_LABELS[key] },
    });
    console.log(`permission upsert: ${key}`);
  }
  console.log("seed-module-permissions-prod.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
