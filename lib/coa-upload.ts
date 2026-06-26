import { deleteStoredFile, saveStoredFile } from "@/lib/file-storage";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".pdf")) return ".pdf";
  return null;
}

export async function saveCoaFile(file: File): Promise<{ path?: string; error?: string }> {
  const result = await saveStoredFile({
    file,
    localSubdir: "coa",
    blobPrefix: "coa",
    maxBytes: MAX_BYTES,
    allowedTypes: ALLOWED_TYPES,
    extFromName,
    allowEmpty: true,
  });
  if (result.error === "File không được vượt quá 10MB") {
    return { error: "COA không được vượt quá 10MB" };
  }
  if (result.error === "Định dạng file không được hỗ trợ") {
    return { error: "COA chỉ chấp nhận jpg, jpeg, png, webp, pdf" };
  }
  return result;
}

export async function deleteCoaFile(coaPath: string) {
  await deleteStoredFile(coaPath, "/uploads/coa/");
}
