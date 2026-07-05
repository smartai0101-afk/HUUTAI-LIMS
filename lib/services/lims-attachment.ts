import { db } from "@/lib/db";
import { saveStoredFile } from "@/lib/file-storage";

export async function uploadLimsAttachment(
  entityType: string,
  entityId: string,
  file: File,
  uploadedBy: string,
) {
  const saved = await saveStoredFile({
    file,
    localSubdir: `lims/${entityType}`,
    blobPrefix: `lims/${entityType}`,
    maxBytes: 32 * 1024 * 1024,
    allowedTypes: {
      "application/pdf": ".pdf",
      "text/csv": ".csv",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "image/jpeg": ".jpg",
      "image/png": ".png",
    },
    extFromName: (name) => {
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      return [".pdf", ".csv", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"].includes(ext) ? ext : null;
    },
  });
  if (saved.error || !saved.path) throw new Error(saved.error ?? "Không thể lưu file");

  return db.limsAttachment.create({
    data: {
      entityType,
      entityId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      storageUrl: saved.path,
      uploadedBy,
    },
  });
}

export async function listAttachments(entityType: string, entityId: string) {
  return db.limsAttachment.findMany({
    where: { entityType, entityId },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function linkRawDataToResult(
  resultId: string,
  attachmentId: string,
  uploadedBy: string,
) {
  const result = await db.testResult.findUnique({ where: { id: resultId } });
  if (!result) throw new Error("Không tìm thấy kết quả");

  return db.testResult.update({
    where: { id: resultId },
    data: { rawDataAttachmentId: attachmentId },
  });
}
