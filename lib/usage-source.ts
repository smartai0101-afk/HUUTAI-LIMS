import type { InventorySourceType, UsageSourceType } from "@prisma/client";

export const USAGE_SOURCE_LABELS: Record<UsageSourceType, string> = {
  Chemical: "Hoá chất gốc",
  Standard: "Chất chuẩn gốc",
  MicrobialStrain: "Chủng gốc vi sinh",
};

export function usageSourceLabel(sourceType: UsageSourceType): string {
  return USAGE_SOURCE_LABELS[sourceType] ?? sourceType;
}

export function toInventorySourceType(sourceType: UsageSourceType): InventorySourceType {
  return sourceType;
}

export function parseUsageSourceType(value: string): UsageSourceType | null {
  if (value === "Chemical" || value === "Standard" || value === "MicrobialStrain") {
    return value;
  }
  return null;
}

export function usageSourceDetailHref(
  sourceType: UsageSourceType,
): "/chemicals" | "/standards" | "/microbial-strains" {
  switch (sourceType) {
    case "Standard":
      return "/standards";
    case "MicrobialStrain":
      return "/microbial-strains";
    default:
      return "/chemicals";
  }
}
