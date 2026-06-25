import { db } from "@/lib/db";
import { mapContainer, mapUsageLog } from "@/lib/mappers";

const containerInclude = {
  chemical: true,
  standard: true,
} as const;

export async function getContainers() {
  const items = await db.container.findMany({
    include: containerInclude,
    orderBy: { code: "asc" },
  });
  return items.map(mapContainer);
}

export async function getContainerByCode(code: string) {
  const item = await db.container.findUnique({
    where: { code },
    include: containerInclude,
  });
  return item ? mapContainer(item) : null;
}

export async function getContainerById(id: string) {
  const item = await db.container.findUnique({
    where: { id },
    include: containerInclude,
  });
  return item ? mapContainer(item) : null;
}

export async function getContainerUsageLogs(containerId: string) {
  const logs = await db.usageLog.findMany({
    where: { containerId },
    include: {
      container: { include: containerInclude },
    },
    orderBy: { date: "desc" },
  });
  return logs.map(mapUsageLog);
}

export async function getContainerOptions() {
  const items = await db.container.findMany({
    include: containerInclude,
    orderBy: { code: "asc" },
  });
  return items.map((c) => ({
    id: c.id,
    code: c.code,
    label: `${c.code} · ${(c.chemical ?? c.standard)?.name ?? ""}`,
    quantity: c.quantity,
    unit: c.unit,
  }));
}

export async function getChemicalOptions() {
  return db.chemical.findMany({
    select: { id: true, code: true, name: true, unit: true, reorderLevel: true },
    orderBy: { code: "asc" },
  });
}

export async function getStandardOptions() {
  return db.standard.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
}
