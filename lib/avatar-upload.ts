import { deleteStoredFile, saveStoredFile } from "@/lib/file-storage";

const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  return null;
}

export async function saveAvatarFile(file: File): Promise<{ path?: string; error?: string }> {
  const result = await saveStoredFile({
    file,
    localSubdir: "avatars",
    blobPrefix: "avatars",
    maxBytes: MAX_BYTES,
    allowedTypes: ALLOWED_TYPES,
    extFromName,
    emptyError: "Vui lòng chọn ảnh",
  });
  if (result.error === "File không được vượt quá 2MB") {
    return { error: "Ảnh đại diện không được vượt quá 2MB" };
  }
  if (result.error === "Định dạng file không được hỗ trợ") {
    return { error: "Ảnh đại diện chỉ chấp nhận jpg, jpeg, png, webp" };
  }
  return result;
}

export async function deleteAvatarFile(avatarPath: string) {
  await deleteStoredFile(avatarPath, "/uploads/avatars/");
}
