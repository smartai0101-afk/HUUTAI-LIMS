import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { Prisma } from "@prisma/client";

const BASE_DIR = path.join(process.cwd(), "public", "uploads", "equipment");
const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".doc")) return ".doc";
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".xlsx")) return ".xlsx";
  return null;
}

export async function saveEquipmentFile(
  file: File,
  entityType: string,
): Promise<{ path?: string; fileName?: string; error?: string }> {
  if (!file || file.size === 0) return {};

  if (file.size > MAX_BYTES) {
    return { error: "File không được vượt quá 15MB" };
  }

  const ext = ALLOWED_TYPES[file.type] ?? extFromName(file.name);
  if (!ext) {
    return { error: "Chỉ chấp nhận pdf, doc/docx, xlsx, jpg/png" };
  }

  const safeType = entityType.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uploadDir = path.join(BASE_DIR, safeType);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return {
    path: `/uploads/equipment/${safeType}/${filename}`,
    fileName: file.name,
  };
}

export async function deleteEquipmentFile(filePath: string) {
  if (!filePath.startsWith("/uploads/equipment/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", filePath));
  } catch {
    // ignore missing files
  }
}

type SaveAttachmentsParams = {
  entityType: string;
  entityId: string;
  files: File[];
  createdBy?: string;
};

export async function saveEquipmentAttachments(
  tx: Prisma.TransactionClient,
  params: SaveAttachmentsParams,
): Promise<{ attachments: Array<{ id: string; filePath: string; fileName: string }>; error?: string }> {
  const attachments: Array<{ id: string; filePath: string; fileName: string }> = [];

  for (const file of params.files) {
    if (!file || file.size === 0) continue;

    const saved = await saveEquipmentFile(file, params.entityType);
    if (saved.error) return { attachments, error: saved.error };
    if (!saved.path) continue;

    const row = await tx.equipmentAttachment.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        filePath: saved.path,
        fileName: saved.fileName ?? file.name,
        createdBy: params.createdBy ?? "",
      },
    });

    attachments.push({
      id: row.id,
      filePath: row.filePath,
      fileName: row.fileName,
    });
  }

  return { attachments };
}
