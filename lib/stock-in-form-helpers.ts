import type { StockInMasterOption } from "@/lib/services/stock-in-options";
import {
  chemicalIdentityMatches,
  standardIdentityMatches,
  strainIdentityMatches,
  type ChemicalIdentity,
  type StandardIdentity,
  type StrainIdentity,
} from "@/lib/services/stock-in-match";

function chemicalOptionIdentity(option: StockInMasterOption): ChemicalIdentity {
  return {
    name: option.name,
    casNumber: option.casNumber ?? "",
    manufacturer: option.manufacturer,
    productCode: option.productCode ?? "",
  };
}

function standardOptionIdentity(option: StockInMasterOption): StandardIdentity {
  return {
    name: option.name,
    manufacturer: option.manufacturer,
    productCode: option.productCode ?? "",
  };
}

function strainOptionIdentity(option: StockInMasterOption): StrainIdentity {
  return {
    name: option.name,
    atccProductCode: option.atccProductCode ?? "",
    manufacturer: option.manufacturer,
  };
}

export function findChemicalOptionByIdentity(
  options: StockInMasterOption[],
  input: ChemicalIdentity,
): StockInMasterOption | undefined {
  return options.find((option) => chemicalIdentityMatches(chemicalOptionIdentity(option), input));
}

export function findStandardOptionByIdentity(
  options: StockInMasterOption[],
  input: StandardIdentity,
): StockInMasterOption | undefined {
  return options.find((option) => standardIdentityMatches(standardOptionIdentity(option), input));
}

export function findStrainOptionByIdentity(
  options: StockInMasterOption[],
  input: StrainIdentity,
): StockInMasterOption | undefined {
  return options.find((option) => strainIdentityMatches(strainOptionIdentity(option), input));
}

export function chemicalOptionMatches(option: StockInMasterOption, input: ChemicalIdentity): boolean {
  return chemicalIdentityMatches(chemicalOptionIdentity(option), input);
}

export function standardOptionMatches(option: StockInMasterOption, input: StandardIdentity): boolean {
  return standardIdentityMatches(standardOptionIdentity(option), input);
}

export function strainOptionMatches(option: StockInMasterOption, input: StrainIdentity): boolean {
  return strainIdentityMatches(strainOptionIdentity(option), input);
}
