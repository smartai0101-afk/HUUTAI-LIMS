import { db } from "@/lib/db";
import {
  HISTORY_ATTACHMENT_ENTITY,
  batchLoadSourceMedia,
} from "@/lib/equipment-history-media";
import { mapEquipmentHistoryEvent } from "@/lib/mappers/equipment";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };

export async function getHistoryEvents(equipmentId?: string) {
  const items = await db.equipmentHistoryEvent.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: equipmentInclude,
  });

  if (items.length === 0) return [];

  const eventIds = items.map((item) => item.id);
  const [batch, attachments] = await Promise.all([
    batchLoadSourceMedia(items),
    db.equipmentAttachment.findMany({
      where: {
        entityType: HISTORY_ATTACHMENT_ENTITY,
        entityId: { in: eventIds },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const attachmentsByEvent = new Map<string, typeof attachments>();
  for (const att of attachments) {
    const list = attachmentsByEvent.get(att.entityId) ?? [];
    list.push(att);
    attachmentsByEvent.set(att.entityId, list);
  }

  return items.map((event) =>
    mapEquipmentHistoryEvent(event, {
      batch,
      historyAttachments: attachmentsByEvent.get(event.id) ?? [],
    }),
  );
}
