import { db } from "@/lib/db";
import { mapStandard } from "@/lib/mappers";
import { mapStockLot } from "@/lib/map-stock-lot";
import { DEFAULT_STANDARD_GROUPS } from "@/lib/standards-fields";

const stockLotsInclude = {
  stockLots: { orderBy: [{ expiryDate: "asc" as const }, { lot: "asc" as const }] },
};

export async function getStandards() {
  const items = await db.standard.findMany({
    include: { containers: { select: { id: true } }, ...stockLotsInclude },
    orderBy: { code: "asc" },
  });
  return items.map((item) => ({
    ...mapStandard(item),
    stockLots: item.stockLots.map(mapStockLot),
  }));
}

export async function getStandardGroups(): Promise<string[]> {
  const rows = await db.standard.findMany({
    select: { standardGroup: true },
    distinct: ["standardGroup"],
    orderBy: { standardGroup: "asc" },
  });
  const seen = new Set<string>(DEFAULT_STANDARD_GROUPS);
  const groups: string[] = [...DEFAULT_STANDARD_GROUPS];
  for (const row of rows) {
    const value = row.standardGroup.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    groups.push(value);
  }
  return groups;
}

export async function getStandardByCode(code: string) {
  const item = await db.standard.findUnique({
    where: { code },
    include: { containers: { select: { id: true } } },
  });
  return item ? mapStandard(item) : null;
}

export async function getStandardById(id: string) {
  const item = await db.standard.findUnique({
    where: { id },
    include: { containers: { select: { id: true } } },
  });
  return item ? mapStandard(item) : null;
}
