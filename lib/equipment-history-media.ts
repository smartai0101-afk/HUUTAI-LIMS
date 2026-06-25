import type { EquipmentAttachment, EquipmentHistorySourceType } from "@prisma/client";
import { db } from "@/lib/db";
import type { HistoryEventFileItem, HistoryEventMediaItem } from "@/types";

const IMAGE_EXT = /\.(jpe?g|png)$/i;

export function isImagePath(filePath: string): boolean {
  return IMAGE_EXT.test(filePath.split("?")[0] ?? "");
}

export function fileNameFromPath(filePath: string): string {
  const segment = filePath.split("/").pop() ?? filePath;
  return segment.split("?")[0] ?? segment;
}

function parseAttachmentPaths(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return raw ? [raw] : [];
}

function splitPaths(paths: string[]): { images: HistoryEventMediaItem[]; otherFiles: HistoryEventFileItem[] } {
  const images: HistoryEventMediaItem[] = [];
  const otherFiles: HistoryEventFileItem[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    const name = fileNameFromPath(trimmed);
    if (isImagePath(trimmed)) {
      images.push({ path: trimmed, name, source: "source" });
    } else {
      otherFiles.push({ path: trimmed, name });
    }
  }

  return { images, otherFiles };
}

export type SourceMediaBatch = {
  maintenancePaths: Map<string, string[]>;
  calibrationPaths: Map<string, string>;
  disposalPaths: Map<string, string>;
};

export async function batchLoadSourceMedia(
  events: Array<{ sourceType: EquipmentHistorySourceType; sourceId: string | null }>,
): Promise<SourceMediaBatch> {
  const maintenanceIds = new Set<string>();
  const calibrationIds = new Set<string>();
  const disposalIds = new Set<string>();

  for (const event of events) {
    if (!event.sourceId) continue;
    if (event.sourceType === "MaintenanceLog") maintenanceIds.add(event.sourceId);
    else if (event.sourceType === "CalibrationRecord") calibrationIds.add(event.sourceId);
    else if (event.sourceType === "EquipmentDisposal") disposalIds.add(event.sourceId);
  }

  const maintenancePaths = new Map<string, string[]>();
  const calibrationPaths = new Map<string, string>();
  const disposalPaths = new Map<string, string>();

  if (maintenanceIds.size > 0) {
    const rows = await db.maintenanceLog.findMany({
      where: { id: { in: [...maintenanceIds] } },
      select: { id: true, attachmentPaths: true },
    });
    for (const row of rows) {
      maintenancePaths.set(row.id, parseAttachmentPaths(row.attachmentPaths));
    }
  }

  if (calibrationIds.size > 0) {
    const rows = await db.calibrationRecord.findMany({
      where: { id: { in: [...calibrationIds] } },
      select: { id: true, certificatePath: true },
    });
    for (const row of rows) {
      if (row.certificatePath) calibrationPaths.set(row.id, row.certificatePath);
    }
  }

  if (disposalIds.size > 0) {
    const rows = await db.equipmentDisposal.findMany({
      where: { id: { in: [...disposalIds] } },
      select: { id: true, documentPath: true },
    });
    for (const row of rows) {
      if (row.documentPath) disposalPaths.set(row.id, row.documentPath);
    }
  }

  return { maintenancePaths, calibrationPaths, disposalPaths };
}

export function resolveSourcePaths(
  sourceType: EquipmentHistorySourceType,
  sourceId: string | null,
  batch: SourceMediaBatch,
): string[] {
  if (!sourceId) return [];
  if (sourceType === "MaintenanceLog") return batch.maintenancePaths.get(sourceId) ?? [];
  if (sourceType === "CalibrationRecord") {
    const path = batch.calibrationPaths.get(sourceId);
    return path ? [path] : [];
  }
  if (sourceType === "EquipmentDisposal") {
    const path = batch.disposalPaths.get(sourceId);
    return path ? [path] : [];
  }
  return [];
}

export function mergeHistoryEventMedia(
  event: { id: string; sourceType: EquipmentHistorySourceType; sourceId: string | null },
  batch: SourceMediaBatch,
  historyAttachments: EquipmentAttachment[],
): { images: HistoryEventMediaItem[]; otherFiles: HistoryEventFileItem[] } {
  const sourcePaths = resolveSourcePaths(event.sourceType, event.sourceId, batch);
  const { images: sourceImages, otherFiles } = splitPaths(sourcePaths);

  const images: HistoryEventMediaItem[] = [...sourceImages];
  const imagePaths = new Set(images.map((i) => i.path));

  for (const att of historyAttachments) {
    const path = att.filePath.trim();
    if (!path) continue;
    const name = att.fileName || fileNameFromPath(path);
    if (isImagePath(path)) {
      if (!imagePaths.has(path)) {
        imagePaths.add(path);
        images.push({
          path,
          name,
          source: "history",
          attachmentId: att.id,
        });
      }
    } else if (!otherFiles.some((f) => f.path === path)) {
      otherFiles.push({ path, name });
    }
  }

  return { images, otherFiles };
}

export const HISTORY_ATTACHMENT_ENTITY = "EquipmentHistoryEvent";
