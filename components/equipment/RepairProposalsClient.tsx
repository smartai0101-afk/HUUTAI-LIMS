"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Check, Edit, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { FilterChipBar } from "@/components/FilterChipBar";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  approveRepairCompletion,
  convertProposalToLog,
  createRepairProposal,
  deleteRepairProposal,
  updateRepairProposal,
} from "@/lib/actions/equipment-maintenance";
import { REPAIR_PRIORITY_LABELS, REPAIR_STATUS_LABELS } from "@/lib/equipment-fields";
import { EQUIPMENT_COLUMN, EQUIPMENT_NAV, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { RepairProposalListParams } from "@/lib/services/equipment-maintenance";
import { exportToXlsx } from "@/lib/excel";
import type { RepairProposalView } from "@/types";

const exportColumns = [
  { key: "ticketNo", header: "Số phiếu" },
  { key: "equipmentCode", header: "Mã thiết bị" },
  { key: "priorityLabel", header: "Ưu tiên" },
  { key: "statusLabel", header: "Trạng thái" },
  { key: "reportedBy", header: "Người báo" },
];

const initialForm = { equipmentId: "", ticketNo: "", priority: "Medium", description: "", reportedBy: "", notes: "" };

export function RepairProposalsClient({
  result,
  equipmentOptions,
  defaultTicketNo,
  listQuery,
}: {
  result: PaginatedResult<RepairProposalView>;
  equipmentOptions: EquipmentOption[];
  defaultTicketNo?: string;
  listQuery: RepairProposalListParams;
}) {
  const router = useRouter();
  const { setQuery, setFilter, toggleSort } = useListQueryState();
  const [selected, setSelected] = useState<RepairProposalView | null>(null);
  const [form, setForm] = useState({ ...initialForm, ticketNo: defaultTicketNo ?? "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RepairProposalView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, canApprove, role } = useRole();
  const { addToast } = useToast();

  const rows = result.items;

  const submit = () => {
    if (!form.equipmentId || !form.description.trim()) {
      addToast("Thiết bị và mô tả là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateRepairProposal(fd) : await createRepairProposal(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast(isEditing ? "Đã cập nhật" : "Đã tạo đề xuất sửa chữa", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleApprove = (item: RepairProposalView) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", item.id);
    startTransition(async () => {
      const result = await approveRepairCompletion(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã phê duyệt hoàn thành sửa chữa", "success");
      router.refresh();
    });
  };

  const handleConvert = (item: RepairProposalView) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", item.id);
    startTransition(async () => {
      const result = await convertProposalToLog(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã chuyển sang nhật ký bảo trì/sửa chữa", "success");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteRepairProposal(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã xóa đề xuất", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <>
      <EquipmentModuleShell
        title="Đề xuất sửa chữa"
        subtitle={EQUIPMENT_SUBTITLE}
        query={listQuery.q}
        onQueryChange={setQuery}
        onExport={() => { exportToXlsx("de-xuat-sua-chua", rows.map((r) => ({ ...r })), exportColumns); addToast("Đã export Excel", "success"); }}
        onCreate={() => { setIsEditing(false); setEditingId(null); setForm({ ...initialForm, ticketNo: defaultTicketNo ?? "" }); setIsFormOpen(true); }}
        createLabel="Tạo đề xuất"
        canEdit={canEdit}
        filters={
          <FilterChipBar
            options={(["All", ...Object.keys(REPAIR_STATUS_LABELS)] as const).map((s) => ({
              value: s,
              label: s === "All" ? "Tất cả" : REPAIR_STATUS_LABELS[s as keyof typeof REPAIR_STATUS_LABELS],
            }))}
            value={listQuery.status === "All" ? "All" : listQuery.status}
            onChange={(value) => setFilter("status", value === "All" ? null : value)}
          />
        }
      >
        <DataTable
          columns={[
            { key: "ticketNo", header: "Số phiếu", sortable: true, sortKey: "ticketNo" },
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode, sortable: true, sortKey: "equipmentCode" },
            { key: "priorityLabel", header: "Ưu tiên", sortable: true, sortKey: "priority" },
            { key: "statusLabel", header: "Trạng thái", sortable: true, sortKey: "status" },
            { key: "reportedBy", header: "Người báo", sortable: true, sortKey: "reportedBy" },
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
          rowActions={(row) => (
            <div className="flex gap-1">
              {canEdit && row.status !== "Completed" ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleConvert(row); }} className="rounded-lg border border-cyan-200 px-2 py-1 text-xs text-cyan-700" title="Chuyển sang nhật ký">
                  <ArrowRightLeft className="inline h-3 w-3" />
                </button>
              ) : null}
              {canApprove && row.status === "InProgress" ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(row); }} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700">
                  <Check className="inline h-3 w-3" /> Duyệt
                </button>
              ) : null}
              {canManage ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"><Trash2 className="inline h-3 w-3" /></button>
              ) : null}
            </div>
          )}
        />
      </EquipmentModuleShell>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.ticketNo ?? ""} subtitle={selected?.equipmentCode} tabs={["Chi tiết"]} activeTab="Chi tiết" onTabChange={() => undefined}
        actions={selected && canEdit ? (
          <button type="button" onClick={() => { setIsEditing(true); setEditingId(selected.id); setForm({ equipmentId: selected.equipmentId, ticketNo: selected.ticketNo, priority: selected.priority, description: selected.description, reportedBy: selected.reportedBy, notes: selected.notes }); setIsFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
        ) : undefined}
        tabContent={selected ? <div className="space-y-2"><p className="whitespace-pre-wrap">{selected.description}</p><p className="text-sm text-slate-500">{selected.notes || "-"}</p></div> : null}
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{isEditing ? "Sửa đề xuất sửa chữa" : "Tạo đề xuất sửa chữa"}</h2><button onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3">
          <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))} options={equipmentOptions} disabled={isEditing} />
          <input placeholder="Số phiếu" value={form.ticketNo} onChange={(e) => setForm((p) => ({ ...p, ticketNo: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm">
            {Object.entries(REPAIR_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <textarea placeholder="Mô tả sự cố" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Người báo cáo" value={form.reportedBy} onChange={(e) => setForm((p) => ({ ...p, reportedBy: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <textarea placeholder="Ghi chú" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button disabled={pending} onClick={submit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa đề xuất sửa chữa" message="Bạn có chắc muốn xóa đề xuất này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
