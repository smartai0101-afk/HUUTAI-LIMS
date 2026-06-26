"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireEditRole, requireManageRole, requireApproveRole } from "@/lib/equipment-auth";
import { appendEquipmentHistory } from "@/lib/equipment-history";
import {
  deriveCalibrationResult,
  formatCalibrationResults,
  normalizeCalibrationResultRows,
  parseCalibrationResultsJson,
  type CalibrationResultRow,
} from "@/lib/calibration-results";
import { addCycleMonths, computeScheduleStatus } from "@/lib/equipment-schedule";
import { deleteEquipmentFile, saveEquipmentFile } from "@/lib/equipment-upload";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const CALIBRATION_PATHS = [
  "/equipment",
  "/equipment/catalog",
  "/equipment/calibration-plans",
  "/equipment/calibration-records",
  "/equipment/calibration-evaluations",
  "/equipment/history",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseFloatValue(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseIntValue(value: string, fallback = 12) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function parseCalibrationResultsFromForm(formData: FormData): CalibrationResultRow[] {
  const json = str(formData, "calibrationResults");
  if (json) {
    return normalizeCalibrationResultRows(parseCalibrationResultsJson(json)).filter(
      (row) => row.result || row.error,
    );
  }
  const legacyDeviation = str(formData, "deviation");
  return legacyDeviation
    ? [{ result: legacyDeviation, error: "", standardResult: "", correctiveAction: "", evaluatedBy: "", evaluationDate: "", notes: "" }]
    : [];
}

function calibrationResultsPayload(rows: CalibrationResultRow[]) {
  const normalized = rows.filter((row) => row.result || row.error);
  return {
    calibrationResults: normalized,
    deviation: formatCalibrationResults(normalized),
  };
}

function revalidateCalibration() {
  CALIBRATION_PATHS.forEach((p) => revalidatePath(p));
}

async function syncCalibrationPlansAfterRecord(
  tx: Prisma.TransactionClient,
  equipmentId: string,
  calibrationDate: Date,
  user: string,
) {
  const plans = await tx.calibrationPlan.findMany({ where: { equipmentId } });
  let earliestExpiry: Date | null = null;
  for (const plan of plans) {
    const nextDate = addCycleMonths(calibrationDate, plan.cycleMonths);
    const status = computeScheduleStatus(nextDate);
    await tx.calibrationPlan.update({
      where: { id: plan.id },
      data: { lastDate: calibrationDate, nextDate, status, updatedBy: user },
    });
    if (!earliestExpiry || nextDate.getTime() < earliestExpiry.getTime()) {
      earliestExpiry = nextDate;
    }
  }
  return earliestExpiry;
}

async function resolveCertificatePath(
  fd: FormData,
  existingPath?: string | null,
): Promise<{ certificatePath: string | null; error?: string }> {
  const file = fd.get("certificate");
  if (file instanceof File && file.size > 0) {
    const saved = await saveEquipmentFile(file, "calibration");
    if (saved.error) return { certificatePath: null, error: saved.error };
    if (saved.path && existingPath && existingPath !== saved.path) {
      await deleteEquipmentFile(existingPath);
    }
    return { certificatePath: saved.path ?? null };
  }
  const kept = str(fd, "certificatePath") || existingPath || null;
  return { certificatePath: kept || null };
}

export async function createCalibrationPlan(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const name = str(formData, "name");
  if (!equipmentId || !name) return { error: "Thiết bị và tên kế hoạch là bắt buộc" };

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const lastDateStr = str(formData, "lastDate");
  const lastDate = lastDateStr && isValidFormDate(lastDateStr) ? parseFormDate(lastDateStr) : null;
  const cycleMonths = parseIntValue(str(formData, "cycleMonths"));
  const nextDate = lastDate ? addCycleMonths(lastDate, cycleMonths) : null;

  const row = await db.calibrationPlan.create({
    data: {
      equipmentId,
      name,
      cycleMonths,
      lastDate,
      nextDate,
      vendor: str(formData, "vendor"),
      status: computeScheduleStatus(nextDate),
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Created",
    entityType: "CalibrationPlan",
    entityId: row.id,
    object: `${equipment.code} — ${name}`,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function updateCalibrationPlan(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã kế hoạch" };

  const before = await db.calibrationPlan.findUnique({ where: { id }, include: { equipment: true } });
  if (!before) return { error: "Không tìm thấy kế hoạch hiệu chuẩn" };

  const lastDateStr = str(formData, "lastDate");
  const lastDate = lastDateStr && isValidFormDate(lastDateStr) ? parseFormDate(lastDateStr) : null;
  const cycleMonths = parseIntValue(str(formData, "cycleMonths"), before.cycleMonths);
  const nextDate = lastDate ? addCycleMonths(lastDate, cycleMonths) : before.nextDate;

  const row = await db.calibrationPlan.update({
    where: { id },
    data: {
      name: str(formData, "name") || before.name,
      cycleMonths,
      lastDate,
      nextDate,
      vendor: str(formData, "vendor"),
      status: computeScheduleStatus(nextDate),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Updated",
    entityType: "CalibrationPlan",
    entityId: id,
    object: `${before.equipment.code} — ${row.name}`,
    before,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function deleteCalibrationPlan(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.calibrationPlan.findUnique({ where: { id }, include: { equipment: true } });
  if (!before) return { error: "Không tìm thấy kế hoạch hiệu chuẩn" };

  await db.calibrationPlan.delete({ where: { id } });
  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Deleted",
    entityType: "CalibrationPlan",
    entityId: id,
    object: `${before.equipment.code} — ${before.name}`,
    before,
  });
  revalidateCalibration();
  return { success: true };
}

export async function createCalibrationRecord(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const calibrationDateStr = str(formData, "calibrationDate");
  if (!equipmentId || !isValidFormDate(calibrationDateStr)) {
    return { error: "Thiết bị và ngày hiệu chuẩn là bắt buộc" };
  }

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const resolved = await resolveCertificatePath(formData);
  if (resolved.error) return { error: resolved.error };

  const calibrationDate = parseFormDate(calibrationDateStr)!;
  const calibrationRows = parseCalibrationResultsFromForm(formData);
  const result = deriveCalibrationResult(calibrationRows);
  const measurementPayload = calibrationResultsPayload(calibrationRows);

  const row = await db.$transaction(async (tx) => {
    const record = await tx.calibrationRecord.create({
      data: {
        equipmentId,
        calibrationDate,
        certificateNo: str(formData, "certificateNo"),
        result,
        deviation: measurementPayload.deviation,
        calibrationResults: measurementPayload.calibrationResults,
        certificatePath: resolved.certificatePath,
        cost: 0,
        vendor: str(formData, "vendor"),
        notes: str(formData, "notes"),
        createdBy: user,
        updatedBy: user,
      },
    });

    const earliestExpiry = await syncCalibrationPlansAfterRecord(tx, equipmentId, calibrationDate, user);

    await tx.equipment.update({
      where: { id: equipmentId },
      data: {
        lastCalibrationDate: calibrationDate,
        calibrationExpiryDate: earliestExpiry,
        calibrator: str(formData, "vendor") || equipment.calibrator,
        updatedBy: user,
      },
    });

    await appendEquipmentHistory(tx, {
      equipmentId,
      eventType: "Calibration",
      eventDate: calibrationDate,
      title: `Hiệu chuẩn ${result === "Pass" ? "đạt" : "không đạt"}`,
      description: str(formData, "certificateNo")
        ? `Chứng chỉ: ${str(formData, "certificateNo")}`
        : str(formData, "notes"),
      sourceType: "CalibrationRecord",
      sourceId: record.id,
      createdBy: user,
      updatedBy: user,
    });

    return record;
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Created",
    entityType: "CalibrationRecord",
    entityId: row.id,
    object: equipment.code,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function updateCalibrationRecord(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã hồ sơ" };

  const before = await db.calibrationRecord.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy hồ sơ hiệu chuẩn" };

  const calibrationDateStr = str(formData, "calibrationDate");
  if (!isValidFormDate(calibrationDateStr)) return { error: "Ngày hiệu chuẩn không hợp lệ" };

  const resolved = await resolveCertificatePath(formData, before.certificatePath);
  if (resolved.error) return { error: resolved.error };

  const calibrationDate = parseFormDate(calibrationDateStr)!;
  const calibrationRows = parseCalibrationResultsFromForm(formData);
  const result = deriveCalibrationResult(calibrationRows);
  const measurementPayload = calibrationResultsPayload(calibrationRows);

  const row = await db.$transaction(async (tx) => {
    const record = await tx.calibrationRecord.update({
      where: { id },
      data: {
        calibrationDate,
        certificateNo: str(formData, "certificateNo"),
        result,
        deviation: measurementPayload.deviation,
        calibrationResults: measurementPayload.calibrationResults,
        certificatePath: resolved.certificatePath,
        vendor: str(formData, "vendor"),
        notes: str(formData, "notes"),
        updatedBy: user,
      },
    });

    const earliestExpiry = await syncCalibrationPlansAfterRecord(
      tx,
      before.equipmentId,
      calibrationDate,
      user,
    );

    await tx.equipment.update({
      where: { id: before.equipmentId },
      data: {
        lastCalibrationDate: calibrationDate,
        calibrationExpiryDate: earliestExpiry,
        updatedBy: user,
      },
    });

    return record;
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Updated",
    entityType: "CalibrationRecord",
    entityId: id,
    object: before.equipment.code,
    before,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function deleteCalibrationRecord(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.calibrationRecord.findUnique({
    where: { id },
    include: { equipment: true, evaluation: true },
  });
  if (!before) return { error: "Không tìm thấy hồ sơ hiệu chuẩn" };

  if (before.certificatePath) await deleteEquipmentFile(before.certificatePath);

  await db.$transaction(async (tx) => {
    if (before.evaluation) {
      await tx.postCalibrationEvaluation.delete({ where: { id: before.evaluation.id } });
    }
    await tx.equipmentHistoryEvent.deleteMany({
      where: { sourceType: "CalibrationRecord", sourceId: id },
    });
    await tx.calibrationRecord.delete({ where: { id } });
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Deleted",
    entityType: "CalibrationRecord",
    entityId: id,
    object: before.equipment.code,
    before,
  });
  revalidateCalibration();
  return { success: true };
}

export async function createPostCalibrationEvaluation(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const calibrationRecordId = str(formData, "calibrationRecordId");
  if (!equipmentId || !calibrationRecordId) {
    return { error: "Thiết bị và hồ sơ hiệu chuẩn là bắt buộc" };
  }

  const record = await db.calibrationRecord.findUnique({ where: { id: calibrationRecordId } });
  if (!record || record.equipmentId !== equipmentId) {
    return { error: "Hồ sơ hiệu chuẩn không hợp lệ" };
  }

  const existing = await db.postCalibrationEvaluation.findUnique({
    where: { calibrationRecordId },
  });
  if (existing) return { error: "Đánh giá cho hồ sơ này đã tồn tại" };

  const row = await db.postCalibrationEvaluation.create({
    data: {
      equipmentId,
      calibrationRecordId,
      impactAssessment: str(formData, "impactAssessment"),
      correctiveAction: str(formData, "correctiveAction"),
      status: "Draft",
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Created",
    entityType: "PostCalibrationEvaluation",
    entityId: row.id,
    object: calibrationRecordId,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function updatePostCalibrationEvaluation(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã đánh giá" };

  const before = await db.postCalibrationEvaluation.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy đánh giá sau hiệu chuẩn" };

  const row = await db.postCalibrationEvaluation.update({
    where: { id },
    data: {
      impactAssessment: str(formData, "impactAssessment"),
      correctiveAction: str(formData, "correctiveAction"),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Updated",
    entityType: "PostCalibrationEvaluation",
    entityId: id,
    object: before.calibrationRecordId,
    before,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}

export async function deletePostCalibrationEvaluation(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.postCalibrationEvaluation.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy đánh giá sau hiệu chuẩn" };

  await db.postCalibrationEvaluation.delete({ where: { id } });
  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Deleted",
    entityType: "PostCalibrationEvaluation",
    entityId: id,
    object: before.calibrationRecordId,
    before,
  });
  revalidateCalibration();
  return { success: true };
}

export async function approvePostCalibrationEvaluation(formData: FormData) {
  const auth = await requireApproveRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã đánh giá" };

  const before = await db.postCalibrationEvaluation.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy đánh giá sau hiệu chuẩn" };
  if (before.status !== "Draft") return { error: "Chỉ duyệt được đánh giá ở trạng thái Nháp" };

  const approved = str(formData, "approved") !== "false";
  const status = approved ? "Approved" : "Rejected";

  const row = await db.postCalibrationEvaluation.update({
    where: { id },
    data: {
      status,
      approvedBy: user,
      updatedBy: user,
    },
  });

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: approved ? "Approved" : "Rejected",
    entityType: "PostCalibrationEvaluation",
    entityId: id,
    object: before.calibrationRecordId,
    before,
    after: row,
  });
  revalidateCalibration();
  return { success: true };
}
