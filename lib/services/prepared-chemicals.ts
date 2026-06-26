import { db } from "@/lib/db";
import { formatIngredientLine } from "@/lib/prepared-chemicals-fields";
import {
  computePreparedChemicalStatus,
  preparedChemicalStatusLabel,
} from "@/lib/prepared-chemical-status";
import { toDateString } from "@/lib/mappers";
import { mapPreparationWorkflowFields } from "@/lib/map-preparation-workflow";
import type { PreparedChemicalIngredientView, PreparedChemicalView } from "@/types";

function mapIngredient(row: {
  id: string;
  chemicalId: string;
  stockLotId?: string | null;
  chemicalNameSnapshot: string;
  casProductCodeSnapshot: string;
  lotNumberSnapshot: string;
  quantityUsed: number;
  unit: string;
}): PreparedChemicalIngredientView {
  return {
    id: row.id,
    chemicalId: row.chemicalId,
    stockLotId: row.stockLotId ?? null,
    chemicalName: row.chemicalNameSnapshot,
    casProductCode: row.casProductCodeSnapshot,
    lotNumber: row.lotNumberSnapshot,
    quantityUsed: row.quantityUsed,
    unit: row.unit,
    displayLine: formatIngredientLine(
      row.chemicalNameSnapshot,
      row.lotNumberSnapshot,
      row.quantityUsed,
      row.unit,
    ),
  };
}

export async function getPreparedChemicals(): Promise<PreparedChemicalView[]> {
  const rows = await db.preparedChemical.findMany({
    where: { deletedAt: null },
    include: {
      ingredients: { orderBy: { id: "asc" } },
      preparedByStaff: { select: { name: true } },
      checkedByStaff: { select: { name: true } },
      approvedByStaff: { select: { name: true } },
    },
    orderBy: { code: "asc" },
  });

  return rows.map((row) => {
    const ingredients = row.ingredients.map(mapIngredient);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      concentration: row.concentration,
      concentrationUnit: row.concentrationUnit,
      preparedQuantity: row.preparedQuantity,
      unit: row.unit,
      preparedDate: toDateString(row.preparedDate),
      preparedBy: row.preparedBy,
      expiryDate: toDateString(row.expiryDate),
      storageLocation: row.storageLocation,
      storageCondition: row.storageCondition,
      status: preparedChemicalStatusLabel(computePreparedChemicalStatus(row.expiryDate)),
      notes: row.notes,
      ingredients,
      ingredientsSummary: ingredients.map((i) => i.displayLine).join("\n"),
      ...mapPreparationWorkflowFields(row),
    };
  });
}
