import { db } from "@/lib/db";
import { mapEquipmentDisposal } from "@/lib/mappers/equipment";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };

export async function getDisposals(equipmentId?: string) {
  const items = await db.equipmentDisposal.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ disposalDate: "desc" }],
    include: equipmentInclude,
  });
  return items.map(mapEquipmentDisposal);
}
