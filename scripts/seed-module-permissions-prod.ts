/**
 * Safe prod seed: LIMS module permissions (samples, analysis, delivery).
 * Usage: $env:NODE_ENV="production"; npx tsx scripts/seed-module-permissions-prod.ts
 */
import { db } from "../lib/db";
import { PERMISSION_LABELS } from "../lib/auth/permissions";

const KEYS = [
  "samples_requests",
  "samples_request_review",
  "samples_list",
  "samples_receive",
  "samples_assign",
  "samples_tracking",
  "samples_storage",
  "samples_reception_log",
  "analysis_inbox",
  "analysis_assign_analyst",
  "analysis_worklist",
  "analysis_worksheet",
  "analysis_sample_prep",
  "analysis_results",
  "analysis_qc",
  "analysis_deviation",
  "analysis_review",
  "delivery_pending",
  "delivery_review",
  "delivery_reports",
  "delivery_history",
  "delivery_issued",
  "delivery_revision",
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
