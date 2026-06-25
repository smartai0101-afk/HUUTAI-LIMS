import { db } from "@/lib/db";
import {
  mapMaintenanceLog,
  mapMaintenancePlan,
  mapRepairProposal,
} from "@/lib/mappers/equipment";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };

export async function getMaintenancePlans(equipmentId?: string) {
  const items = await db.maintenancePlan.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ nextDate: "asc" }, { equipment: { code: "asc" } }],
    include: equipmentInclude,
  });
  return items.map(mapMaintenancePlan);
}

export async function getMaintenanceLogs(equipmentId?: string) {
  const items = await db.maintenanceLog.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ issueDate: "desc" }],
    include: {
      ...equipmentInclude,
      repairProposal: { select: { ticketNo: true } },
    },
  });
  return items.map(mapMaintenanceLog);
}

export async function getRepairProposals(equipmentId?: string) {
  const items = await db.repairProposal.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ createdAt: "desc" }],
    include: equipmentInclude,
  });
  return items.map(mapRepairProposal);
}

export async function generateTicketNo(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `RP-${year}-`;
  const latest = await db.repairProposal.findFirst({
    where: { ticketNo: { startsWith: prefix } },
    orderBy: { ticketNo: "desc" },
  });
  let seq = 1;
  if (latest) {
    const part = latest.ticketNo.slice(prefix.length);
    const n = Number.parseInt(part, 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
