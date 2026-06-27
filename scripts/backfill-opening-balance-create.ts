/**
 * Insert opening-balance CREATE transactions where ledger available != cache.
 * Idempotent — skips refs that already have MigrationOpeningBalance tx.
 *
 * Usage: npx tsx scripts/backfill-opening-balance-create.ts
 */
import { db } from "@/lib/db";
import { ensureAllOpeningBalances } from "@/lib/services/inventory-opening-balance";

async function main() {
  console.log("Backfilling opening balance CREATE transactions...");
  const result = await db.$transaction(async (tx) => ensureAllOpeningBalances(tx));
  console.log("\nDone:", result);
  if (result.errors.length > 0) {
    console.error("Errors:", result.errors);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
