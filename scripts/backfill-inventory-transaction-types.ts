/**
 * Backfill transactionType on InventoryTransaction rows (idempotent).
 * Run after migration 20260701_inventory_tx_engine.
 */
import { db } from "@/lib/db";

async function main() {
  const stockIn = await db.inventoryTransaction.updateMany({
    where: { actionType: "Restore", module: "StockIn", transactionType: null },
    data: { transactionType: "CREATE" },
  });

  const consume = await db.inventoryTransaction.updateMany({
    where: { actionType: "Deduct", transactionType: null },
    data: { transactionType: "CONSUME" },
  });

  const reversal = await db.inventoryTransaction.updateMany({
    where: {
      actionType: "Restore",
      NOT: { module: "StockIn" },
      transactionType: null,
    },
    data: { transactionType: "REVERSAL" },
  });

  console.log("Backfill complete:", {
    create: stockIn.count,
    consume: consume.count,
    reversal: reversal.count,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
