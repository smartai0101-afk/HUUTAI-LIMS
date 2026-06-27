import type { UsageSourceType } from "@prisma/client";
import { getChemicals } from "@/lib/services/chemicals";
import { enrichItemWithAvailable } from "@/lib/services/inventory-available-enrichment";
import { getMicrobialStrains } from "@/lib/services/microbial-strains";
import { getStandards } from "@/lib/services/standards";
import { usageSourceLabel } from "@/lib/usage-source";
import { formatStockQty } from "@/lib/inventory-units";
import type { StockLotView } from "@/types";

export type UsageLogItemOption = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  sourceType: UsageSourceType;
  sourceLabel: string;
  label: string;
  stockLots: StockLotView[];
};

function formatOption(
  item: {
    id: string;
    code: string;
    name: string;
    quantity: number;
    unit: string;
    stockLots: StockLotView[];
  },
  sourceType: UsageSourceType,
): UsageLogItemOption {
  const sourceLabel = usageSourceLabel(sourceType);
  const unitSuffix = item.unit.trim() ? ` ${item.unit.trim()}` : "";
  const availableLabel = formatStockQty(item.quantity);
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    sourceType,
    sourceLabel,
    label: `${item.code} — ${item.name} (còn ${availableLabel}${unitSuffix})`,
    stockLots: item.stockLots,
  };
}

export async function getUsageLogItemOptions(): Promise<UsageLogItemOption[]> {
  const [chemicals, standards, strains] = await Promise.all([
    getChemicals(),
    getStandards(),
    getMicrobialStrains(),
  ]);

  const options: UsageLogItemOption[] = [];

  for (const item of chemicals) {
    const enriched = await enrichItemWithAvailable("Chemical", item.id, item.stockLots);
    options.push(formatOption({ ...item, ...enriched }, "Chemical"));
  }
  for (const item of standards) {
    const enriched = await enrichItemWithAvailable("Standard", item.id, item.stockLots);
    options.push(formatOption({ ...item, ...enriched }, "Standard"));
  }
  for (const item of strains) {
    const enriched = await enrichItemWithAvailable("MicrobialStrain", item.id, item.stockLots);
    options.push(formatOption({ ...item, ...enriched }, "MicrobialStrain"));
  }

  return options.sort((a, b) => a.code.localeCompare(b.code));
}

export async function findUsageLogItemByCode(
  sourceType: UsageSourceType,
  code: string,
): Promise<UsageLogItemOption | null> {
  const options = await getUsageLogItemOptions();
  return options.find((item) => item.sourceType === sourceType && item.code === code) ?? null;
}
