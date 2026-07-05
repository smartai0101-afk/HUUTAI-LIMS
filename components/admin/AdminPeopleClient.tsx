"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ModalShell } from "@/components/ModalShell";
import type { UserStatus } from "@prisma/client";
import { roles, type Role } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createPerson,
  deletePerson,
  updatePerson,
  type PersonListItem,
} from "@/lib/actions/admin-people";

type FormState = {
  code: string;
  name: string;
  department: string;
  active: boolean;
  hasLogin: boolean;
  email: string;
  password: string;
  role: Role;
  userStatus: UserStatus;
};

const initialForm: FormState = {
  code: "",
  name: "",
  department: "",
  active: true,
  hasLogin: false,
  email: "",
  password: "",
  role: "Analyst",
  userStatus: "Active",
};

function formFromRow(row: PersonListItem): FormState {
  return {
    code: row.code,
    name: row.name,
    department: row.department,
    active: row.staffActive,
    hasLogin: row.kind !== "staff_only",
    email: row.email,
    password: "",
    role: row.role ?? "Analyst",
    userStatus: row.userStatus ?? "Active",
  };
}

export function AdminPeopleClient({
  people,
  canManageLogin,
}: {
  people: PersonListItem[];
  canManageLogin: boolean;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonListItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [pending, startTransition] = useTransition();

  const title = useMemo(() => (editing ? "Sửa nhân sự" : "Thêm nhân sự"), [editing]);
  const isUserOnly = editing?.kind === "user_only";

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (row: PersonListItem) => {
    setEditing(row);
    setForm(formFromRow(row));
    setOpen(true);
  };

  const submit = () => {
    const fd = new FormData();
    if (editing?.staffId) fd.set("staffId", editing.staffId);
    if (editing?.userId) fd.set("userId", editing.userId);
    fd.set("code", form.code);
    fd.set("name", form.name);
    fd.set("department", form.department);
    fd.set("active", String(form.active));
    fd.set("hasLogin", String(form.hasLogin && canManageLogin));
    if (form.hasLogin && canManageLogin) {
      fd.set("email", form.email);
      fd.set("role", form.role);
      fd.set("status", form.userStatus);
      if (form.password) fd.set("password", form.password);
    }

    startTransition(async () => {
      const result = editing ? await updatePerson(fd) : await createPerson(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(editing ? "Đã cập nhật nhân sự" : "Đã tạo nhân sự", "success");
      setOpen(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    if (deleteTarget.staffId) fd.set("staffId", deleteTarget.staffId);
    if (deleteTarget.userId) fd.set("userId", deleteTarget.userId);
    startTransition(async () => {
      const result = await deletePerson(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa nhân sự", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const showLoginSection = canManageLogin && (form.hasLogin || isUserOnly);

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Administration</p>
            <h1 className="text-2xl font-semibold text-slate-900">Quản lý nhân sự</h1>
            <p className="mt-1 text-sm text-slate-500">
              Hồ sơ nhân viên phòng lab và tài khoản đăng nhập trong một bảng.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm nhân sự
          </button>
        </div>

        <DataTable
          columns={[
            { key: "code", header: "Mã", render: (v) => (v ? String(v) : "—") },
            { key: "name", header: "Tên" },
            { key: "department", header: "Phòng ban", render: (v) => (v ? String(v) : "—") },
            { key: "email", header: "Email", render: (v) => (v ? String(v) : "—") },
            { key: "role", header: "Role", render: (v) => (v ? String(v) : "—") },
            { key: "statusLabel", header: "Trạng thái" },
            {
              key: "typeLabel",
              header: "Loại",
              render: (v) => (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {String(v)}
                </span>
              ),
            },
          ]}
          rows={people}
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

      <ModalShell open={open} onClose={() => setOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hồ sơ nhân viên</p>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Mã nhân viên"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tên"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <input
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="Phòng ban"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Đang làm việc
          </label>

          {canManageLogin && !isUserOnly ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.hasLogin}
                onChange={(e) => setForm((f) => ({ ...f, hasLogin: e.target.checked }))}
              />
              Cho phép đăng nhập
            </label>
          ) : null}

          {showLoginSection ? (
            <>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tài khoản đăng nhập
              </p>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                type="email"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing?.userId ? "Mật khẩu mới (để trống nếu giữ)" : "Mật khẩu"}
                type="password"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                value={form.userStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, userStatus: e.target.value as UserStatus }))
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </>
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
        title="Xóa nhân sự"
        message={`Xóa ${deleteTarget?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
