import { ContainerStatus } from "@prisma/client";

export function computeContainerStatus(params: {
  quantity: number;
  reorderLevel: number;
  expiryDate: Date;
  forcePendingDisposal?: boolean;
}): ContainerStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(params.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (params.forcePendingDisposal) {
    return ContainerStatus.PendingDisposal;
  }
  if (expiry < now) {
    return ContainerStatus.Expired;
  }
  if (params.quantity <= params.reorderLevel) {
    return ContainerStatus.LowStock;
  }
  return ContainerStatus.Available;
}

export function containerStatusLabel(status: ContainerStatus): string {
  switch (status) {
    case ContainerStatus.LowStock:
      return "Low Stock";
    case ContainerStatus.PendingDisposal:
      return "Pending Disposal";
    default:
      return status;
  }
}
