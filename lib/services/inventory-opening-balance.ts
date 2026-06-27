import type { InventorySourceType, Prisma } from "@prisma/client";
import { roundStockQuantity } from "@/lib/inventory-units";
import type { InventoryItemRef } from "@/lib/services/inventory-transaction-engine";
import { getInventoryTransactionsForItem } from "@/lib/services/inventory-transaction-engine";
import {
  type InventorySummary,
  summarizeTransactions,
} from "@/lib/services/inventory-transaction-summary";

import {
  OPENING_BALANCE_MODULE,
  OPENING_BALANCE_REASON,
} from "@/lib/services/inventory-transaction-types";

type Tx = Prisma.TransactionClient;

const EPSILON = 0.0001;

export type OpeningBalanceRef = InventoryItemRef & {
  sourceCode: string;
  unit: string;
  cacheQuantity: number;
};

export function computeOpeningCreateQuantity(
  summary: InventorySummary,
  cacheQuantity: number,
): number {
  const increases = summary.created + summary.adjustmentIn + summary.reversed;
  const decreases = summary.consumed + summary.discarded + summary.adjustmentOut;
  return roundStockQuantity(cacheQuantity - increases + decreases);
}

export async function hasOpeningBalanceMigration(
  tx: Tx,
  ref: InventoryItemRef,
): Promise<boolean> {
  const row = await tx.inventoryTransaction.findFirst({
    where: {
      module: OPENING_BALANCE_MODULE,
      sourceType: ref.sourceType,
      sourceId: ref.sourceId,
      stockLotId: ref.stockLotId ?? null,
    },
    select: { id: true },
  });
  return row != null;
}

export async function ensureOpeningBalanceForRef(
  tx: Tx,
  ref: OpeningBalanceRef,
  user = "System",
): Promise<{ created: boolean; openingQty?: number; skipped?: string }> {
  if (await hasOpeningBalanceMigration(tx, ref)) {
    return { created: false, skipped: "already migrated" };
  }

  const rows = await getInventoryTransactionsForItem(tx, ref);
  const typed = rows
    .filter((r) => r.transactionType != null)
    .map((r) => ({
      transactionType: r.transactionType!,
      quantityUsed: r.quantityUsed,
      unit: r.unit,
    }));

  const cacheQty = roundStockQuantity(ref.cacheQuantity);
  const summary = summarizeTransactions(typed, ref.unit);
  const ledgerAvailable = summary.available;

  if (Math.abs(ledgerAvailable - cacheQty) <= EPSILON) {
    return { created: false, skipped: "ledger matches cache" };
  }

  const openingQty = computeOpeningCreateQuantity(summary, cacheQty);
  if (openingQty < -EPSILON) {
    return { created: false, skipped: `negative opening ${openingQty}` };
  }
  if (openingQty <= EPSILON && cacheQty <= EPSILON) {
    return { created: false, skipped: "zero balance" };
  }

  const firstTx = rows[0];
  const migrationTime = firstTx?.time
    ? new Date(firstTx.time.getTime() - 1000)
    : new Date();

  await tx.inventoryTransaction.create({
    data: {
      time: migrationTime,
      user,
      module: OPENING_BALANCE_MODULE,
      sourceType: ref.sourceType,
      sourceId: ref.sourceId,
      sourceCode: ref.sourceCode,
      stockLotId: ref.stockLotId ?? null,
      quantityBefore: 0,
      quantityUsed: openingQty,
      quantityAfter: openingQty,
      unit: ref.unit,
      actionType: "Restore",
      transactionType: "CREATE",
      reason: OPENING_BALANCE_REASON,
      referenceType: "OpeningBalance",
      referenceId: ref.stockLotId ?? ref.sourceId,
      notes: OPENING_BALANCE_REASON,
    },
  });

  return { created: true, openingQty };
}

async function lotCountFor(
  tx: Tx,
  sourceType: InventorySourceType,
  sourceId: string,
): Promise<number> {
  if (sourceType === "Chemical") {
    return tx.stockLot.count({ where: { chemicalId: sourceId } });
  }
  if (sourceType === "Standard") {
    return tx.stockLot.count({ where: { standardId: sourceId } });
  }
  if (sourceType === "MicrobialStrain") {
    return tx.stockLot.count({ where: { microbialStrainId: sourceId } });
  }
  return 0;
}

