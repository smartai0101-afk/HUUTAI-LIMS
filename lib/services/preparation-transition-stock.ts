import type { Prisma } from "@prisma/client";
import {
  applyInventoryStockChange,
  chemicalStockLine,
  microbialStrainStockLine,
  preparedStandardComponentToStockLines,
  preparedStandardSolventToStockLines,
  preparedStandardStockLine,
} from "@/lib/inventory-stock";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";

type Tx = Prisma.TransactionClient;

const PREPARED_STRAIN_USE_QTY = 1;

function referenceTypeFor(type: PreparationRecordType): string {
  if (type === "CHEMICAL") return "PreparedChemical";
  if (type === "STANDARD") return "PreparedStandard";
  return "PreparedStrain";
}

function matchesConsumeTransaction(
  tx: {
    sourceType: string;
    sourceId: string;
    stockLotId: string | null;
    quantityUsed: number;
  },
  line: {
    sourceType?: string;
    sourceId: string;
    stockLotId?: string | null;
    quantityUsed: number;
  },
): boolean {
  if (tx.sourceId !== line.sourceId) return false;
  if (tx.stockLotId && line.stockLotId && tx.stockLotId !== line.stockLotId) return false;
  return Math.abs(tx.quantityUsed - line.quantityUsed) < 1e-6;
}

export async function linkPreparationConsumeTransactions(
  tx: Tx,
  type: PreparationRecordType,
  id: string,
): Promise<void> {
  const referenceType = referenceTypeFor(type);
  const consumeTxs = await tx.inventoryTransaction.findMany({
    where: {
      referenceType,
      referenceId: id,
      transactionType: "CONSUME",
    },
    orderBy: { time: "asc" },
  });
  if (consumeTxs.length === 0) return;

  if (type === "CHEMICAL") {
    const row = await tx.preparedChemical.findUnique({
      where: { id },
      include: { ingredients: true },
    });
    if (!row) return;
    for (const ing of row.ingredients) {
      if (ing.consumeTransactionId) continue;
      const match = consumeTxs.find((t) =>
        matchesConsumeTransaction(t, {
          sourceType: "Chemical",
          sourceId: ing.chemicalId,
          stockLotId: ing.stockLotId,
          quantityUsed: ing.quantityUsed,
        }),
      );
      if (match) {
        await tx.preparedChemicalIngredient.update({
          where: { id: ing.id },
          data: { consumeTransactionId: match.id },
        });
      }
    }
    return;
  }

  if (type === "STANDARD") {
    const row = await tx.preparedStandard.findUnique({
      where: { id },
      include: { components: true, solvents: true },
    });
    if (!row) return;
    for (const comp of row.components) {
      if (comp.consumeTransactionId) continue;
      const match = consumeTxs.find((t) => {
        if (comp.sourceType === "Standard" && comp.standardId) {
          return matchesConsumeTransaction(t, {
            sourceType: "Standard",
            sourceId: comp.standardId,
            stockLotId: comp.stockLotId,
            quantityUsed: comp.quantityUsed,
          });
        }
        if (comp.sourceType === "PreparedStandard" && comp.sourcePreparedStandardId) {
          return matchesConsumeTransaction(t, {
            sourceId: comp.sourcePreparedStandardId,
            quantityUsed: comp.quantityUsed,
          });
        }
        return false;
      });
      if (match) {
        await tx.preparedStandardComponent.update({
          where: { id: comp.id },
          data: { consumeTransactionId: match.id },
        });
      }
    }
    for (const sol of row.solvents) {
      if (sol.consumeTransactionId) continue;
      const match = consumeTxs.find((t) =>
        matchesConsumeTransaction(t, {
          sourceType: "Chemical",
          sourceId: sol.chemicalId,
          stockLotId: sol.stockLotId,
          quantityUsed: sol.quantityUsed,
        }),
      );
      if (match) {
        await tx.preparedStandardSolvent.update({
          where: { id: sol.id },
          data: { consumeTransactionId: match.id },
        });
      }
    }
  }
}

export async function creditPreparedStandardOutput(
  tx: Tx,
  id: string,
  user: string,
): Promise<string | null> {
  const row = await tx.preparedStandard.findUnique({ where: { id } });
  if (!row) return "Không tìm thấy chuẩn pha chế";
  if (row.solventVolume <= 0) return null;

  const existing = await tx.inventoryTransaction.findFirst({
    where: {
      sourceType: "PreparedStandard",
      sourceId: id,
      transactionType: "CREATE",
      referenceType: "PreparedStandard",
      referenceId: id,
    },
  });
  if (existing) return null;

  return applyInventoryStockChange(tx, {
    user,
    module: "PreparedStandard",
    referenceType: "PreparedStandard",
    referenceId: id,
    restores: [
      preparedStandardStockLine(id, row.solventVolume, row.unit || row.solventUnit),
    ],
    restoreTransactionType: "CREATE",
    relatedPreparationType: "STANDARD",
    relatedPreparationId: id,
    notes: `Credit output ${row.code}`,
  });
}

