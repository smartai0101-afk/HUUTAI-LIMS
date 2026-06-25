import { db } from "@/lib/db";
import { DEFAULT_EQUIPMENT_DEPARTMENTS } from "@/lib/equipment-fields";
import { mapEquipment } from "@/lib/mappers/equipment";

const equipmentOrder = [{ code: "asc" as const }];

export async function getEquipmentList() {
  const items = await db.equipment.findMany({ orderBy: equipmentOrder });
  return items.map(mapEquipment);
}

export async function getEquipmentOptions() {
  const items = await db.equipment.findMany({
    orderBy: equipmentOrder,
    select: { id: true, code: true, name: true, status: true },
  });
  return items;
}

export async function getDepartments(): Promise<string[]> {
  const rows = await db.equipment.findMany({
    select: { department: true },
    distinct: ["department"],
    orderBy: { department: "asc" },
  });
  const seen = new Set<string>(DEFAULT_EQUIPMENT_DEPARTMENTS);
  const departments: string[] = [...DEFAULT_EQUIPMENT_DEPARTMENTS];
  for (const row of rows) {
    const value = row.department.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    departments.push(value);
  }
  return departments;
}

export async function getEquipmentById(id: string) {
  const item = await db.equipment.findUnique({ where: { id } });
  return item ? mapEquipment(item) : null;
}

export async function getEquipmentByCode(code: string) {
  const item = await db.equipment.findUnique({ where: { code } });
  return item ? mapEquipment(item) : null;
}

export async function getEquipmentStats() {
  const [totalCount, inUseCount, maintenanceCount, brokenCount, disposedCount] = await Promise.all([
    db.equipment.count(),
    db.equipment.count({ where: { status: "InUse" } }),
    db.equipment.count({ where: { status: "Maintenance" } }),
    db.equipment.count({ where: { status: "Broken" } }),
    db.equipment.count({ where: { status: "Disposed" } }),
  ]);
  return { totalCount, inUseCount, maintenanceCount, brokenCount, disposedCount };
}
