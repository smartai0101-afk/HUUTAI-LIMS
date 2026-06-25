"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit, Trash2, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  approveDisposal,
  createDisposal,
  deleteDisposal,
  updateDisposal,
} from "@/lib/actions/equipment-disposal";
import { DISPOSAL_STATUS_LABELS } from "@/lib/equipment-fields";
import { EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { EquipmentDisposalView } from "@/types";

const exportColumns = [
  { key: "equipmentCode", header: "Mã thiết bị" },
  { key: "disposalDate", header: "Ngày thanh lý" },
  { key: "residualValue", header: "Giá trị còn lại" },
  { key: "statusLabel", header: "Trạng thái" },
  { key: "approver", header: "Người duyệt" },
];

const initialForm = { equipmentId: "", disposalDate: "", residualValue: "0", decision: "", notes: "" };

export function DisposalClient({
  items,
  equipmentOptions,
}: {
  items: EquipmentDisposalView[];
  equipmentOptions: EquipmentOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | keyof typeof DISPOSAL_STATUS_LABELS>("All");
  const [selected, setSelected] = useState<EquipmentDisposalView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentDisposalView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, canApprove, role } = useRole();
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchQuery = !q || item.equipmentCode.toLowerCase().includes(q) || item.equipmentName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [items, query, statusFilter]);

  const submit = () => {
    if (!form.equipmentId || !form.disposalDate) {
      addToast("Thiết bị và ngày thanh lý là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (docFile) fd.set("document", docFile);
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateDisposal(fd) : await createDisposal(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast(isEditing ? "Đã cập nhật" : "Đã tạo hồ sơ thanh lý", "success");
      setIsFormOpen(false);
      setDocFile(null);
      router.refresh();
    });
  };

  const handleApprove = (item: EquipmentDisposalView, approved: boolean) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", item.id);
    fd.set("status", approved ? "Approved" : "Rejected");
    startTransition(async () => {
      const result = await approveDisposal(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast(approved ? "Đã phê duyệt thanh lý" : "Đã từ chối thanh lý", "success");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteDisposal(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã xóa hồ sơ thanh lý", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <EquipmentAppShell>
      <EquipmentModuleShell
        title="Thanh lý thiết bị"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        onExport={() => { exportToXlsx("thanh-ly-thiet-bi", filtered.map((r) => ({ ...r })), exportColumns); addToast("Đã export Excel", "success"); }}
        onCreate={() => { setIsEditing(false); setEditingId(null); setForm(initialForm); setDocFile(null); setIsFormOpen(true); }}
        createLabel="Tạo hồ sơ thanh lý"
        canEdit={canEdit}
        filters={
          <div className="flex flex-wrap gap-2">
            {(["All", ...Object.keys(DISPOSAL_STATUS_LABELS)] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s as typeof statusFilter)} className={`rounded-xl px-3 py-2 text-sm ${statusFilter === s ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                {s === "All" ? "Tất cả" : DISPOSAL_STATUS_LABELS[s as keyof typeof DISPOSAL_STATUS_LABELS]}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
            { key: "equipmentName", header: "Tên thiết bị" },
            { key: "disposalDate", header: "Ngày TL", render: (v) => formatDate(String(v)) },
            { key: "residualValue", header: "Giá trị CL", render: (v) => Number(v).toLocaleString("vi-VN") },
            { key: "statusLabel", header: "Trạng thái" },
            { key: "approver", header: "Người duyệt" },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
          rowActions={(row) => (
            <div className="flex gap-1">
              {canApprove && row.status === "Pending" ? (
                <>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(row, true); }} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700"><Check className="inline h-3 w-3" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(row, false); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700">✕</button>
                </>
              ) : null}
              {canManage ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"><Trash2 className="inline h-3 w-3" /></button>
              ) : null}
            </div>
          )}
        />
      </EquipmentModuleShell>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title="Thanh lý thiết bị" subtitle={selected?.equipmentCode} tabs={["Chi tiết"]} activeTab="Chi tiết" onTabChange={() => undefined}
        actions={selected ? (
          <>
            {canEdit && selected.status === "Pending" ? (
              <button type="button" onClick={() => { setIsEditing(true); setEditingId(selected.id); setForm({ equipmentId: selected.equipmentId, disposalDate: selected.disposalDate, residualValue: String(selected.residualValue), decision: selected.decision, notes: selected.notes }); setIsFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
            ) : null}
            {canApprove && selected.status === "Pending" ? (
              <button type="button" onClick={() => handleApprove(selected, true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white"><Check className="h-4 w-4" />Phê duyệt</button>
            ) : null}
          </>
        ) : undefined}
        tabContent={selected ? (
          <div className="space-y-3">
            <div><p className="text-xs text-slate-500">Quyết định</p><p>{selected.decision || "-"}</p></div>
            <div><p className="text-xs text-slate-500">Tài liệu</p>{selected.documentPath ? <a href={selected.documentPath} target="_blank" rel="noreferrer" className="text-cyan-700 underline">Tải xuống</a> : <p>-</p>}</div>
            <div><p className="text-xs text-slate-500">Ghi chú</p><p className="whitespace-pre-wrap">{selected.notes || "-"}</p></div>
          </div>
        ) : null}
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{isEditing ? "Sửa hồ sơ thanh lý" : "Tạo hồ sơ thanh lý"}</h2><button onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3">
          <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))} options={equipmentOptions} disabled={isEditing} />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.disposalDate} onChange={(e) => setForm((p) => ({ ...p, disposalDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            <input type="number" placeholder="Giá trị còn lại" value={form.residualValue} onChange={(e) => setForm((p) => ({ ...p, residualValue: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <input placeholder="Quyết định thanh lý" value={form.decision} onChange={(e) => setForm((p) => ({ ...p, decision: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <EquipmentFileUpload label="Tài liệu thanh lý" onChange={setDocFile} currentPath={isEditing ? selected?.documentPath : undefined} />
          <textarea placeholder="Ghi chú" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button disabled={pending} onClick={submit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa hồ sơ thanh lý" message="Bạn có chắc muốn xóa hồ sơ thanh lý này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </EquipmentAppShell>
  );
}