export function preparationHasStockDeducted(workflowStatus: string): boolean {
  return workflowStatus === "Prepared" || workflowStatus === "Checked" || workflowStatus === "Approved";
}

export async function deductPreparationStock(
  tx: Tx,
  type: PreparationRecordType,
  id: string,
  user: string,
): Promise<string | null> {
  if (type === "CHEMICAL") {
    const row = await tx.preparedChemical.findUnique({
      where: { id },
      include: { ingredients: true },
    });
    if (!row) return "Không tìm thấy hóa chất pha chế";
    const error = await applyInventoryStockChange(tx, {
      user,
      module: "PreparedChemical",
      referenceType: "PreparedChemical",
      referenceId: id,
      relatedPreparationType: "CHEMICAL",
      relatedPreparationId: id,
      deducts: row.ingredients.map((ing) =>
        chemicalStockLine(ing.chemicalId, ing.quantityUsed, ing.unit, {
          stockLotId: ing.stockLotId,
          lotNumber: ing.lotNumberSnapshot,
        }),
      ),
      notes: `Pha chế ${row.code}`,
    });
    if (error) return error;
    await linkPreparationConsumeTransactions(tx, type, id);
    return null;
  }

  if (type === "STANDARD") {
    const row = await tx.preparedStandard.findUnique({
      where: { id },
      include: { components: true, solvents: true },
    });
    if (!row) return "Không tìm thấy chuẩn pha chế";
    const error = await applyInventoryStockChange(tx, {
      user,
      module: "PreparedStandard",
      referenceType: "PreparedStandard",
      referenceId: id,
      relatedPreparationType: "STANDARD",
      relatedPreparationId: id,
      deducts: [
        ...preparedStandardComponentToStockLines(row.components),
        ...preparedStandardSolventToStockLines(row.solvents),
      ],
      notes: `Pha chế ${row.code}`,
    });
    if (error) return error;
    await linkPreparationConsumeTransactions(tx, type, id);
    return null;
  }

  const row = await tx.preparedStrain.findUnique({
    where: { id },
    include: { sourceStrain: true },
  });
  if (!row) return "Không tìm thấy chủng pha chế";
  if (!row.sourceStockLotId) return "Thiếu lot chủng gốc";
  return applyInventoryStockChange(tx, {
    user,
    module: "PreparedStrain",
    referenceType: "PreparedStrain",
    referenceId: row.code,
    deducts: [
      microbialStrainStockLine(row.sourceStrainId, PREPARED_STRAIN_USE_QTY, row.sourceStrain.unit, {
        stockLotId: row.sourceStockLotId,
        lotNumber: row.sourceLotNumberSnapshot,
      }),
    ],
    notes: `Pha chủng ${row.code}`,
  });
}

export async function restorePreparationStock(
  tx: Tx,
  type: PreparationRecordType,
  id: string,
  user: string,
): Promise<string | null> {
  if (type === "CHEMICAL") {
    const row = await tx.preparedChemical.findUnique({
      where: { id },
      include: { ingredients: true },
    });
    if (!row) return "Không tìm thấy hóa chất pha chế";
    return applyInventoryStockChange(tx, {
      user,
      module: "PreparedChemical",
      referenceType: "PreparedChemical",
      referenceId: id,
      restores: row.ingredients.map((ing) =>
        chemicalStockLine(ing.chemicalId, ing.quantityUsed, ing.unit, {
          stockLotId: ing.stockLotId,
          lotNumber: ing.lotNumberSnapshot,
        }),
      ),
      notes: `Hoàn tồn ${row.code}`,
    });
  }

  if (type === "STANDARD") {
    const row = await tx.preparedStandard.findUnique({
      where: { id },
      include: { components: true, solvents: true },
    });
    if (!row) return "Không tìm thấy chuẩn pha chế";
    return applyInventoryStockChange(tx, {
      user,
      module: "PreparedStandard",
      referenceType: "PreparedStandard",
      referenceId: id,
      restores: [
        ...preparedStandardComponentToStockLines(row.components),
        ...preparedStandardSolventToStockLines(row.solvents),
      ],
      notes: `Hoàn tồn ${row.code}`,
    });
  }

  const row = await tx.preparedStrain.findUnique({
    where: { id },
    include: { sourceStrain: true },
  });
  if (!row) return "Không tìm thấy chủng pha chế";
  if (!row.sourceStockLotId) return null;
  return applyInventoryStockChange(tx, {
    user,
    module: "PreparedStrain",
    referenceType: "PreparedStrain",
    referenceId: row.code,
    restores: [
      microbialStrainStockLine(
        row.sourceStrainId,
        PREPARED_STRAIN_USE_QTY,
        row.sourceStrain?.unit ?? "vial",
        {
          stockLotId: row.sourceStockLotId,
          lotNumber: row.sourceLotNumberSnapshot,
        },
      ),
    ],
    notes: `Hoàn tồn ${row.code}`,
  });
}
