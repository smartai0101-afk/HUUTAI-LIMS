"use server";

import type { EquipmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireEditRole, requireManageRole } from "@/lib/equipment-auth";
import {
  EQUIPMENT_IMPORT_COLUMN_MAP,
  equipmentStatusFromLabel,
} from "@/lib/equipment-fields";
import { deleteEquipmentFile, saveEquipmentFile } from "@/lib/equipment-upload";
import { parseXlsx } from "@/lib/excel";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const EQUIPMENT_PATHS = [
  "/equipment",
  "/equipment/catalog",
  "/equipment/history",
  "/equipment/calibration-plans",
  "/equipment/calibration-records",
  "/equipment/disposal",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseOptionalDate(value: string): Date | null {
  if (!value.trim()) return null;
  if (!isValidFormDate(value)) return null;
  return parseFormDate(value);
}

function parseIntOptional(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseStatus(value: string): EquipmentStatus {
  if (!value.trim()) return "InUse";
  return equipmentStatusFromLabel(value);
}

function revalidateEquipment() {
  EQUIPMENT_PATHS.forEach((p) => revalidatePath(p));
}

type EquipmentWriteData = {
  code: string;
  name: string;
  model: string;
  serialNumber: string;
  specifications: string;
  manufacturer: string;
  countryOfOrigin: string;
  manufacturingYear: number | null;
  purchaseDate: Date | null;
  commissioningDate: Date | null;
  lastCalibrationDate: Date | null;
  calibrator: string;
  calibrationExpiryDate: Date | null;
  department: string;
  location: string;
  manager: string;
  status: EquipmentStatus;
  installDate: Date | null;
  iqOqPqNotes: string;
  userManualPath: string | null;
};

async function resolveManualPath(
  fd: FormData,
  existingPath?: string | null,
): Promise<{ userManualPath: string | null; error?: string }> {
  const file = fd.get("userManual");
  if (file instanceof File && file.size > 0) {
    const saved = await saveEquipmentFile(file, "manual");
    if (saved.error) return { userManualPath: null, error: saved.error };
    if (saved.path && existingPath && existingPath !== saved.path) {
      await deleteEquipmentFile(existingPath);
    }
    return { userManualPath: saved.path ?? null };
  }
  const kept = str(fd, "userManualPath") || existingPath || null;
  return { userManualPath: kept || null };
}

function buildEquipmentData(fd: FormData, userManualPath: string | null): EquipmentWriteData {
  return {
    code: str(fd, "code"),
    name: str(fd, "name"),
    model: str(fd, "model"),
    serialNumber: str(fd, "serialNumber"),
    specifications: str(fd, "specifications"),
    manufacturer: str(fd, "manufacturer"),
    countryOfOrigin: str(fd, "countryOfOrigin"),
    manufacturingYear: parseIntOptional(str(fd, "manufacturingYear")),
    purchaseDate: parseOptionalDate(str(fd, "purchaseDate")),
    commissioningDate: parseOptionalDate(str(fd, "commissioningDate")),
    lastCalibrationDate: parseOptionalDate(str(fd, "lastCalibrationDate")),
    calibrator: str(fd, "calibrator"),
    calibrationExpiryDate: parseOptionalDate(str(fd, "calibrationExpiryDate")),
    department: str(fd, "department"),
    location: str(fd, "location"),
    manager: str(fd, "manager"),
    status: parseStatus(str(fd, "status")),
    installDate: parseOptionalDate(str(fd, "installDate")),
    iqOqPqNotes: str(fd, "iqOqPqNotes"),
    userManualPath,
  };
}

function toPrisma(data: EquipmentWriteData, user: string): Prisma.EquipmentUncheckedCreateInput {
  return {
    ...data,
    createdBy: user,
    updatedBy: user,
  };
}

function toPrismaUpdate(data: EquipmentWriteData, user: string): Prisma.EquipmentUncheckedUpdateInput {
  return { ...data, updatedBy: user };
}

export async function createEquipment(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!code || !name) return { error: "Mã và tên thiết bị là bắt buộc" };
  if (await db.equipment.findUnique({ where: { code } })) {
    return { error: "Mã thiết bị đã tồn tại" };
  }

  const resolved = await resolveManualPath(formData);
  if (resolved.error) return { error: resolved.error };

  const data = buildEquipmentData(formData, resolved.userManualPath);
  const row = await db.equipment.create({ data: toPrisma(data, user) });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "Equipment",
    entityId: row.id,
    object: code,
    after: row,
  });
  revalidateEquipment();
  return { success: true };
}

