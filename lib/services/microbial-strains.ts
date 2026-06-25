import { db } from "@/lib/db";
import { mapMicrobialStrain } from "@/lib/mappers";
import { mapStockLot } from "@/lib/map-stock-lot";
import { DEFAULT_STRAIN_GROUPS } from "@/lib/strains-fields";

const stockLotsInclude = {
  stockLots: { orderBy: [{ expiryDate: "asc" as const }, { lot: "asc" as const }] },
};

export async function getMicrobialStrains() {
  const items = await db.microbialStrain.findMany({ orderBy: { code: "asc" }, include: stockLotsInclude });
  return items.map((item) => ({
    ...mapMicrobialStrain(item),
    stockLots: item.stockLots.map(mapStockLot),
  }));
}

export async function getStrainGroups(): Promise<string[]> {
  const rows = await db.microbialStrain.findMany({
    select: { strainGroup: true },
    distinct: ["strainGroup"],
    orderBy: { strainGroup: "asc" },
  });
  const seen = new Set<string>(DEFAULT_STRAIN_GROUPS);
  const groups: string[] = [...DEFAULT_STRAIN_GROUPS];
  for (const row of rows) {
    const value = row.strainGroup.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    groups.push(value);
  }
  return groups;
}
