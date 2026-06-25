export type PreparedChemicalExpiryStatus = "Ready" | "ExpiringSoon" | "Expired";

export function computePreparedChemicalStatus(
  expiryDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): PreparedChemicalExpiryStatus {
  if (!expiryDate) return "Ready";

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / 86_400_000);

  if (daysLeft <= 0) return "Expired";
  if (daysLeft <= 3) return "ExpiringSoon";
  return "Ready";
}

export function preparedChemicalStatusLabel(status: string): string {
  switch (status) {
    case "ExpiringSoon":
      return "Expiring Soon";
    case "Expired":
      return "Expired";
    case "Ready":
    default:
      return "Ready";
  }
}

export const PREPARED_CHEMICAL_STATUS_FILTERS = ["All", "Ready", "Expiring Soon", "Expired"] as const;
