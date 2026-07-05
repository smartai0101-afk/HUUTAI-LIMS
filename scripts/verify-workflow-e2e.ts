/**
 * Smoke test workflow tables and services exist.
 * Usage: npx tsx scripts/verify-workflow-e2e.ts
 */
import { db } from "../lib/db";

async function main() {
  const [events, deviations, attachments, reviews, deliveryLogs] = await Promise.all([
    db.workflowEvent.count(),
    db.deviation.count(),
    db.limsAttachment.count(),
    db.technicalReview.count(),
    db.reportDeliveryLog.count(),
  ]);

  console.log("WorkflowEvent:", events);
  console.log("Deviation:", deviations);
  console.log("LimsAttachment:", attachments);
  console.log("TechnicalReview:", reviews);
  console.log("ReportDeliveryLog:", deliveryLogs);
  console.log("verify-workflow-e2e.ts OK");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
