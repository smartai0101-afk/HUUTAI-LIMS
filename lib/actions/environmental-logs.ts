"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const REVALIDATE_PATHS = [
  "/environment-logs",
  "/prepared-chemicals",
  "/prepared-standards",
  "/prepared-strains",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseOptionalFloat(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createEnvironmentalLog(fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = auth.user.name || auth.user.email;

  const loggedAtStr = str(fd, "loggedAt");
  const location = str(fd, "location");
  if (!isValidFormDate(loggedAtStr)) return { error: "Ngày ghi nhận không hợp lệ" };
  if (!location) return { error: "Vị trí là bắt buộc" };

  const loggedAt = parseFormDate(loggedAtStr)!;
  const temperature = parseOptionalFloat(str(fd, "temperature"));
  const humidity = parseOptionalFloat(str(fd, "humidity"));
  const recordedByStaffId = str(fd, "recordedByStaffId") || null;
  const notes = str(fd, "notes");

  const row = await db.environmentalLog.create({
    data: {
      loggedAt,
      location,
      temperature,
      humidity,
      recordedByStaffId,
      notes,
    },
  });

  await logActivity({
    user,
    action: "Created",
    entityType: "EnvironmentalLog",
    entityId: row.id,
    object: `${location} · ${loggedAtStr}`,
    after: row,
  });

  revalidateAll();
  return { success: true };
}

export async function updateEnvironmentalLog(fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = auth.user.name || auth.user.email;

  const id = str(fd, "id");
  if (!id) return { error: "Không tìm thấy bản ghi" };

  const before = await db.environmentalLog.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy bản ghi" };

  const loggedAtStr = str(fd, "loggedAt");
  const location = str(fd, "location");
  if (!isValidFormDate(loggedAtStr)) return { error: "Ngày ghi nhận không hợp lệ" };
  if (!location) return { error: "Vị trí là bắt buộc" };

  const row = await db.environmentalLog.update({
    where: { id },
    data: {
      loggedAt: parseFormDate(loggedAtStr)!,
      location,
      temperature: parseOptionalFloat(str(fd, "temperature")),
      humidity: parseOptionalFloat(str(fd, "humidity")),
      recordedByStaffId: str(fd, "recordedByStaffId") || null,
      notes: str(fd, "notes"),
    },
  });

  await logActivity({
    user,
    action: "Updated",
    entityType: "EnvironmentalLog",
    entityId: id,
    object: location,
    before,
    after: row,
  });

  revalidateAll();
  return { success: true };
}

export async function deleteEnvironmentalLog(fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = auth.user.name || auth.user.email;

  const id = str(fd, "id");
  if (!id) return { error: "Không tìm thấy bản ghi" };

  const before = await db.environmentalLog.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy bản ghi" };

  await db.environmentalLog.delete({ where: { id } });

  await logActivity({
    user,
    action: "Deleted",
    entityType: "EnvironmentalLog",
    entityId: id,
    object: before.location,
    before,
  });

  revalidateAll();
  return { success: true };
}
