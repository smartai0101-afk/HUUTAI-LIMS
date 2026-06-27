/**
 * Smoke tests for Inventory Transaction Engine.
 */
import { db } from "@/lib/db";
import { roundStockQuantity } from "@/lib/inventory-units";
import { assertTransactionReason } from "@/lib/services/inventory-transaction-types";
import { getAvailableQuantity, getInventorySummary } from "@/lib/services/inventory-transaction-engine";
import {
  normalizeTxQuantityUsed,
  summarizeTransactions,
} from "@/lib/services/inventory-transaction-summary";

async function main() {
  let failed = 0;

  const reasonErr = assertTransactionReason("DISCARD", "");
  if (!reasonErr) {
    console.error("FAIL: empty DISCARD reason should error");
    failed++;
  } else {
    console.log("PASS: DISCARD requires reason");
  }

  const summary = summarizeTransactions([
    { transactionType: "CREATE", quantityUsed: 100 },
    { transactionType: "CONSUME", quantityUsed: 30 },
    { transactionType: "DISCARD", quantityUsed: 10 },
  ]);
  if (summary.available !== 60) {
    console.error("FAIL: expected available 60 got", summary.available);
    failed++;
  } else {
    console.log("PASS: available formula 100-30-10=60");
  }

  const mgAsG = normalizeTxQuantityUsed(1000, "mg", "g");
  if (Math.abs(mgAsG - 1) > 0.0001) {
    console.error("FAIL: expected 1000mg=1g got", mgAsG);
    failed++;
  } else {
    console.log("PASS: unit normalization mg→g");
  }

  const mixedSummary = summarizeTransactions(
    [
      { transactionType: "CREATE", quantityUsed: 10, unit: "g" },
      { transactionType: "CONSUME", quantityUsed: 500, unit: "mg" },
    ],
    "g",
  );
  if (mixedSummary.available !== 9.5) {
    console.error("FAIL: expected mixed unit available 9.5 got", mixedSummary.available);
    failed++;
  } else {
    console.log("PASS: summarize with mixed mg/g units");
  }

  const standards = await db.standard.findMany({
    select: { id: true, code: true, quantity: true },
    take: 20,
  });
  let mismatchCount = 0;
  for (const standard of standards) {
    const available = await getAvailableQuantity(db, {
      sourceType: "Standard",
      sourceId: standard.id,
    });
    const full = await getInventorySummary(db, { sourceType: "Standard", sourceId: standard.id });
    if (Math.abs(available - roundStockQuantity(standard.quantity)) > 0.0001) {
      mismatchCount++;
      console.log(
        `WARN: ${standard.code} cache=${standard.quantity} ledger available=${available}`,
      );
    }
    if (available < 0) {
      console.error("FAIL: negative available for", standard.code);
      failed++;
    }
    if (full.available !== available) {
      console.error("FAIL: summary.available mismatch for", standard.code);
      failed++;
    }
  }

  const std0001 = await db.standard.findFirst({ where: { code: "STD-0001" } });
  if (std0001) {
    const available = await getAvailableQuantity(db, {
      sourceType: "Standard",
      sourceId: std0001.id,
    });
    if (Math.abs(available - roundStockQuantity(std0001.quantity)) > 0.0001) {
      console.error(
        `FAIL: STD-0001 available=${available} cache=${std0001.quantity} — run backfill-opening-balance-create.ts`,
      );
      failed++;
    } else {
      console.log(`PASS: STD-0001 available=${available} matches cache`);
    }
  }

  if (mismatchCount === 0 && standards.length > 0) {
    console.log("PASS: all sampled standards match cache vs ledger");
  }

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log("\nAll inventory transaction engine tests passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
