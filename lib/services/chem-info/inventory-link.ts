import { db } from "@/lib/db";
import type { InventoryChemicalLink } from "@/types/chem-info";

export async function findInventoryChemicalsByCas(
  casNumber: string,
): Promise<InventoryChemicalLink[]> {
  if (!casNumber.trim()) return [];
  const rows = await db.chemical.findMany({
    where: { casNumber: casNumber.trim() },
    select: { id: true, code: true, name: true, casNumber: true, quantity: true, unit: true },
    orderBy: { code: "asc" },
  });
  return rows;
}
