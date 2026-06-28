import { deleteStoredFile, saveStoredFile } from "@/lib/file-storage";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return ".pdf";
  return null;
}

export async function saveSdsFile(file: File): Promise<{ path?: string; error?: string }> {
  const result = await saveStoredFile({
    file,
    localSubdir: "sds",
    blobPrefix: "sds",
    maxBytes: MAX_BYTES,
    allowedTypes: ALLOWED_TYPES,
    extFromName,
    allowEmpty: true,
  });
  if (result.error === "File không được vượt quá 10MB") {
    return { error: "SDS không được vượt quá 10MB" };
  }
  if (result.error === "Định dạng file không được hỗ trợ") {
    return { error: "SDS chỉ chấp nhận PDF" };
  }
  return result;
}

export async function deleteSdsFile(filePath: string) {
  await deleteStoredFile(filePath, "/uploads/sds/");
}
