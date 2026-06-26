"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

const PATHS = ["/admin/staff", "/usage-logs"];

function revalidateStaff() {
  PATHS.forEach((p) => revalidatePath(p));
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export type StaffListItem = {
  id: string;
  code: string;
  name: string;
  department: string;
  active: boolean;
};

export async function listStaff(): Promise<StaffListItem[]> {
  const rows = await db.staff.findMany({ orderBy: { name: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    department: r.department,
    active: r.active,
  }));
}

export async function createStaff(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const code = str(formData, "code");
  const name = str(formData, "name");
  const department = str(formData, "department");

  if (!code || !name) return { error: "Mã và tên nhân viên là bắt buộc" };

  const existing = await db.staff.findUnique({ where: { code } });
  if (existing) return { error: "Mã nhân viên đã tồn tại" };

  await db.staff.create({
    data: { code, name, department, active: true },
  });

  revalidateStaff();
  return {};
}

export async function updateStaff(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  const code = str(formData, "code");
  const name = str(formData, "name");
  const department = str(formData, "department");
  const active = str(formData, "active") === "true";

  if (!id || !code || !name) return { error: "Thiếu thông tin bắt buộc" };

  const conflict = await db.staff.findFirst({ where: { code, NOT: { id } } });
  if (conflict) return { error: "Mã nhân viên đã tồn tại" };

  await db.staff.update({
    where: { id },
    data: { code, name, department, active },
  });

  revalidateStaff();
  return {};
}

export async function deleteStaff(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  const usageCount = await db.usageLog.count({ where: { performedByStaffId: id } });
  if (usageCount > 0) {
    return { error: "Không thể xóa — nhân viên đã có nhật ký sử dụng. Hãy đặt inactive." };
  }

  await db.staff.delete({ where: { id } });
  revalidateStaff();
  return {};
}
