"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit, Trash2, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
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
  approvePostCalibrationEvaluation,
  createPostCalibrationEvaluation,
  deletePostCalibrationEvaluation,
  updatePostCalibrationEvaluation,
} from "@/lib/actions/equipment-calibration";
import { EVALUATION_STATUS_LABELS } from "@/lib/equipment-fields";
import { EQUIPMENT_COLUMN, EQUIPMENT_NAV, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { CalibrationRecordView, PostCalibrationEvaluationView } from "@/types";

const exportColumns = [
  { key: "equipmentCode", header: "Mã thiết bị" },
  { key: "calibrationDate", header: EQUIPMENT_COLUMN.calibrationDate },
  { key: "certificateNo", header: "Số chứng nhận" },
  { key: "statusLabel", header: "Trạng thái" },
  { key: "approvedBy", header: "Người duyệt" },
];

const initialForm = {
  equipmentId: "",
  calibrationRecordId: "",
  impactAssessment: "",
  correctiveAction: "",
  notes: "",
};

export function CalibrationEvaluationsClient({
  items,
  equipmentOptions,
  calibrationRecords,
}: {
  items: PostCalibrationEvaluationView[];
  equipmentOptions: EquipmentOption[];
  calibrationRecords: CalibrationRecordView[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | keyof typeof EVALUATION_STATUS_LABELS>("All");
  const [selected, setSelected] = useState<PostCalibrationEvaluationView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostCalibrationEvaluationView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, canApprove, role } = useRole();
  const { addToast } = useToast();

  const recordOptions = useMemo(
    () => calibrationRecords.filter((r) => !form.equipmentId || r.equipmentId === form.equipmentId),
    [calibrationRecords, form.equipmentId],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchQuery =
        !q ||
        item.equipmentCode.toLowerCase().includes(q) ||
        item.equipmentName.toLowerCase().includes(q) ||
        item.certificateNo.toLowerCase().includes(q);
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

  const openEdit = (item: PostCalibrationEvaluationView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      equipmentId: item.equipmentId,
      calibrationRecordId: item.calibrationRecordId,
      impactAssessment: item.impactAssessment,
      correctiveAction: item.correctiveAction,
      notes: item.notes,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.equipmentId || !form.calibrationRecordId) {
      addToast("Thiết bị và hồ sơ hiệu chuẩn là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updatePostCalibrationEvaluation(fd) : await createPostCalibrationEvaluation(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật đánh giá" : "Đã thêm đánh giá", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleApprove = (item: PostCalibrationEvaluationView, approved: boolean) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", item.id);
    fd.set("approved", approved ? "true" : "false");
    startTransition(async () => {
      const result = await approvePostCalibrationEvaluation(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(approved ? "Đã phê duyệt đánh giá" : "Đã từ chối đánh giá", "success");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deletePostCalibrationEvaluation(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa đánh giá", "success");
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    exportToXlsx("danh-gia-sau-hc", filtered.map((r) => ({ ...r })), exportColumns);
    addToast("Đã export Excel", "success");
  };

  return (
    <EquipmentAppShell>
      <EquipmentModuleShell
        title="Đánh giá sau hiệu chuẩn"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Tìm theo mã TB, số chứng nhận..."
        onExport={handleExport}
        onCreate={openCreate}
        createLabel="Thêm đánh giá"
        canEdit={canEdit}
        filters={
          <FilterChipBar
            options={(["All", ...Object.keys(EVALUATION_STATUS_LABELS)] as const).map((s) => ({
              value: s,
              label: s === "All" ? "Tất cả" : EVALUATION_STATUS_LABELS[s as keyof typeof EVALUATION_STATUS_LABELS],
            }))}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
          />
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
            { key: "calibrationDate", header: EQUIPMENT_COLUMN.calibrationDate, render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "certificateNo", header: "Số chứng nhận" },
            { key: "statusLabel", header: "Trạng thái" },
            { key: "approvedBy", header: "Người duyệt" },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
          rowActionsHeader="Hành động"
          rowActions={(row) => (
            <div className="flex gap-1">
              {canApprove && row.status === "Draft" ? (
                <>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(row, true); }} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700">
                    <Check className="inline h-3 w-3" /> Duyệt
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleApprove(row, false); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700">
                    Từ chối
                  </button>
                </>
              ) : null}
              {canManage ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700">
                  <Trash2 className="inline h-3 w-3" />
                </button>
              ) : null}
            </div>
          )}
        />
      </EquipmentModuleShell>

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Đánh giá sau hiệu chuẩn"
        subtitle={selected ? `${selected.equipmentCode} — ${selected.certificateNo}` : undefined}
        tabs={["Chi tiết"]}
        activeTab="Chi tiết"
        onTabChange={() => undefined}
        actions={
          selected ? (
            <>
              {canEdit && selected.status === "Draft" ? (
                <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                  <Edit className="h-4 w-4" />Sửa
                </button>
              ) : null}
              {canApprove && selected.status === "Draft" ? (
                <button type="button" onClick={() => handleApprove(selected, true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white">
                  <Check className="h-4 w-4" />Phê duyệt
                </button>
              ) : null}
            </>
          ) : undefined
        }
        tabContent={
          selected ? (
            <div className="space-y-3">
              <div><p className="text-xs text-slate-500">Đánh giá tác động</p><p className="whitespace-pre-wrap font-medium">{selected.impactAssessment || "-"}</p></div>
              <div><p className="text-xs text-slate-500">Hành động khắc phục</p><p className="whitespace-pre-wrap font-medium">{selected.correctiveAction || "-"}</p></div>
              <div><p className="text-xs text-slate-500">Ghi chú</p><p className="whitespace-pre-wrap font-medium">{selected.notes || "-"}</p></div>
            </div>
          ) : null
        }
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? "Sửa đánh giá" : "Thêm đánh giá"}</h2>
          <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Thiết bị</label>
            <EquipmentSelect value={form.equipmentId} onChange={(v) => setForm((p) => ({ ...p, equipmentId: v, calibrationRecordId: "" }))} options={equipmentOptions} disabled={isEditing} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_NAV.calibrationRecords}</label>
            <select value={form.calibrationRecordId} onChange={(e) => setForm((p) => ({ ...p, calibrationRecordId: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" disabled={isEditing}>
              <option value="">Chọn hồ sơ hiệu chuẩn</option>
              {recordOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.calibrationDate} — {r.certificateNo || r.resultLabel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Đánh giá tác động</label>
            <textarea value={form.impactAssessment} onChange={(e) => setForm((p) => ({ ...p, impactAssessment: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Hành động khắc phục</label>
            <textarea value={form.correctiveAction} onChange={(e) => setForm((p) => ({ ...p, correctiveAction: e.target.value }))} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa đánh giá" message="Bạn có chắc muốn xóa đánh giá này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </EquipmentAppShell>
  );
}
