import { deleteStoredFile, saveStoredFile } from "@/lib/file-storage";

const MAX_BYTES = 32 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".docx")) return ".docx";
  return null;
}

export async function saveSopFile(file: File): Promise<{ path?: string; error?: string }> {
  const result = await saveStoredFile({
    file,
    localSubdir: "sop",
    blobPrefix: "sop",
    maxBytes: MAX_BYTES,
    allowedTypes: ALLOWED_TYPES,
    extFromName,
    allowEmpty: true,
  });
  if (result.error === "File không được vượt quá 32MB") {
    return { error: "SOP không được vượt quá 32MB" };
  }
  if (result.error === "Định dạng file không được hỗ trợ") {
    return { error: "SOP chỉ chấp nhận PDF hoặc DOCX" };
  }
  return result;
}

export async function deleteSopFile(filePath: string) {
  await deleteStoredFile(filePath, "/uploads/sop/");
}
