import type { Prisma } from "@prisma/client";
import {
  applyInventoryStockChange,
  chemicalStockLine,
  microbialStrainStockLine,
  preparedStandardComponentToStockLines,
  preparedStandardSolventToStockLines,
} from "@/lib/inventory-stock";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";

type Tx = Prisma.TransactionClient;

const PREPARED_STRAIN_USE_QTY = 1;

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
    return applyInventoryStockChange(tx, {
      user,
      module: "PreparedChemical",
      referenceType: "PreparedChemical",
      referenceId: id,
      deducts: row.ingredients.map((ing) =>
        chemicalStockLine(ing.chemicalId, ing.quantityUsed, ing.unit, {
          stockLotId: ing.stockLotId,
          lotNumber: ing.lotNumberSnapshot,
        }),
      ),
      notes: `Pha chế ${row.code}`,
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
      deducts: [
        ...preparedStandardComponentToStockLines(row.components),
        ...preparedStandardSolventToStockLines(row.solvents),
      ],
      notes: `Pha chế ${row.code}`,
    });
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
