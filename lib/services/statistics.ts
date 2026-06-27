import { getChemicals } from "@/lib/services/chemicals";
import { enrichItemWithAvailable } from "@/lib/services/inventory-available-enrichment";
import { getMicrobialStrains } from "@/lib/services/microbial-strains";
import { getStandards } from "@/lib/services/standards";
import type { InventoryStatRow } from "@/types";

function formatCasOrProduct(casNumber: string, productCode: string): string {
  const parts = [casNumber.trim(), productCode.trim()].filter(Boolean);
  return parts.join(" / ");
}

export async function getInventoryStatistics(): Promise<InventoryStatRow[]> {
  const [chemicals, standards, strains] = await Promise.all([
    getChemicals(),
    getStandards(),
    getMicrobialStrains(),
  ]);

  const rows: InventoryStatRow[] = [];

  for (const item of chemicals) {
    const { quantity, stockLots } = await enrichItemWithAvailable("Chemical", item.id, item.stockLots);
    rows.push({
      id: item.id,
      sourceType: "chemical",
      sourceLabel: "Hoá chất gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: formatCasOrProduct(item.casNumber, item.productCode),
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/chemicals",
      stockLots,
    });
  }

  for (const item of standards) {
    const { quantity, stockLots } = await enrichItemWithAvailable("Standard", item.id, item.stockLots);
    rows.push({
      id: item.id,
      sourceType: "standard",
      sourceLabel: "Chất chuẩn gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.productCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/standards",
      stockLots,
    });
  }

  for (const item of strains) {
    const { quantity, stockLots } = await enrichItemWithAvailable(
      "MicrobialStrain",
      item.id,
      item.stockLots,
    );
    rows.push({
      id: item.id,
      sourceType: "microbial",
      sourceLabel: "Chủng gốc vi sinh",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.atccProductCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/microbial-strains",
      stockLots,
    });
  }

  return rows.sort((a, b) => a.code.localeCompare(b.code));
}
