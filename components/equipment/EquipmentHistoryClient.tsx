"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { EquipmentTimeline } from "@/components/equipment/EquipmentTimeline";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  addHistoryEventImages,
  createHistoryEvent,
  deleteHistoryEvent,
  deleteHistoryEventImage,
  updateHistoryEvent,
} from "@/lib/actions/equipment-history";
import { EQUIPMENT_SUBTITLE, HISTORY } from "@/lib/equipment-labels";
import type { EquipmentHistoryEventView } from "@/types";

const eventTypes = [
  { value: "Manual", label: "Thủ công" },
  { value: "Installation", label: "Lắp đặt" },
  { value: "Calibration", label: "Hiệu chuẩn" },
  { value: "Maintenance", label: "Bảo trì" },
  { value: "Repair", label: "Sửa chữa" },
  { value: "SparePartReplacement", label: "Thay thế linh kiện" },
  { value: "Disposal", label: "Thanh lý" },
];

const initialForm = {
  eventType: "Manual",
  eventDate: "",
  title: "",
  description: "",
};

export function EquipmentHistoryClient({
  events,
  equipmentOptions,
  initialEquipmentId,
}: {
  events: EquipmentHistoryEventView[];
  equipmentOptions: EquipmentOption[];
  initialEquipmentId?: string;
}) {
  const router = useRouter();
  const [equipmentId, setEquipmentId] = useState(initialEquipmentId ?? equipmentOptions[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [formFileNames, setFormFileNames] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentHistoryEventView | null>(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { canEdit, canManage, role } = useRole();
  const { addToast } = useToast();

  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => e.equipmentId === equipmentId)
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [events, equipmentId],
  );

  useEffect(() => {
    setSelectedId(null);
  }, [equipmentId]);

  const selectedEquipment = equipmentOptions.find((o) => o.id === equipmentId);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setFormFiles([]);
    setFormFileNames([]);
    setIsFormOpen(true);
  };

  const openEdit = (event: EquipmentHistoryEventView) => {
    if (event.isAutoSynced) {
      addToast("Không thể sửa sự kiện đồng bộ tự động", "error");
      return;
    }
    setIsEditing(true);
    setEditingId(event.id);
    setForm({
      eventType: event.eventType,
      eventDate: event.eventDate,
      title: event.title,
      description: event.description,
    });
    setFormFiles([]);
    setFormFileNames([]);
    setIsFormOpen(true);
  };

  const appendFilesToFormData = (fd: FormData, files: File[]) => {
    for (const file of files) fd.append("attachments", file);
  };

  const handleSubmit = () => {
    if (!equipmentId || !form.eventDate || !form.title.trim()) {
      addToast("Ngày và tiêu đề là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("equipmentId", equipmentId);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    appendFilesToFormData(fd, formFiles);
    startTransition(async () => {
      const result = isEditing ? await updateHistoryEvent(fd) : await createHistoryEvent(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật sự kiện" : "Đã thêm sự kiện", "success");
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
      const result = await deleteHistoryEvent(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa sự kiện", "success");
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleUploadImages = (eventId: string, files: File[]) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("eventId", eventId);
    for (const file of files) fd.append("attachments", file);
    startTransition(async () => {
      const result = await addHistoryEventImages(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã thêm ảnh", "success");
      router.refresh();
    });
  };

  const handleDeleteImage = () => {
    if (!deleteImageTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("attachmentId", deleteImageTarget);
    startTransition(async () => {
      const result = await deleteHistoryEventImage(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa ảnh", "success");
      setDeleteImageTarget(null);
      router.refresh();
    });
  };

  const handleSelectEvent = (event: EquipmentHistoryEventView) => {
    setSelectedId((prev) => (prev === event.id ? null : event.id));
  };

  return (
    <EquipmentAppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">{EQUIPMENT_SUBTITLE}</p>
            <h1 className="text-2xl font-semibold text-slate-900">Lý lịch thiết bị</h1>
          </div>
          {canEdit ? (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Thêm sự kiện thủ công
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm text-slate-600">Chọn thiết bị</label>
          <EquipmentSelect
            value={equipmentId}
            onChange={setEquipmentId}
            options={equipmentOptions}
            className="max-w-md"
          />
          {selectedEquipment ? (
            <p className="mt-2 text-sm text-slate-500">
              {selectedEquipment.code} — {selectedEquipment.name}
            </p>
          ) : null}
        </div>

        <EquipmentTimeline
          events={filteredEvents}
          selectedId={selectedId}
          onSelect={handleSelectEvent}
          canEdit={canEdit}
          canManage={canManage}
          pending={pending}
          onUploadImages={canEdit ? handleUploadImages : undefined}
          onDeleteImage={canManage ? (id) => setDeleteImageTarget(id) : undefined}
        />

        {canManage ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Sự kiện thủ công</p>
            <div className="space-y-2">
              {filteredEvents.filter((e) => !e.isAutoSynced).map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{event.title}</span>
                  <div className="flex gap-2">
                    {canEdit ? (
                      <button type="button" onClick={() => openEdit(event)} className="text-cyan-700">
                        <Edit className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setDeleteTarget(event)} className="text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? "Sửa sự kiện" : "Thêm sự kiện thủ công"}</h2>
          <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Loại sự kiện</label>
            <select value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm">
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Ngày</label>
            <input type="date" value={form.eventDate} onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Tiêu đề</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <EquipmentFileUpload
            label={HISTORY.addImages}
            accept=".jpg,.jpeg,.png"
            multiple
            selectedFileNames={formFileNames}
            onMultipleChange={(files) => {
              setFormFiles(files);
              setFormFileNames(files.map((f) => f.name));
            }}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button>
          <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </ModalShell>

      <ConfirmDialog open={!!deleteTarget} title="Xóa sự kiện" message="Bạn có chắc muốn xóa sự kiện lý lịch này?" cancelLabel="Hủy" confirmLabel="Xóa" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />

      <ConfirmDialog
        open={!!deleteImageTarget}
        title={HISTORY.deleteImage}
        message="Bạn có chắc muốn xóa ảnh này khỏi lý lịch?"
        cancelLabel="Hủy"
        confirmLabel="Xóa"
        onCancel={() => setDeleteImageTarget(null)}
        onConfirm={handleDeleteImage}
      />
    </EquipmentAppShell>
  );
}
