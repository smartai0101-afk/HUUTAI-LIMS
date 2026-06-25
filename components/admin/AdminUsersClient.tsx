"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ModalShell } from "@/components/ModalShell";
import type { UserStatus } from "@prisma/client";
import { roles, type Role } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createUser,
  deleteUser,
  updateUser,
  type UserListItem,
} from "@/lib/actions/admin-users";

const initialForm: {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
} = { name: "", email: "", password: "", role: "Analyst", status: "Active" };

export function AdminUsersClient({ users }: { users: UserListItem[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [pending, startTransition] = useTransition();

  const title = useMemo(() => (editing ? "Sửa user" : "Thêm user"), [editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setOpen(true);
  };

  const submit = () => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    fd.set("name", form.name);
    fd.set("email", form.email);
    fd.set("role", form.role);
    fd.set("status", form.status);
    if (form.password) fd.set("password", form.password);

    startTransition(async () => {
      const result = editing ? await updateUser(fd) : await createUser(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(editing ? "Đã cập nhật user" : "Đã tạo user", "success");
      setOpen(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteUser(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa user", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Administration</p>
            <h1 className="text-2xl font-semibold text-slate-900">Quản lý người dùng</h1>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm user
          </button>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Tên" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            {
              key: "status",
              header: "Trạng thái",
              render: (v) => (
                <span className={v === "Active" ? "text-emerald-700" : "text-slate-500"}>
                  {String(v)}
                </span>
              ),
            },
          ]}
          rows={users}
          rowActions={(row) => (
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(row)} className="text-cyan-700">
                <Edit className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setDeleteTarget(row)} className="text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      </div>

      <ModalShell open={open} onClose={() => setOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        <div className="space-y-4">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tên"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            type="email"
            disabled={!!editing}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm disabled:bg-slate-50"
          />
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={editing ? "Mật khẩu mới (để trống nếu giữ)" : "Mật khẩu"}
            type="password"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as typeof form.role }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {editing ? (
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))
              }
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="h-10 w-full rounded-xl bg-cyan-600 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa user"
        message={`Xóa ${deleteTarget?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
