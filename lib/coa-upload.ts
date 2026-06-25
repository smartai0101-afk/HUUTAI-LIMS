import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "coa");
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
  if (!file || file.size === 0) return {};

  if (file.size > MAX_BYTES) {
    return { error: "COA không được vượt quá 10MB" };
  }

  const ext = ALLOWED_TYPES[file.type] ?? extFromName(file.name);
  if (!ext) {
    return { error: "COA chỉ chấp nhận jpg, jpeg, png, webp, pdf" };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { path: `/uploads/coa/${filename}` };
}

export async function deleteCoaFile(coaPath: string) {
  if (!coaPath.startsWith("/uploads/coa/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", coaPath));
  } catch {
    // ignore missing files
  }
}
