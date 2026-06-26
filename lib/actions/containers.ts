"use server";

import { ContainerStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { computeContainerStatus } from "@/lib/container-status";
import { db } from "@/lib/db";

function parseDate(value: string): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createContainer(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const code = String(formData.get("code") ?? "").trim();
  const chemicalId = String(formData.get("chemicalId") ?? "").trim() || null;
  const standardId = String(formData.get("standardId") ?? "").trim() || null;
  const lot = String(formData.get("lot") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "L").trim();
  const expiryDate = parseDate(String(formData.get("expiryDate") ?? ""));
  const afterOpenExpiry = parseDate(String(formData.get("afterOpenExpiry") ?? ""));
  const pendingDisposal = formData.get("pendingDisposal") === "true";

  if (!code || !lot || !expiryDate) {
    return { error: "Mã bình, lot và hạn dùng là bắt buộc" };
  }
  if (!chemicalId && !standardId) {
    return { error: "Phải chọn hoá chất hoặc chất chuẩn" };
  }
  if (chemicalId && standardId) {
    return { error: "Chỉ được chọn một loại: hoá chất hoặc chất chuẩn" };
  }
  if (quantity < 0) {
    return { error: "Số lượng không hợp lệ" };
  }

  const existing = await db.container.findUnique({ where: { code } });
  if (existing) return { error: "Mã bình đã tồn tại" };

  let reorderLevel = 5;
  if (chemicalId) {
    const chemical = await db.chemical.findUnique({ where: { id: chemicalId } });
    if (!chemical) return { error: "Hoá chất không tồn tại" };
    reorderLevel = chemical.reorderLevel;
  } else if (standardId) {
    reorderLevel = 3;
  }

  const status = computeContainerStatus({
    quantity,
    reorderLevel,
    expiryDate,
    forcePendingDisposal: pendingDisposal,
  });

  const container = await db.container.create({
    data: {
      code,
      chemicalId,
      standardId,
      lot,
      location,
      quantity,
      unit,
      expiryDate,
      afterOpenExpiry,
      status: pendingDisposal ? ContainerStatus.PendingDisposal : status,
    },
  });

  await logActivity({
    user,
    action: "Created",
    entityType: "Container",
    entityId: container.id,
    object: code,
    after: container,
  });

  revalidatePath("/containers");
  revalidatePath("/chemicals");
  revalidatePath("/standards");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateContainer(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const chemicalId = String(formData.get("chemicalId") ?? "").trim() || null;
  const standardId = String(formData.get("standardId") ?? "").trim() || null;
  const lot = String(formData.get("lot") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "L").trim();
  const expiryDate = parseDate(String(formData.get("expiryDate") ?? ""));
  const afterOpenExpiry = parseDate(String(formData.get("afterOpenExpiry") ?? ""));
  const pendingDisposal = formData.get("pendingDisposal") === "true";

  if (!id || !code || !lot || !expiryDate) {
    return { error: "Thiếu thông tin bắt buộc" };
  }

  const before = await db.container.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy bình/lô" };

  let reorderLevel = 5;
  if (chemicalId) {
    const chemical = await db.chemical.findUnique({ where: { id: chemicalId } });
    reorderLevel = chemical?.reorderLevel ?? 5;
  } else {
    reorderLevel = 3;
  }

  const status = computeContainerStatus({
    quantity,
    reorderLevel,
    expiryDate,
    forcePendingDisposal: pendingDisposal,
  });

  const container = await db.container.update({
    where: { id },
    data: {
      code,
      chemicalId,
      standardId,
      lot,
      location,
      quantity,
      unit,
      expiryDate,
      afterOpenExpiry,
      status: pendingDisposal ? ContainerStatus.PendingDisposal : status,
    },
  });

  await logActivity({
    user,
    action: "Updated",
    entityType: "Container",
    entityId: id,
    object: code,
    before,
    after: container,
  });

  revalidatePath("/containers");
  revalidatePath("/chemicals");
  revalidatePath("/standards");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteContainer(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = String(formData.get("id") ?? "");

  const before = await db.container.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy bình/lô" };

  await db.container.delete({ where: { id } });

  await logActivity({
    user,
    action: "Deleted",
    entityType: "Container",
    entityId: id,
    object: before.code,
    before,
  });

  revalidatePath("/containers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
