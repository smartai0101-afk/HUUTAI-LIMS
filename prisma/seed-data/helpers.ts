import { ContainerStatus } from "@prisma/client";
import { computeStandardStatus } from "../../lib/standard-status";

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function mapChemicalContainerStatus(status: string, expiryDate: Date, quantity: number): ContainerStatus {
  switch (status) {
    case "Low Stock":
      return ContainerStatus.LowStock;
    case "Expired":
      return ContainerStatus.Expired;
    case "Pending Disposal":
      return ContainerStatus.PendingDisposal;
    default:
      return quantity <= 5 ? ContainerStatus.LowStock : ContainerStatus.Available;
  }
}

export function expiryStatus(expiryDate: string) {
  return computeStandardStatus(parseDate(expiryDate));
}

export function padCode(prefix: string, n: number, width = 4) {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}
