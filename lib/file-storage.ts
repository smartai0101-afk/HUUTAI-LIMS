import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

export function useBlobStorage(): boolean {
  return process.env.VERCEL === "1" && Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isRemoteStoredPath(storedPath: string): boolean {
  return storedPath.startsWith("http://") || storedPath.startsWith("https://");
}

type SaveStoredFileOptions = {
  file: File;
  /** Path segment under public/uploads/ for local storage, e.g. "avatars" or "equipment/maintenance" */
  localSubdir: string;
  /** Blob pathname prefix, e.g. "avatars" or "equipment/maintenance" */
  blobPrefix: string;
  maxBytes: number;
  allowedTypes: Record<string, string>;
  extFromName: (name: string) => string | null;
  /** When true, empty file returns {} instead of error */
  allowEmpty?: boolean;
  emptyError?: string;
};

export async function saveStoredFile(
  opts: SaveStoredFileOptions,
): Promise<{ path?: string; error?: string }> {
  const { file } = opts;
  if (!file || file.size === 0) {
    if (opts.allowEmpty) return {};
    return { error: opts.emptyError ?? "Vui lòng chọn file" };
  }

  if (file.size > opts.maxBytes) {
    return { error: `File không được vượt quá ${Math.round(opts.maxBytes / (1024 * 1024))}MB` };
  }

  const ext = opts.allowedTypes[file.type] ?? opts.extFromName(file.name);
  if (!ext) {
    return { error: "Định dạng file không được hỗ trợ" };
  }

  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

  if (useBlobStorage()) {
    const blob = await put(`${opts.blobPrefix}/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { path: blob.url };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", ...opts.localSubdir.split("/"));
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return { path: `/uploads/${opts.localSubdir}/${filename}` };
}

export async function deleteStoredFile(storedPath: string, localPathPrefix: string) {
  if (!storedPath) return;

  if (isRemoteStoredPath(storedPath)) {
    if (!useBlobStorage()) return;
    try {
      await del(storedPath);
    } catch {
      // ignore missing blobs
    }
    return;
  }

  if (!storedPath.startsWith(localPathPrefix)) return;
  try {
    await unlink(path.join(process.cwd(), "public", storedPath));
  } catch {
    // ignore missing files
  }
}
