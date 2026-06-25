import { db } from "@/lib/db";
import { mapUsageLog } from "@/lib/mappers";

async function resolveSourceMeta(sourceType: string, sourceId: string) {
  if (sourceType === "Chemical") {
    const row = await db.chemical.findUnique({ where: { id: sourceId }, select: { code: true, name: true } });
    return row ?? { code: "—", name: "—" };
  }
  if (sourceType === "Standard") {
    const row = await db.standard.findUnique({ where: { id: sourceId }, select: { code: true, name: true } });
    return row ?? { code: "—", name: "—" };
  }
  if (sourceType === "MicrobialStrain") {
    const row = await db.microbialStrain.findUnique({ where: { id: sourceId }, select: { code: true, name: true } });
    return row ?? { code: "—", name: "—" };
  }
  return { code: "—", name: "—" };
}

export async function getUsageLogs() {
  const logs = await db.usageLog.findMany({
    include: {
      container: { select: { code: true } },
    },
    orderBy: { date: "desc" },
  });

  const metaCache = new Map<string, { code: string; name: string }>();
  const views = [];

  for (const log of logs) {
    const cacheKey = `${log.sourceType}:${log.sourceId}`;
    let meta = metaCache.get(cacheKey);
    if (!meta) {
      meta = await resolveSourceMeta(log.sourceType, log.sourceId);
      metaCache.set(cacheKey, meta);
    }
    views.push(
      mapUsageLog({
        id: log.id,
        date: log.date,
        type: log.type,
        sourceType: log.sourceType,
        sourceId: log.sourceId,
        containerId: log.containerId,
        quantity: log.quantity,
        unit: log.unit,
        performedBy: log.performedBy,
        performedByStaffId: log.performedByStaffId,
        purpose: log.purpose,
        notes: log.notes,
        referenceCode: log.referenceCode,
        itemCode: meta.code,
        itemName: meta.name,
        containerCode: log.container?.code,
      }),
    );
  }

  return views;
}
