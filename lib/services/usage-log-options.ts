import type { UsageSourceType } from "@prisma/client";
import { getChemicals } from "@/lib/services/chemicals";
import { getMicrobialStrains } from "@/lib/services/microbial-strains";
import { getStandards } from "@/lib/services/standards";
import { usageSourceLabel } from "@/lib/usage-source";
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
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    sourceType,
    sourceLabel,
    label: `${item.code} — ${item.name} (còn ${item.quantity}${unitSuffix})`,
    stockLots: item.stockLots,
  };
}

export async function getUsageLogItemOptions(): Promise<UsageLogItemOption[]> {
  const [chemicals, standards, strains] = await Promise.all([
    getChemicals(),
    getStandards(),
    getMicrobialStrains(),
  ]);

  return [
    ...chemicals.map((item) => formatOption(item, "Chemical")),
    ...standards.map((item) => formatOption(item, "Standard")),
    ...strains.map((item) => formatOption(item, "MicrobialStrain")),
  ].sort((a, b) => a.code.localeCompare(b.code));
}

export async function findUsageLogItemByCode(
  sourceType: UsageSourceType,
  code: string,
): Promise<UsageLogItemOption | null> {
  const options = await getUsageLogItemOptions();
  return options.find((item) => item.sourceType === sourceType && item.code === code) ?? null;
}
