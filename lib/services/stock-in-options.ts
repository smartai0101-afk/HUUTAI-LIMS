import type { StockInSourceType } from "@prisma/client";
import type { StockLotView } from "@/types";
import { getChemicals } from "@/lib/services/chemicals";
import { getMicrobialStrains } from "@/lib/services/microbial-strains";
import { getStandards } from "@/lib/services/standards";
import { stockInSourceLabel } from "@/lib/services/stock-in-match";

export type StockInMasterOption = {
  id: string;
  code: string;
  name: string;
  sourceType: StockInSourceType;
  sourceLabel: string;
  label: string;
  unit?: string;
  chemicalGroup?: string;
  standardGroup?: string;
  strainGroup?: string;
  manufacturer: string;
  casNumber?: string;
  productCode?: string;
  atccProductCode?: string;
  purity?: string;
  uncertainty?: string;
  storageCondition?: string;
  stockLots?: StockLotView[];
};

function mapChemical(item: Awaited<ReturnType<typeof getChemicals>>[number]): StockInMasterOption {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    sourceType: "Chemical",
    sourceLabel: stockInSourceLabel("Chemical"),
    label: `${item.code} — ${item.name}`,
    unit: item.unit,
    chemicalGroup: item.chemicalGroup,
    manufacturer: item.manufacturer,
    casNumber: item.casNumber,
    productCode: item.productCode,
    purity: item.purity,
    uncertainty: item.uncertainty,
    storageCondition: item.storageCondition,
    stockLots: item.stockLots,
  };
}

function mapStandard(item: Awaited<ReturnType<typeof getStandards>>[number]): StockInMasterOption {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    sourceType: "Standard",
    sourceLabel: stockInSourceLabel("Standard"),
    label: `${item.code} — ${item.name}`,
    unit: item.unit,
    standardGroup: item.standardGroup,
    manufacturer: item.manufacturer,
    casNumber: item.casNumber,
    productCode: item.productCode,
    purity: item.purity,
    uncertainty: item.uncertainty,
    storageCondition: item.storageCondition,
    stockLots: item.stockLots,
  };
}

function mapStrain(item: Awaited<ReturnType<typeof getMicrobialStrains>>[number]): StockInMasterOption {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    sourceType: "MicrobialStrain",
    sourceLabel: stockInSourceLabel("MicrobialStrain"),
    label: `${item.code} — ${item.name}`,
    unit: item.unit,
    strainGroup: item.strainGroup,
    manufacturer: item.manufacturer,
    atccProductCode: item.atccProductCode,
    storageCondition: item.storageCondition,
    stockLots: item.stockLots,
  };
}

export async function getStockInMasterOptions(
  sourceType?: StockInSourceType,
): Promise<StockInMasterOption[]> {
  if (sourceType === "Chemical") {
    return (await getChemicals()).map(mapChemical);
  }
  if (sourceType === "Standard") {
    return (await getStandards()).map(mapStandard);
  }
  if (sourceType === "MicrobialStrain") {
    return (await getMicrobialStrains()).map(mapStrain);
  }

  const [chemicals, standards, strains] = await Promise.all([
    getChemicals(),
    getStandards(),
    getMicrobialStrains(),
  ]);
  return [...chemicals.map(mapChemical), ...standards.map(mapStandard), ...strains.map(mapStrain)];
}
