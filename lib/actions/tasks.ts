"use server";

import type { TaskStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { roleToLabel } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const TASK_PATH = "/admin/tasks";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type TaskView = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  assignedToId: string;
  assignedToName: string;
  assignedByName: string;
  createdAt: string;
};

export async function listTasks(): Promise<TaskView[]> {
  const auth = await requireAuth();
  if ("error" in auth) return [];

  const where =
    auth.user.role === "Admin" || auth.user.role === "LabManager"
      ? {}
      : { assignedToId: auth.user.id };

  const tasks = await db.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
      assignedBy: { select: { name: true } },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
    assignedToId: t.assignedToId,
    assignedToName: t.assignedTo.name,
    assignedByName: t.assignedBy.name,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function listAssignableUsers(): Promise<{ id: string; name: string; role: string }[]> {
  const auth = await requireRole(["Admin", "LabManager"]);
  if ("error" in auth) return [];

  const roles: UserRole[] = ["Analyst", "QAQC", "LabManager"];
  const users = await db.user.findMany({
    where: { status: "Active", role: { in: roles } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  return users.map((u) => ({ id: u.id, name: u.name, role: roleToLabel(u.role) }));
}

export async function createTask(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireRole(["Admin", "LabManager"]);
  if ("error" in auth) return { error: auth.error };

  const title = str(formData, "title");
  const description = str(formData, "description");
  const assignedToId = str(formData, "assignedToId");
  const dueDate = parseDate(str(formData, "dueDate"));

  if (!title || !assignedToId) return { error: "Vui lòng điền tiêu đề và người nhận" };

  await db.task.create({
    data: {
      title,
      description,
      assignedToId,
      assignedById: auth.user.id,
      dueDate,
      status: "Pending",
    },
  });

  revalidatePath(TASK_PATH);
  return {};
}

export async function updateTaskStatus(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  const status = str(formData, "status") as TaskStatus;
  const valid: TaskStatus[] = ["Pending", "InProgress", "Completed", "NeedsRevision", "Cancelled"];
  if (!id || !valid.includes(status)) return { error: "Dữ liệu không hợp lệ" };

  const task = await db.task.findUnique({ where: { id } });
  if (!task) return { error: "Task không tồn tại" };

  const isManager = auth.user.role === "Admin" || auth.user.role === "LabManager";
  const isAssignee = task.assignedToId === auth.user.id;
  const isQaReview = auth.user.role === "QAQC" && status === "NeedsRevision";

  if (!isManager && !isAssignee && !isQaReview) {
    return { error: "Bạn không có quyền cập nhật task này" };
  }

  if (isAssignee && !isManager && (status === "Cancelled" || status === "NeedsRevision")) {
    if (status === "NeedsRevision") {
      /* QA only */
    } else {
      return { error: "Analyst không thể hủy task" };
    }
  }

  await db.task.update({ where: { id }, data: { status } });
  revalidatePath(TASK_PATH);
  return {};
}

export async function deleteTask(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireRole(["Admin", "LabManager"]);
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  if (!id) return { error: "Thiếu id task" };

  await db.task.delete({ where: { id } });
  revalidatePath(TASK_PATH);
  return {};
}
