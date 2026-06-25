import { db } from "@/lib/db";
import { mapSparePart } from "@/lib/mappers/equipment";

const linkInclude = {
  equipmentLinks: {
    include: { equipment: { select: { id: true, code: true, name: true } } },
  },
};

export async function getSpareParts(equipmentId?: string) {
  if (equipmentId) {
    const links = await db.equipmentSparePartLink.findMany({
      where: { equipmentId },
      select: { sparePartId: true },
    });
    const ids = links.map((l) => l.sparePartId);
    if (ids.length === 0) return [];
    const items = await db.sparePart.findMany({
      where: { id: { in: ids } },
      orderBy: { code: "asc" },
      include: linkInclude,
    });
    return items.map(mapSparePart);
  }

  const items = await db.sparePart.findMany({
    orderBy: { code: "asc" },
    include: linkInclude,
  });
  return items.map(mapSparePart);
}
