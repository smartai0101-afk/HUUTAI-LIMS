"use server";

import type { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin, requirePermission } from "@/lib/auth/guards";
import { labelToRole, roleToLabel, roles, type Role } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const PEOPLE_PATHS = ["/admin/people", "/admin/users", "/admin/staff", "/usage-logs"];

function revalidatePeople() {
  PEOPLE_PATHS.forEach((p) => revalidatePath(p));
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function bool(fd: FormData, key: string) {
  return str(fd, key) === "true";
}

export type PersonKind = "linked" | "staff_only" | "user_only";

export type PersonListItem = {
  rowKey: string;
  staffId: string | null;
  userId: string | null;
  code: string;
  name: string;
  department: string;
  staffActive: boolean;
  email: string;
  role: Role | null;
  userStatus: UserStatus | null;
  kind: PersonKind;
  statusLabel: string;
  typeLabel: string;
};

function statusLabel(staffActive: boolean, userStatus: UserStatus | null, kind: PersonKind): string {
  if (kind === "user_only") {
    return userStatus === "Active" ? "Active" : "Disabled";
  }
  if (!staffActive) return "Ngưng làm việc";
  if (userStatus === "Disabled") return "Disabled";
  return "Đang làm việc";
}

function typeLabel(kind: PersonKind): string {
  if (kind === "linked") return "Có đăng nhập";
  if (kind === "staff_only") return "Chỉ nhân viên";
  return "Chưa gắn hồ sơ";
}

export async function listPeople(): Promise<PersonListItem[]> {
  const [staffRows, orphanUsers] = await Promise.all([
    db.staff.findMany({
      orderBy: { name: "asc" },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true, name: true },
        },
      },
    }),
    db.user.findMany({
      where: { staffId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, status: true },
    }),
  ]);

  const fromStaff: PersonListItem[] = staffRows.map((row) => {
    const kind: PersonKind = row.user ? "linked" : "staff_only";
    return {
      rowKey: row.user ? `u-${row.user.id}` : `s-${row.id}`,
      staffId: row.id,
      userId: row.user?.id ?? null,
      code: row.code,
      name: row.name,
      department: row.department,
      staffActive: row.active,
      email: row.user?.email ?? "",
      role: row.user ? roleToLabel(row.user.role) : null,
      userStatus: row.user?.status ?? null,
      kind,
      statusLabel: statusLabel(row.active, row.user?.status ?? null, kind),
      typeLabel: typeLabel(kind),
    };
  });

  const fromUsers: PersonListItem[] = orphanUsers.map((user) => ({
    rowKey: `u-${user.id}`,
    staffId: null,
    userId: user.id,
    code: "",
    name: user.name,
    department: "",
    staffActive: true,
    email: user.email,
    role: roleToLabel(user.role),
    userStatus: user.status,
    kind: "user_only" as const,
    statusLabel: statusLabel(true, user.status, "user_only"),
    typeLabel: typeLabel("user_only"),
  }));

  return [...fromStaff, ...fromUsers].sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" }),
  );
}

async function validateLoginFields(
  fd: FormData,
  isCreate: boolean,
): Promise<
  | { error: string }
  | { email: string; password: string; role: UserRole; status: UserStatus; roleLabel: Role }
> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const roleLabel = str(fd, "role") as Role;
  const status = str(fd, "status") as UserStatus;

  if (!email) return { error: "Email là bắt buộc khi bật đăng nhập" };
  if (isCreate && !password) return { error: "Mật khẩu là bắt buộc khi tạo tài khoản" };
  if (password && password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự" };
  if (!roles.includes(roleLabel)) return { error: "Role không hợp lệ" };
  if (status !== "Active" && status !== "Disabled") return { error: "Trạng thái không hợp lệ" };

  return {
    email,
    password,
    role: labelToRole(roleLabel),
    status,
    roleLabel,
  };
}

export async function createPerson(formData: FormData): Promise<{ error?: string }> {
  const auth = await requirePermission("admin_people", "write");
  if ("error" in auth) return { error: auth.error };

  const code = str(formData, "code");
  const name = str(formData, "name");
  const department = str(formData, "department");
  const active = bool(formData, "active");
  const hasLogin = bool(formData, "hasLogin");

  if (!code || !name) return { error: "Mã và tên nhân viên là bắt buộc" };

  const existingCode = await db.staff.findUnique({ where: { code } });
  if (existingCode) return { error: "Mã nhân viên đã tồn tại" };

  if (hasLogin) {
    const adminAuth = await requireAdmin();
    if ("error" in adminAuth) return { error: adminAuth.error };

    const login = await validateLoginFields(formData, true);
    if ("error" in login) return login;

    const existingEmail = await db.user.findUnique({ where: { email: login.email } });
    if (existingEmail) return { error: "Email đã tồn tại" };

    await db.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: { code, name, department, active },
      });
      await tx.user.create({
        data: {
          name,
          email: login.email,
          passwordHash: await hashPassword(login.password),
          role: login.role,
          status: login.status,
          staffId: staff.id,
        },
      });
    });
  } else {
    await db.staff.create({
      data: { code, name, department, active },
    });
  }

  revalidatePeople();
  return {};
}