export async function ensureAllOpeningBalances(
  tx: Tx,
  user = "System",
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  async function processRef(ref: OpeningBalanceRef, label: string) {
    const result = await ensureOpeningBalanceForRef(tx, ref, user);
    if (result.created) {
      created++;
      console.log(`  + CREATE ${result.openingQty} ${ref.unit} — ${label}`);
    } else {
      skipped++;
    }
    if (result.skipped?.startsWith("negative")) {
      errors.push(`${label}: ${result.skipped}`);
    }
  }

  const chemicals = await tx.chemical.findMany({
    select: { id: true, code: true, unit: true, quantity: true },
  });
  for (const item of chemicals) {
    const lotCount = await lotCountFor(tx, "Chemical", item.id);
    if (lotCount > 0) {
      const lots = await tx.stockLot.findMany({
        where: { chemicalId: item.id },
        select: { id: true, quantity: true, unit: true },
      });
      for (const lot of lots) {
        await processRef(
          {
            sourceType: "Chemical",
            sourceId: item.id,
            sourceCode: item.code,
            unit: lot.unit || item.unit,
            stockLotId: lot.id,
            cacheQuantity: lot.quantity,
          },
          `Chemical ${item.code} lot ${lot.id}`,
        );
      }
    } else {
      await processRef(
        {
          sourceType: "Chemical",
          sourceId: item.id,
          sourceCode: item.code,
          unit: item.unit,
          cacheQuantity: item.quantity,
        },
        `Chemical ${item.code}`,
      );
    }
  }

  const standards = await tx.standard.findMany({
    select: { id: true, code: true, unit: true, quantity: true },
  });
  for (const item of standards) {
    const lotCount = await lotCountFor(tx, "Standard", item.id);
    if (lotCount > 0) {
      const lots = await tx.stockLot.findMany({
        where: { standardId: item.id },
        select: { id: true, quantity: true, unit: true },
      });
      for (const lot of lots) {
        await processRef(
          {
            sourceType: "Standard",
            sourceId: item.id,
            sourceCode: item.code,
            unit: lot.unit || item.unit,
            stockLotId: lot.id,
            cacheQuantity: lot.quantity,
          },
          `Standard ${item.code} lot ${lot.id}`,
        );
      }
    } else {
      await processRef(
        {
          sourceType: "Standard",
          sourceId: item.id,
          sourceCode: item.code,
          unit: item.unit,
          cacheQuantity: item.quantity,
        },
        `Standard ${item.code}`,
      );
    }
  }

  const strains = await tx.microbialStrain.findMany({
    select: { id: true, code: true, unit: true, quantity: true },
  });
  for (const item of strains) {
    const lotCount = await lotCountFor(tx, "MicrobialStrain", item.id);
    if (lotCount > 0) {
      const lots = await tx.stockLot.findMany({
        where: { microbialStrainId: item.id },
        select: { id: true, quantity: true, unit: true },
      });
      for (const lot of lots) {
        await processRef(
          {
            sourceType: "MicrobialStrain",
            sourceId: item.id,
            sourceCode: item.code,
            unit: lot.unit || item.unit,
            stockLotId: lot.id,
            cacheQuantity: lot.quantity,
          },
          `Strain ${item.code} lot ${lot.id}`,
        );
      }
    } else {
      await processRef(
        {
          sourceType: "MicrobialStrain",
          sourceId: item.id,
          sourceCode: item.code,
          unit: item.unit,
          cacheQuantity: item.quantity,
        },
        `Strain ${item.code}`,
      );
    }
  }

  const prepared = await tx.preparedStandard.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, unit: true, solventUnit: true, quantity: true },
  });
  for (const item of prepared) {
    await processRef(
      {
        sourceType: "PreparedStandard",
        sourceId: item.id,
        sourceCode: item.code,
        unit: item.unit || item.solventUnit,
        cacheQuantity: item.quantity,
      },
      `PreparedStandard ${item.code}`,
    );
  }

  return { created, skipped, errors };
}
