"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { FilterChipBar } from "@/components/FilterChipBar";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { ScheduleStatusBadge } from "@/components/equipment/ScheduleStatusBadge";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createMaintenancePlan,
  deleteMaintenancePlan,
  updateMaintenancePlan,
} from "@/lib/actions/equipment-maintenance";
import { SCHEDULE_STATUS_FILTERS } from "@/lib/equipment-schedule";
import { EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { MaintenancePlanListParams } from "@/lib/services/equipment-maintenance";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { MaintenancePlanView } from "@/types";

const exportColumns = [
  { key: "equipmentCode", header: "Mã thiết bị" },
  { key: "name", header: "Kế hoạch" },
  { key: "cycleMonths", header: "Chu kỳ (tháng)" },
  { key: "nextDate", header: EQUIPMENT_COLUMN.maintenanceNext },
  { key: "statusLabel", header: "Trạng thái" },
];

const initialForm = { equipmentId: "", name: "", cycleMonths: "6", lastDate: "", vendor: "", notes: "" };

export function MaintenancePlansClient({
  result,
  equipmentOptions,
  listQuery,
}: {
  result: PaginatedResult<MaintenancePlanView>;
  equipmentOptions: EquipmentOption[];
  listQuery: MaintenancePlanListParams;
}) {
  const router = useRouter();
  const { setQuery, setFilter, toggleSort } = useListQueryState();
  const [selected, setSelected] = useState<MaintenancePlanView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenancePlanView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const rows = result.items;

  const submit = () => {
    if (!form.equipmentId || !form.name.trim()) {
      addToast("Thiết bị và tên kế hoạch là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateMaintenancePlan(fd) : await createMaintenancePlan(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast(isEditing ? "Đã cập nhật" : "Đã thêm kế hoạch bảo trì", "success");
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
      const result = await deleteMaintenancePlan(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã xóa kế hoạch bảo trì", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <EquipmentModuleShell
        title="Kế hoạch bảo trì"
        subtitle={EQUIPMENT_SUBTITLE}
        query={listQuery.q}
        onQueryChange={setQuery}
        onExport={() => { exportToXlsx("ke-hoach-bao-tri", rows.map((r) => ({ ...r })), exportColumns); addToast("Đã export Excel", "success"); }}
        onCreate={() => { setIsEditing(false); setEditingId(null); setForm(initialForm); setIsFormOpen(true); }}
        createLabel="Thêm kế hoạch"
        canEdit={canEdit}
        filters={
          <FilterChipBar
            options={SCHEDULE_STATUS_FILTERS.map((s) => ({
              value: s,
              label:
                s === "All"
                  ? "Tất cả"
                  : s === "Green"
                    ? "Còn hạn"
                    : s === "Yellow"
                      ? "Sắp đến hạn"
                      : "Quá hạn",
            }))}
            value={listQuery.status}
            onChange={(v) => setFilter("status", v === "All" ? null : v)}
          />
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode, sortable: true, sortKey: "equipmentCode" },
            { key: "equipmentName", header: "Tên thiết bị", sortable: true, sortKey: "equipmentName" },
            { key: "name", header: "Kế hoạch", sortable: true, sortKey: "name" },
            { key: "cycleMonths", header: "Chu kỳ (tháng)", sortable: true, sortKey: "cycleMonths" },
            { key: "nextDate", header: EQUIPMENT_COLUMN.maintenanceNext, sortable: true, sortKey: "nextDate", render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "status", header: "Trạng thái", sortable: true, sortKey: "status", render: (v) => <ScheduleStatusBadge status={String(v)} /> },
          ]}
          rows={rows}
          sort={{
            sortBy: listQuery.sortBy,
            sortOrder: listQuery.sortOrder,
            sortActive: listQuery.sortActive,
            onSort: toggleSort,
          }}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
          rowActions={canManage ? (row) => (
            <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"><Trash2 className="inline h-3 w-3" /></button>
          ) : undefined}
        />
      </EquipmentModuleShell>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.equipmentCode} tabs={["Chi tiết"]} activeTab="Chi tiết" onTabChange={() => undefined}
        actions={selected && canEdit ? (
          <button type="button" onClick={() => { setIsEditing(true); setEditingId(selected.id); setForm({ equipmentId: selected.equipmentId, name: selected.name, cycleMonths: String(selected.cycleMonths), lastDate: selected.lastDate, vendor: selected.vendor, notes: selected.notes }); setIsFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
        ) : undefined}
        tabContent={selected ? <div className="space-y-2 text-sm"><p>Chu kỳ: {selected.cycleMonths} tháng</p><p>Đơn vị: {selected.vendor || "-"}</p><p className="whitespace-pre-wrap">{selected.notes || "-"}</p></div> : null}
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{isEditing ? "Sửa kế hoạch bảo trì" : "Thêm kế hoạch bảo trì"}</h2><button onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3">
          <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))} options={equipmentOptions} disabled={isEditing} />
          <input placeholder="Tên kế hoạch" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Chu kỳ (tháng)" value={form.cycleMonths} onChange={(e) => setForm((p) => ({ ...p, cycleMonths: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            <input type="date" value={form.lastDate} onChange={(e) => setForm((p) => ({ ...p, lastDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <input placeholder="Đơn vị thực hiện" value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <textarea placeholder="Ghi chú" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button disabled={pending} onClick={submit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa kế hoạch bảo trì" message="Bạn có chắc muốn xóa kế hoạch bảo trì này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
