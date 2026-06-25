"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentAttachmentList } from "@/components/equipment/EquipmentAttachmentList";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  completeMaintenanceLog,
  createMaintenanceLog,
  deleteMaintenanceLog,
  updateMaintenanceLog,
} from "@/lib/actions/equipment-maintenance";
import { EQUIPMENT_COLUMN, EQUIPMENT_NAV, EQUIPMENT_SUBTITLE, MAINTENANCE_LOG } from "@/lib/equipment-labels";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { MaintenanceLogView } from "@/types";

type MaintenanceLogTableRow = MaintenanceLogView & { statusLabel: string };

const exportColumns = [
  { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
  { key: "issueDate", header: MAINTENANCE_LOG.issueDate },
  { key: "description", header: "Mô tả" },
  { key: "statusLabel", header: MAINTENANCE_LOG.status },
  { key: "completedDate", header: MAINTENANCE_LOG.completedDate },
];

const initialForm = {
  equipmentId: "",
  issueDate: "",
  description: "",
  rootCause: "",
  action: "",
  vendor: "",
  completedDate: "",
  notes: "",
};

function toTableRow(item: MaintenanceLogView): MaintenanceLogTableRow {
  return {
    ...item,
    statusLabel: item.completedDate ? MAINTENANCE_LOG.statusDone : MAINTENANCE_LOG.statusOpen,
  };
}

export function MaintenanceLogsClient({
  items,
  equipmentOptions,
}: {
  items: MaintenanceLogView[];
  equipmentOptions: EquipmentOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [completedFilter, setCompletedFilter] = useState<"All" | "Open" | "Done">("All");
  const [selected, setSelected] = useState<MaintenanceLogView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLogView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const editingItem = useMemo(
    () => (editingId ? items.find((item) => item.id === editingId) ?? null : null),
    [items, editingId],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchQuery = !q || item.equipmentCode.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      const isDone = !!item.completedDate;
      const matchCompleted =
        completedFilter === "All" ||
        (completedFilter === "Done" && isDone) ||
        (completedFilter === "Open" && !isDone);
      return matchQuery && matchCompleted;
    });
  }, [items, query, completedFilter]);

  const tableRows = useMemo(() => filtered.map(toTableRow), [filtered]);

  const openEditForm = (item: MaintenanceLogView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      equipmentId: item.equipmentId,
      issueDate: item.issueDate,
      description: item.description,
      rootCause: item.rootCause,
      action: item.action,
      vendor: item.vendor,
      completedDate: item.completedDate,
      notes: item.notes,
    });
    setAttachFiles([]);
    setIsFormOpen(true);
  };

  const submit = () => {
    if (!form.equipmentId || !form.issueDate) {
      addToast("Thiết bị và ngày phát hiện là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    attachFiles.forEach((f) => fd.append("attachments", f));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateMaintenanceLog(fd) : await createMaintenanceLog(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast(isEditing ? "Đã cập nhật" : "Đã thêm nhật ký bảo trì/sửa chữa", "success");
      setIsFormOpen(false);
      setAttachFiles([]);
      router.refresh();
    });
  };

  const handleComplete = (item: MaintenanceLogView, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", item.id);
    fd.set("completedDate", new Date().toISOString().slice(0, 10));
    startTransition(async () => {
      const result = await completeMaintenanceLog(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã hoàn thành nhật ký bảo trì/sửa chữa", "success");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteMaintenanceLog(fd);
      if (result.error) { addToast(result.error, "error"); return; }
      addToast("Đã xóa nhật ký", "success");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <EquipmentAppShell>
      <EquipmentModuleShell
        title="Nhật ký bảo trì / sửa chữa"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        onExport={() => {
          exportToXlsx(
            "nhat-ky-bt-sc",
            tableRows.map((r) => ({
              ...r,
              issueDate: formatDate(r.issueDate),
              completedDate: r.completedDate ? formatDate(r.completedDate) : "-",
            })),
            exportColumns,
          );
          addToast("Đã export Excel", "success");
        }}
        onCreate={() => { setIsEditing(false); setEditingId(null); setForm(initialForm); setAttachFiles([]); setIsFormOpen(true); }}
        createLabel="Thêm nhật ký"
        canEdit={canEdit}
        filters={
          <div className="flex flex-wrap gap-2">
            {(["All", "Open", "Done"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setCompletedFilter(s)} className={`rounded-xl px-3 py-2 text-sm ${completedFilter === s ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                {s === "All" ? "Tất cả" : s === "Open" ? MAINTENANCE_LOG.statusOpen : MAINTENANCE_LOG.statusDone}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
            { key: "issueDate", header: MAINTENANCE_LOG.issueDate, render: (v) => formatDate(String(v)) },
            { key: "description", header: "Mô tả" },
            {
              key: "statusLabel",
              header: MAINTENANCE_LOG.status,
              render: (_, row) => (
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.completedDate
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {row.statusLabel}
                  </span>
                  {canEdit && !row.completedDate ? (
                    <button
                      type="button"
                      onClick={(e) => handleComplete(row, e)}
                      className="w-fit rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                    >
                      {MAINTENANCE_LOG.confirmComplete}
                    </button>
                  ) : null}
                </div>
              ),
            },
            {
              key: "completedDate",
              header: MAINTENANCE_LOG.completedDate,
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
          ]}
          rows={tableRows}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
        />
      </EquipmentModuleShell>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title={EQUIPMENT_NAV.maintenanceLogs} subtitle={selected?.equipmentCode} tabs={["Chi tiết"]} activeTab="Chi tiết" onTabChange={() => undefined}
        actions={selected ? (
          <div className="flex gap-2">
            {canEdit ? (
              <button type="button" onClick={() => openEditForm(selected)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
            ) : null}
            {canManage ? (
              <button type="button" onClick={() => setDeleteTarget(selected)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"><Trash2 className="h-4 w-4" />Xóa</button>
            ) : null}
          </div>
        ) : undefined}
        tabContent={selected ? (
          <div className="space-y-3">
            <div><p className="text-xs text-slate-500">Nguyên nhân</p><p>{selected.rootCause || "-"}</p></div>
            <div><p className="text-xs text-slate-500">Hành động</p><p>{selected.action || "-"}</p></div>
            <div><p className="text-xs text-slate-500">{MAINTENANCE_LOG.attachments}</p><EquipmentAttachmentList attachments={selected.attachmentPaths.map((p) => ({ path: p }))} /></div>
          </div>
        ) : null}
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{isEditing ? "Sửa nhật ký" : "Thêm nhật ký bảo trì/sửa chữa"}</h2><button onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 space-y-3">
          <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))} options={equipmentOptions} disabled={isEditing} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">{MAINTENANCE_LOG.issueDate}</label>
              <input type="date" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">{MAINTENANCE_LOG.completedDate}</label>
              <input type="date" value={form.completedDate} onChange={(e) => setForm((p) => ({ ...p, completedDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
            </div>
          </div>
          <textarea placeholder="Mô tả sự cố" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Nguyên nhân" value={form.rootCause} onChange={(e) => setForm((p) => ({ ...p, rootCause: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <input placeholder="Hành động khắc phục" value={form.action} onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          <div>
            <label className="mb-1 block text-sm text-slate-600">{MAINTENANCE_LOG.vendor}</label>
            <input value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          {isEditing && editingItem && editingItem.attachmentPaths.length > 0 ? (
            <div>
              <p className="mb-1 text-sm text-slate-600">{MAINTENANCE_LOG.existingAttachments}</p>
              <EquipmentAttachmentList attachments={editingItem.attachmentPaths.map((p) => ({ path: p }))} />
            </div>
          ) : null}
          <EquipmentFileUpload
            label={MAINTENANCE_LOG.attachments}
            multiple
            selectedFileNames={attachFiles.map((f) => f.name)}
            onMultipleChange={(files) => setAttachFiles((prev) => [...prev, ...files])}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button disabled={pending} onClick={submit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa nhật ký" message="Bạn có chắc muốn xóa nhật ký này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </EquipmentAppShell>
  );
}
