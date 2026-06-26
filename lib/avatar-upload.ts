import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
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
  if (!file || file.size === 0) return { error: "Vui lòng chọn ảnh" };

  if (file.size > MAX_BYTES) {
    return { error: "Ảnh đại diện không được vượt quá 2MB" };
  }

  const ext = ALLOWED_TYPES[file.type] ?? extFromName(file.name);
  if (!ext) {
    return { error: "Ảnh đại diện chỉ chấp nhận jpg, jpeg, png, webp" };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { path: `/uploads/avatars/${filename}` };
}

export async function deleteAvatarFile(avatarPath: string) {
  if (!avatarPath.startsWith("/uploads/avatars/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", avatarPath));
  } catch {
    // ignore missing files
  }
}