export async function updateEquipment(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const id = str(formData, "id");
  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!id || !code || !name) return { error: "Thiếu thông tin bắt buộc" };

  const before = await db.equipment.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy thiết bị" };

  const duplicate = await db.equipment.findFirst({ where: { code, NOT: { id } } });
  if (duplicate) return { error: "Mã thiết bị đã tồn tại" };

  const resolved = await resolveManualPath(formData, before.userManualPath);
  if (resolved.error) return { error: resolved.error };

  const data = buildEquipmentData(formData, resolved.userManualPath);
  const row = await db.equipment.update({
    where: { id },
    data: toPrismaUpdate(data, user),
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "Equipment",
    entityId: id,
    object: code,
    before,
    after: row,
  });
  revalidateEquipment();
  return { success: true };
}

export async function deleteEquipment(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.equipment.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy thiết bị" };

  if (before.userManualPath) await deleteEquipmentFile(before.userManualPath);
  await db.equipment.delete({ where: { id } });

  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "Equipment",
    entityId: id,
    object: before.code,
    before,
  });
  revalidateEquipment();
  return { success: true };
}

export async function importEquipmentBulk(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn file Excel" };
  }

  const parsed = parseXlsx(await file.arrayBuffer(), EQUIPMENT_IMPORT_COLUMN_MAP);
  if (parsed.error) return { error: parsed.error };
  if (parsed.rows.length === 0) return { error: "File Excel không có dữ liệu" };

  const errors: string[] = [];
  let created = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    const line = i + 2;
    const code = row.code?.trim();
    const name = row.name?.trim();
    if (!code || !name) {
      errors.push(`Dòng ${line}: thiếu mã hoặc tên thiết bị`);
      continue;
    }
    const exists = await db.equipment.findUnique({ where: { code } });
    if (exists) {
      errors.push(`Dòng ${line}: mã ${code} đã tồn tại`);
      continue;
    }
    await db.equipment.create({
      data: {
        code,
        name,
        model: row.model ?? "",
        serialNumber: row.serialNumber ?? "",
        manufacturer: row.manufacturer ?? "",
        department: row.department ?? "",
        location: row.location ?? "",
        manager: row.manager ?? "",
        status: parseStatus(row.status ?? ""),
        createdBy: user,
        updatedBy: user,
      },
    });
    created++;
  }

  if (created === 0) {
    return { error: errors.length ? errors.join("; ") : "Không có dòng hợp lệ để nhập" };
  }

  await writeAuditLog({
    user,
    action: "Imported",
    entityType: "Equipment",
    entityId: "bulk",
    object: `${created} thiết bị`,
    after: { created, errors },
  });
  revalidateEquipment();
  return { success: true, created, errors };
}

type ImportRow = Record<string, string | undefined>;

export async function bulkImportEquipment(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const raw = str(formData, "rows");
  if (!raw) return { error: "Không có dữ liệu nhập" };

  let rows: ImportRow[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { error: "Dữ liệu nhập phải là mảng JSON" };
    rows = parsed;
  } catch {
    return { error: "JSON không hợp lệ" };
  }

  if (rows.length === 0) return { error: "Không có dòng hợp lệ để nhập" };

  const errors: string[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const code = String(row.code ?? "").trim();
    const name = String(row.name ?? "").trim();
    if (!code || !name) {
      errors.push(`Dòng ${line}: thiếu mã hoặc tên thiết bị`);
      continue;
    }
    const exists = await db.equipment.findUnique({ where: { code } });
    if (exists) {
      errors.push(`Dòng ${line}: mã ${code} đã tồn tại`);
      continue;
    }
    await db.equipment.create({
      data: {
        code,
        name,
        model: String(row.model ?? "").trim(),
        serialNumber: String(row.serialNumber ?? "").trim(),
        manufacturer: String(row.manufacturer ?? "").trim(),
        department: String(row.department ?? "").trim(),
        location: String(row.location ?? "").trim(),
        manager: String(row.manager ?? "").trim(),
        status: parseStatus(String(row.status ?? "")),
        createdBy: user,
        updatedBy: user,
      },
    });
    created++;
  }

  if (created === 0) {
    return { error: errors.length ? errors.join("; ") : "Không có dòng hợp lệ để nhập" };
  }

  await writeAuditLog({
    user,
    action: "Imported",
    entityType: "Equipment",
    entityId: "bulk-json",
    object: `${created} thiết bị`,
    after: { created, errors },
  });
  revalidateEquipment();
  return { success: true, created, errors };
}
