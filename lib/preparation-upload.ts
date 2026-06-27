import { deleteStoredFile, saveStoredFile } from "@/lib/file-storage";

const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".doc")) return ".doc";
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".xlsx")) return ".xlsx";
  return null;
}

export async function savePreparationAttachment(
  file: File,
): Promise<{ path?: string; error?: string }> {
  const result = await saveStoredFile({
    file,
    localSubdir: "preparation",
    blobPrefix: "preparation",
    maxBytes: MAX_BYTES,
    allowedTypes: ALLOWED_TYPES,
    extFromName,
    allowEmpty: true,
  });
  if (result.error === "File không được vượt quá 15MB") {
    return { error: "Tệp đính kèm không được vượt quá 15MB" };
  }
  if (result.error === "Định dạng file không được hỗ trợ") {
    return { error: "Tệp đính kèm chỉ chấp nhận pdf, doc/docx, xlsx, jpg/png/webp" };
  }
  return result;
}

export async function deletePreparationAttachment(storedPath: string) {
  await deleteStoredFile(storedPath, "/uploads/preparation/");
}
