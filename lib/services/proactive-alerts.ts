import { createNotification } from "@/lib/notifications/create";
import { getAlerts } from "@/lib/services/alerts";
import { db } from "@/lib/db";

const DEDUPE_HOURS = 24;

export async function runProactiveAlerts(): Promise<{ created: number; scanned: number }> {
  const alerts = await getAlerts();
  const since = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000);
  let created = 0;

  for (const alert of alerts.slice(0, 50)) {
    const entityId = alert.id;
    const existing = await db.notification.findFirst({
      where: {
        entityId,
        action: "Alert",
        createdAt: { gte: since },
      },
    });
    if (existing) continue;

    await createNotification({
      actorName: "System",
      action: "Alert",
      entityType: alert.type,
      entityId,
      recordLabel: alert.title,
      object: alert.description,
      metadata: { severity: alert.severity, href: alert.itemRoute },
    });
    created++;
  }

  return { created, scanned: alerts.length };
}
