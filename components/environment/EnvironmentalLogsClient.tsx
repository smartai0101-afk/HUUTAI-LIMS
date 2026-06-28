"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { ModalShell } from "@/components/ModalShell";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createEnvironmentalLog,
  deleteEnvironmentalLog,
  updateEnvironmentalLog,
} from "@/lib/actions/environmental-logs";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { EnvironmentalLogListParams } from "@/lib/services/environmental-logs";
import type { StaffView } from "@/lib/services/staff";
import { formatDate } from "@/lib/utils";
import type { EnvironmentalLogView } from "@/types";

const initialForm = {
  loggedAt: "",
  location: "",
  temperature: "",
  humidity: "",
  recordedByStaffId: "",
  notes: "",
};

export function EnvironmentalLogsClient({
  listResult,
  listQuery,
  staff,
}: {
  listResult: PaginatedResult<EnvironmentalLogView>;
  listQuery: EnvironmentalLogListParams;
  staff: StaffView[];
}) {
  const router = useRouter();
  const { canEdit } = useRole();
  const { addToast } = useToast();
  const { setQuery, toggleSort, setPage, setLimit } = useListQueryState();
  const [selected, setSelected] = useState<EnvironmentalLogView | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentalLogView | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => listResult.items, [listResult.items]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ ...initialForm, loggedAt: new Date().toISOString().slice(0, 10) });
    setIsFormOpen(true);
  };

  const openEdit = (item: EnvironmentalLogView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      loggedAt: item.loggedAt,
      location: item.location,
      temperature: item.temperature != null ? String(item.temperature) : "",
      humidity: item.humidity != null ? String(item.humidity) : "",
      recordedByStaffId: item.recordedByStaffId ?? "",
      notes: item.notes,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.loggedAt || !form.location.trim()) {
      addToast("Ngày ghi nhận và vị trí là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.set(key, value));
    if (isEditing && editingId) fd.set("id", editingId);

    startTransition(async () => {
      const result = isEditing ? await updateEnvironmentalLog(fd) : await createEnvironmentalLog(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật nhật ký môi trường" : "Đã tạo nhật ký môi trường", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteEnvironmentalLog(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa nhật ký môi trường", "success");
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">ISO/IEC 17025</p>
            <h1 className="text-2xl font-semibold text-slate-900">Nhật ký môi trường</h1>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Ghi nhận môi trường
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={listQuery.q}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm vị trí, người ghi, ghi chú..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={[
              {
                key: "loggedAt",
                header: "Ngày ghi",
                sortable: true,
                sortKey: "loggedAt",
                render: (v) => formatDate(String(v)),
              },
              { key: "location", header: "Vị trí", sortable: true, sortKey: "location" },
              {
                key: "temperature",
                header: "Nhiệt độ",
                sortable: true,
                sortKey: "temperature",
                render: (v) => (v != null ? `${v}°C` : "—"),
              },
              {
                key: "humidity",
                header: "Độ ẩm",
                sortable: true,
                sortKey: "humidity",
                render: (v) => (v != null ? `${v}%` : "—"),
              },
              {
                key: "recordedByStaffName",
                header: "Người ghi",
                sortable: true,
                sortKey: "recordedByStaffName",
              },
              { key: "notes", header: "Ghi chú", sortable: true, sortKey: "notes" },
            ]}
            rows={rows}
            getRowKey={(row) => row.id}
            onRowClick={(row) => setSelected(row)}
            sort={{
              sortBy: listQuery.sortBy,
              sortOrder: listQuery.sortOrder,
              sortActive: listQuery.sortActive,
              onSort: toggleSort,
            }}
          />
          <ListPaginationBar
            page={listResult.page}
            totalPages={listResult.totalPages}
            total={listResult.total}
            limit={listResult.limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.location ?? ""}
        subtitle={selected?.loggedAt}
        tabs={["Chi tiết"]}
        activeTab="Chi tiết"
        onTabChange={() => {}}
        layout="stacked"
        maxWidth="5xl"
        actions={
          selected && canEdit ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(selected)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(selected)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          ) : undefined
        }
        tabContent={
          selected ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-slate-500">Nhiệt độ:</span>{" "}
                {selected.temperature != null ? `${selected.temperature}°C` : "—"}
              </p>
              <p>
                <span className="text-slate-500">Độ ẩm:</span>{" "}
                {selected.humidity != null ? `${selected.humidity}%` : "—"}
              </p>
              <p>
                <span className="text-slate-500">Người ghi:</span> {selected.recordedByStaffName || "—"}
              </p>
              <p className="whitespace-pre-wrap">
                <span className="text-slate-500">Ghi chú:</span> {selected.notes || "—"}
              </p>
              <p className="whitespace-pre-wrap text-slate-600">{selected.snapshotText}</p>
            </div>
          ) : null
        }
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Sửa nhật ký môi trường" : "Ghi nhận môi trường"}
          </h2>
          <button type="button" onClick={() => setIsFormOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Ngày ghi *</label>
            <input
              type="date"
              value={form.loggedAt}
              onChange={(e) => setForm((p) => ({ ...p, loggedAt: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Vị trí *</label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Nhiệt độ (°C)</label>
            <input
              value={form.temperature}
              onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Độ ẩm (%)</label>
            <input
              value={form.humidity}
              onChange={(e) => setForm((p) => ({ ...p, humidity: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">Người ghi</label>
            <select
              value={form.recordedByStaffId}
              onChange={(e) => setForm((p) => ({ ...p, recordedByStaffId: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">—</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isEditing ? "Lưu" : "Tạo"}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa nhật ký môi trường"
        message={`Bạn có chắc muốn xóa bản ghi tại ${deleteTarget?.location}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