export async function updatePerson(formData: FormData): Promise<{ error?: string }> {
  const auth = await requirePermission("admin_people", "write");
  if ("error" in auth) return { error: auth.error };

  const staffId = str(formData, "staffId");
  const userId = str(formData, "userId");
  const code = str(formData, "code");
  const name = str(formData, "name");
  const department = str(formData, "department");
  const active = bool(formData, "active");
  const hasLogin = bool(formData, "hasLogin");

  if (!name) return { error: "Tên là bắt buộc" };

  if (userId && !staffId) {
    const adminAuth = await requireAdmin();
    if ("error" in adminAuth) return { error: adminAuth.error };
    if (!code) return { error: "Mã nhân viên là bắt buộc để gắn hồ sơ" };

    const existingCode = await db.staff.findUnique({ where: { code } });
    if (existingCode) return { error: "Mã nhân viên đã tồn tại" };

    const login = await validateLoginFields(formData, false);
    if ("error" in login) return login;

    const emailTaken = await db.user.findFirst({
      where: { email: login.email, NOT: { id: userId } },
    });
    if (emailTaken) return { error: "Email đã tồn tại" };

    await db.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: { code, name, department, active },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          name,
          staffId: staff.id,
          email: login.email,
          role: login.role,
          status: login.status,
          ...(login.password ? { passwordHash: await hashPassword(login.password) } : {}),
        },
      });
    });

    revalidatePeople();
    return {};
  }

  if (!staffId) return { error: "Thiếu thông tin nhân sự" };
  if (!code) return { error: "Mã nhân viên là bắt buộc" };

  const conflict = await db.staff.findFirst({ where: { code, NOT: { id: staffId } } });
  if (conflict) return { error: "Mã nhân viên đã tồn tại" };

  const existingUser = userId
    ? await db.user.findUnique({ where: { id: userId } })
    : await db.user.findFirst({ where: { staffId } });

  await db.staff.update({
    where: { id: staffId },
    data: { code, name, department, active },
  });

  if (hasLogin) {
    const adminAuth = await requireAdmin();
    if ("error" in adminAuth) return { error: adminAuth.error };

    const login = await validateLoginFields(formData, !existingUser);
    if ("error" in login) return login;

    if (existingUser) {
      const emailTaken = await db.user.findFirst({
        where: { email: login.email, NOT: { id: existingUser.id } },
      });
      if (emailTaken) return { error: "Email đã tồn tại" };

      await db.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          email: login.email,
          role: login.role,
          status: login.status,
          staffId,
          ...(login.password ? { passwordHash: await hashPassword(login.password) } : {}),
        },
      });
    } else {
      const emailTaken = await db.user.findUnique({ where: { email: login.email } });
      if (emailTaken) return { error: "Email đã tồn tại" };
      if (!login.password) return { error: "Mật khẩu là bắt buộc khi tạo tài khoản" };

      await db.user.create({
        data: {
          name,
          email: login.email,
          passwordHash: await hashPassword(login.password),
          role: login.role,
          status: login.status,
          staffId,
        },
      });
    }
  } else if (existingUser) {
    const adminAuth = await requireAdmin();
    if ("error" in adminAuth) return { error: adminAuth.error };
    await db.user.delete({ where: { id: existingUser.id } });
  }

  revalidatePeople();
  return {};
}

export async function deletePerson(formData: FormData): Promise<{ error?: string }> {
  const auth = await requirePermission("admin_people", "write");
  if ("error" in auth) return { error: auth.error };

  const staffId = str(formData, "staffId");
  const userId = str(formData, "userId");

  if (userId) {
    const adminAuth = await requireAdmin();
    if ("error" in adminAuth) return { error: adminAuth.error };
    if (userId === auth.user.id) return { error: "Không thể xóa tài khoản đang đăng nhập" };
  }

  if (staffId) {
    const usageCount = await db.usageLog.count({ where: { performedByStaffId: staffId } });
    if (usageCount > 0) {
      return { error: "Không thể xóa — nhân viên đã có nhật ký sử dụng. Hãy đặt inactive." };
    }

    const linkedUser = await db.user.findFirst({ where: { staffId } });
    if (linkedUser) {
      const adminAuth = await requireAdmin();
      if ("error" in adminAuth) return { error: adminAuth.error };
      await db.user.delete({ where: { id: linkedUser.id } });
    }

    await db.staff.delete({ where: { id: staffId } });
  } else if (userId) {
    await db.user.delete({ where: { id: userId } });
  } else {
    return { error: "Thiếu thông tin để xóa" };
  }

  revalidatePeople();
  return {};
}
