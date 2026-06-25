export type StandardExpiryStatus = "Ready" | "ExpiringSoon" | "Expired";

export function computeStandardStatus(expiryDate: Date | null | undefined): StandardExpiryStatus {
  if (!expiryDate) return "Ready";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "Expired";

  const threshold = new Date(today);
  threshold.setMonth(threshold.getMonth() + 3);

  if (expiry <= threshold) return "ExpiringSoon";
  return "Ready";
}

export function standardStatusLabel(status: string): string {
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

export const STANDARD_STATUS_FILTERS = ["All", "Ready", "Expiring Soon", "Expired"] as const;
