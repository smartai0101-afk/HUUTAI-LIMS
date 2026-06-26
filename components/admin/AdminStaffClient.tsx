"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ModalShell } from "@/components/ModalShell";
import { useToast } from "@/components/ToastProvider";
import {
  createStaff,
  deleteStaff,
  updateStaff,
  type StaffListItem,
} from "@/lib/actions/admin-staff";

const initialForm = { code: "", name: "", department: "", active: true };

export function AdminStaffClient({ staff }: { staff: StaffListItem[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffListItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [pending, startTransition] = useTransition();

  const title = useMemo(() => (editing ? "Sửa nhân viên" : "Thêm nhân viên"), [editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (row: StaffListItem) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      department: row.department,
      active: row.active,
    });
    setOpen(true);
  };

  const submit = () => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    fd.set("code", form.code);
    fd.set("name", form.name);
    fd.set("department", form.department);
    fd.set("active", String(form.active));

    startTransition(async () => {
      const result = editing ? await updateStaff(fd) : await createStaff(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(editing ? "Đã cập nhật nhân viên" : "Đã tạo nhân viên", "success");
      setOpen(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteStaff(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa nhân viên", "success");
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
            <h1 className="text-2xl font-semibold text-slate-900">Quản lý nhân viên</h1>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </button>
        </div>

        <DataTable
          columns={[
            { key: "code", header: "Mã" },
            { key: "name", header: "Tên" },
            { key: "department", header: "Phòng ban" },
            {
              key: "active",
              header: "Trạng thái",
              render: (v) => (v ? "Đang làm việc" : "Ngưng"),
            },
          ]}
          rows={staff}
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
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Mã"
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
          {editing ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Đang làm việc
            </label>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="h-10 w-full rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950"
          >
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa nhân viên?"
        message={`Xóa ${deleteTarget?.name ?? ""}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
