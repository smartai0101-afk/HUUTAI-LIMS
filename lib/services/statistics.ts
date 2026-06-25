import { getChemicals } from "@/lib/services/chemicals";
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

  const rows: InventoryStatRow[] = [
    ...chemicals.map((item) => ({
      id: item.id,
      sourceType: "chemical" as const,
      sourceLabel: "Hoá chất gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: formatCasOrProduct(item.casNumber, item.productCode),
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity: item.quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/chemicals" as const,
      stockLots: item.stockLots,
    })),
    ...standards.map((item) => ({
      id: item.id,
      sourceType: "standard" as const,
      sourceLabel: "Chất chuẩn gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.productCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity: item.quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/standards" as const,
      stockLots: item.stockLots,
    })),
    ...strains.map((item) => ({
      id: item.id,
      sourceType: "microbial" as const,
      sourceLabel: "Chủng gốc vi sinh",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.atccProductCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity: item.quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/microbial-strains" as const,
      stockLots: item.stockLots,
    })),
  ];

  return rows.sort((a, b) => a.code.localeCompare(b.code));
}
