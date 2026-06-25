import { db } from "@/lib/db";
import { mapChemical } from "@/lib/mappers";
import { mapStockLot } from "@/lib/map-stock-lot";
import { DEFAULT_CHEMICAL_GROUPS } from "@/lib/chemicals-fields";

const stockLotsInclude = {
  stockLots: { orderBy: [{ expiryDate: "asc" as const }, { lot: "asc" as const }] },
};

export async function getChemicals() {
  const items = await db.chemical.findMany({ orderBy: { code: "asc" }, include: stockLotsInclude });
  return items.map((item) => ({
    ...mapChemical(item),
    stockLots: item.stockLots.map(mapStockLot),
  }));
}

export async function getChemicalGroups(): Promise<string[]> {
  const rows = await db.chemical.findMany({
    select: { chemicalGroup: true },
    distinct: ["chemicalGroup"],
    orderBy: { chemicalGroup: "asc" },
  });
  const seen = new Set<string>(DEFAULT_CHEMICAL_GROUPS);
  const groups: string[] = [...DEFAULT_CHEMICAL_GROUPS];
  for (const row of rows) {
    const value = row.chemicalGroup.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    groups.push(value);
  }
  return groups;
}

export async function getChemicalByCode(code: string) {
  const item = await db.chemical.findUnique({ where: { code } });
  return item ? mapChemical(item) : null;
}

export async function getChemicalById(id: string) {
  const item = await db.chemical.findUnique({ where: { id } });
  return item ? mapChemical(item) : null;
}
