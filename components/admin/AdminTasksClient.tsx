"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ModalShell } from "@/components/ModalShell";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createTask,
  deleteTask,
  updateTaskStatus,
  type TaskView,
} from "@/lib/actions/tasks";

const STATUS_OPTIONS = [
  "Pending",
  "InProgress",
  "Completed",
  "NeedsRevision",
  "Cancelled",
] as const;

export function AdminTasksClient({
  tasks,
  assignableUsers,
}: {
  tasks: TaskView[];
  assignableUsers: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, role } = useSession();
  const canAssign = role === "Admin" || role === "Lab Manager";
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaskView | null>(null);
  const [form, setForm] = useState({ title: "", description: "", assignedToId: "", dueDate: "" });
  const [pending, startTransition] = useTransition();

  const submitCreate = () => {
    const fd = new FormData();
    fd.set("title", form.title);
    fd.set("description", form.description);
    fd.set("assignedToId", form.assignedToId);
    fd.set("dueDate", form.dueDate);
    startTransition(async () => {
      const result = await createTask(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã giao task", "success");
      setOpen(false);
      setForm({ title: "", description: "", assignedToId: "", dueDate: "" });
      router.refresh();
    });
  };

  const changeStatus = (task: TaskView, status: string) => {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", status);
    startTransition(async () => {
      const result = await updateTaskStatus(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã cập nhật trạng thái", "success");
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteTask(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa task", "success");
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
            <h1 className="text-2xl font-semibold text-slate-900">Giao việc</h1>
          </div>
          {canAssign ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Giao task
            </button>
          ) : null}
        </div>

        <DataTable
          columns={[
            { key: "title", header: "Tiêu đề" },
            { key: "assignedToName", header: "Người nhận" },
            { key: "assignedByName", header: "Người giao" },
            { key: "status", header: "Trạng thái" },
            { key: "dueDate", header: "Hạn" },
          ]}
          rows={tasks}
          rowActions={(row) => (
            <div className="flex flex-wrap items-center gap-2">
              {(canAssign || row.assignedToId === user?.id) && row.status !== "Completed" ? (
                <select
                  value={row.status}
                  onChange={(e) => changeStatus(row, e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : null}
              {canAssign ? (
                <button type="button" onClick={() => setDeleteTarget(row)} className="text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )}
        />
      </div>

      <ModalShell open={open} onClose={() => setOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Giao task mới</h2>
        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Tiêu đề"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.assignedToId}
            onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">Chọn người nhận</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={submitCreate}
            className="h-10 w-full rounded-xl bg-cyan-600 text-sm font-medium text-white disabled:opacity-60"
          >
            Giao việc
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa task"
        message={`Xóa "${deleteTarget?.title}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
