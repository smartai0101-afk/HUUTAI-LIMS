import { db } from "@/lib/db";
import { mapAuditLog, mapContainer, mapUsageLog, toDateString } from "@/lib/mappers";

export async function getAuditLogs(limit = 50) {
  const logs = await db.auditLog.findMany({
    orderBy: { time: "desc" },
    take: limit,
  });

  return logs.map(mapAuditLog);
}

export async function getContainerExportRows() {
  const containers = await db.container.findMany({
    include: { chemical: true, standard: true },
    orderBy: { code: "asc" },
  });

  return containers.map((c) => {
    const item = c.chemical ?? c.standard!;
    return {
      code: c.code,
      itemType: c.chemicalId ? "Chemical" : "Standard",
      itemCode: item.code,
      itemName: item.name,
      lot: c.lot,
      location: c.location,
      quantity: c.quantity,
      unit: c.unit,
      expiryDate: toDateString(c.expiryDate),
      status: c.status,
    };
  });
}

export async function getUsageExportRows() {
  const logs = await db.usageLog.findMany({
    include: {
      container: { include: { chemical: true, standard: true } },
    },
    orderBy: { date: "desc" },
  });

  return logs.map((log) => {
    const mapped = mapUsageLog(log);
    return {
      date: mapped.date,
      type: mapped.type,
      containerCode: mapped.containerCode,
      itemCode: mapped.itemCode,
      itemName: mapped.itemName,
      quantity: mapped.quantity,
      unit: mapped.unit,
      performedBy: mapped.performedBy,
      purpose: mapped.purpose,
    };
  });
}

export async function getExpiryExportRows() {
  const containers = await db.container.findMany({
    include: { chemical: true, standard: true },
    orderBy: { expiryDate: "asc" },
  });

  return containers.map((c) => mapContainer(c));
}
