/**
 * Compare cached master/lot quantity vs ledger-derived available quantity.
 */
import { db } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/services/inventory-transaction-engine";
import { roundStockQuantity } from "@/lib/inventory-units";

async function main() {
  const mismatches: string[] = [];

  const chemicals = await db.chemical.findMany({ select: { id: true, code: true, quantity: true } });
  for (const c of chemicals) {
    const available = await getAvailableQuantity(db, { sourceType: "Chemical", sourceId: c.id });
    if (Math.abs(available - roundStockQuantity(c.quantity)) > 0.0001) {
      mismatches.push(`Chemical ${c.code}: cache=${c.quantity} ledger=${available}`);
    }
  }

  const standards = await db.standard.findMany({ select: { id: true, code: true, quantity: true } });
  for (const s of standards) {
    const available = await getAvailableQuantity(db, { sourceType: "Standard", sourceId: s.id });
    if (Math.abs(available - roundStockQuantity(s.quantity)) > 0.0001) {
      mismatches.push(`Standard ${s.code}: cache=${s.quantity} ledger=${available}`);
    }
  }

  if (mismatches.length === 0) {
    console.log("Reconcile OK — no mismatches");
  } else {
    console.log(`Found ${mismatches.length} mismatch(es):`);
    mismatches.slice(0, 50).forEach((m) => console.log(" -", m));
    if (mismatches.length > 50) console.log(` ... and ${mismatches.length - 50} more`);
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
