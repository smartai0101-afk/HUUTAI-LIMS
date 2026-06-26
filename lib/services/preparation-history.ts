import { db } from "@/lib/db";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import { PREPARATION_TYPE_MAP } from "@/lib/services/preparation-workflow";

export type PreparationHistoryEntryView = {
  id: string;
  version: number;
  event: string;
  reason: string;
  performedBy: string;
  performedAt: string;
  snapshot: unknown;
};

export async function getPreparationHistory(
  preparationType: PreparationRecordType,
  preparationId: string,
): Promise<PreparationHistoryEntryView[]> {
  const rows = await db.preparationHistory.findMany({
    where: {
      preparationType: PREPARATION_TYPE_MAP[preparationType],
      preparationId,
    },
    orderBy: [{ performedAt: "desc" }, { version: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    event: row.event,
    reason: row.reason,
    performedBy: row.performedBy,
    performedAt: row.performedAt.toISOString(),
    snapshot: safeParseJson(row.snapshotJson),
  }));
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
