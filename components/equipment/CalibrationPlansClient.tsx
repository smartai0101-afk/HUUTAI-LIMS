"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { ScheduleStatusBadge } from "@/components/equipment/ScheduleStatusBadge";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createCalibrationPlan,
  deleteCalibrationPlan,
  updateCalibrationPlan,
} from "@/lib/actions/equipment-calibration";
import { SCHEDULE_STATUS_FILTERS } from "@/lib/equipment-schedule";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import { EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import type { CalibrationPlanView } from "@/types";

const exportColumns = [
  { key: "equipmentCode", header: "Mã thiết bị" },
  { key: "equipmentName", header: "Tên thiết bị" },
  { key: "name", header: "Tên kế hoạch" },
  { key: "cycleMonths", header: "Chu kỳ (tháng)" },
  { key: "lastDate", header: EQUIPMENT_COLUMN.lastCalibration },
  { key: "nextDate", header: EQUIPMENT_COLUMN.nextCalibration },
  { key: "vendor", header: EQUIPMENT_COLUMN.calibrationVendor },
  { key: "statusLabel", header: "Trạng thái" },
];

const initialForm = {
  equipmentId: "",
  name: "",
  cycleMonths: "12",
  lastDate: "",
  vendor: "",
  notes: "",
};

export function CalibrationPlansClient({
  items,
  equipmentOptions,
}: {
  items: CalibrationPlanView[];
  equipmentOptions: EquipmentOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof SCHEDULE_STATUS_FILTERS)[number]>("All");
  const [selected, setSelected] = useState<CalibrationPlanView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalibrationPlanView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchQuery =
        !q ||
        item.equipmentCode.toLowerCase().includes(q) ||
        item.equipmentName.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [items, query, statusFilter]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: CalibrationPlanView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      equipmentId: item.equipmentId,
      name: item.name,
      cycleMonths: String(item.cycleMonths),
      lastDate: item.lastDate,
      vendor: item.vendor,
      notes: item.notes,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.equipmentId || !form.name.trim()) {
      addToast("Thiết bị và tên kế hoạch là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateCalibrationPlan(fd) : await createCalibrationPlan(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật kế hoạch hiệu chuẩn" : "Đã thêm kế hoạch hiệu chuẩn", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteCalibrationPlan(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa kế hoạch hiệu chuẩn", "success");
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    exportToXlsx("ke-hoach-hieu-chuan", filtered.map((r) => ({ ...r })), exportColumns);
    addToast("Đã export Excel", "success");
  };

  return (
    <EquipmentAppShell>
      <EquipmentModuleShell
        title="Kế hoạch hiệu chuẩn"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Tìm theo mã thiết bị, tên kế hoạch..."
        onExport={handleExport}
        onCreate={openCreate}
        createLabel="Thêm kế hoạch"
        canEdit={canEdit}
        filters={
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-2 text-sm ${statusFilter === s ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {s === "All" ? "Tất cả" : s === "Green" ? "Còn hạn" : s === "Yellow" ? "Sắp đến hạn" : "Quá hạn"}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
            { key: "equipmentName", header: "Tên thiết bị" },
            { key: "name", header: "Kế hoạch" },
            { key: "cycleMonths", header: "Chu kỳ (tháng)" },
            { key: "lastDate", header: EQUIPMENT_COLUMN.lastCalibration, render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "nextDate", header: EQUIPMENT_COLUMN.nextCalibration, render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "vendor", header: EQUIPMENT_COLUMN.calibrationVendor },
            { key: "status", header: "Trạng thái", render: (v) => <ScheduleStatusBadge status={String(v)} /> },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
          rowActionsHeader="Hành động"
          rowActions={
            canManage
              ? (row) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(row);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />Xóa
                  </button>
                )
              : undefined
          }
        />
      </EquipmentModuleShell>

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.equipmentCode} — ${selected.equipmentName}` : undefined}
        tabs={["Chi tiết"]}
        activeTab="Chi tiết"
        onTabChange={() => undefined}
        actions={
          selected && canEdit ? (
            <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <Edit className="h-4 w-4" />Sửa
            </button>
          ) : undefined
        }
        tabContent={
          selected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs text-slate-500">Chu kỳ</p><p className="font-medium">{selected.cycleMonths} tháng</p></div>
              <div><p className="text-xs text-slate-500">Trạng thái</p><ScheduleStatusBadge status={selected.status} /></div>
              <div><p className="text-xs text-slate-500">{EQUIPMENT_COLUMN.lastCalibration}</p><p className="font-medium">{selected.lastDate ? formatDate(selected.lastDate) : "-"}</p></div>
              <div><p className="text-xs text-slate-500">{EQUIPMENT_COLUMN.nextCalibration}</p><p className="font-medium">{selected.nextDate ? formatDate(selected.nextDate) : "-"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-slate-500">Ghi chú</p><p className="font-medium whitespace-pre-wrap">{selected.notes || "-"}</p></div>
            </div>
          ) : null
        }
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? "Sửa kế hoạch hiệu chuẩn" : "Thêm kế hoạch hiệu chuẩn"}</h2>
          <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Thiết bị</label>
            <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))} options={equipmentOptions} disabled={isEditing} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Tên kế hoạch</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Chu kỳ (tháng)</label>
              <input type="number" value={form.cycleMonths} onChange={(e) => setForm((p) => ({ ...p, cycleMonths: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_COLUMN.lastCalibration}</label>
              <input type="date" value={form.lastDate} onChange={(e) => setForm((p) => ({ ...p, lastDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_COLUMN.calibrationVendor}</label>
            <input value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa kế hoạch hiệu chuẩn"
        message="Bạn có chắc muốn xóa kế hoạch hiệu chuẩn này?"
        cancelLabel="Hủy"
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </EquipmentAppShell>
  );
}
