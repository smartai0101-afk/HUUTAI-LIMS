import { computePreparedChemicalStatus } from "@/lib/prepared-chemical-status";
import type { StandardExpiryStatus } from "@prisma/client";

export function computePreparedStandardStatus(
  expiryDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): StandardExpiryStatus {
  return computePreparedChemicalStatus(expiryDate, referenceDate);
}

/** Ready → Available (khác nhãn Hóa chất pha chế). */
export function preparedStandardStatusLabel(status: StandardExpiryStatus | string): string {
  switch (status) {
    case "ExpiringSoon":
      return "Expiring Soon";
    case "Expired":
      return "Expired";
    case "Ready":
    default:
      return "Available";
  }
}

export function preparedStandardDisplayStatus(
  expiryDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): string {
  return preparedStandardStatusLabel(computePreparedStandardStatus(expiryDate, referenceDate));
}

export const PREPARED_STANDARD_STATUS_FILTERS = [
  "All",
  "Available",
  "Expiring Soon",
  "Expired",
] as const;
