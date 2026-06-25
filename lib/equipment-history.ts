import { randomUUID } from "crypto";
import type {
  EquipmentHistoryEventType,
  EquipmentHistorySourceType,
  Prisma,
} from "@prisma/client";

type AppendParams = {
  equipmentId: string;
  eventType: EquipmentHistoryEventType;
  eventDate: Date;
  title: string;
  description?: string;
  sourceType: EquipmentHistorySourceType;
  sourceId: string;
  createdBy?: string;
  updatedBy?: string;
};

export async function appendEquipmentHistory(
  tx: Prisma.TransactionClient,
  params: AppendParams,
) {
  const sourceId = params.sourceId || randomUUID();

  return tx.equipmentHistoryEvent.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: params.sourceType,
        sourceId,
      },
    },
    create: {
      equipmentId: params.equipmentId,
      eventType: params.eventType,
      eventDate: params.eventDate,
      title: params.title,
      description: params.description ?? "",
      sourceType: params.sourceType,
      sourceId,
      createdBy: params.createdBy ?? "",
      updatedBy: params.updatedBy ?? params.createdBy ?? "",
    },
    update: {
      equipmentId: params.equipmentId,
      eventType: params.eventType,
      eventDate: params.eventDate,
      title: params.title,
      description: params.description ?? "",
      updatedBy: params.updatedBy ?? params.createdBy ?? "",
    },
  });
}

export function historyEventTypeLabel(type: EquipmentHistoryEventType | string): string {
  switch (type) {
    case "Calibration":
      return "Hiệu chuẩn";
    case "Maintenance":
      return "Bảo trì";
    case "Repair":
      return "Sửa chữa";
    case "SparePartReplacement":
      return "Thay thế linh kiện";
    case "Installation":
      return "Lắp đặt";
    case "Manual":
      return "Thủ công";
    case "Disposal":
      return "Thanh lý";
    default:
      return String(type);
  }
}

export function isAutoSyncedHistory(sourceType: EquipmentHistorySourceType | string): boolean {
  return sourceType !== "Manual";
}
