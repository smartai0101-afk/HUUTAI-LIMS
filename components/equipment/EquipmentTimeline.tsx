"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { HISTORY } from "@/lib/equipment-labels";
import { EquipmentAttachmentList } from "@/components/equipment/EquipmentAttachmentList";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { HistoryEventImageGallery } from "@/components/equipment/HistoryEventImageGallery";
import type { EquipmentHistoryEventView } from "@/types";

type Props = {
  events: EquipmentHistoryEventView[];
  selectedId: string | null;
  onSelect: (event: EquipmentHistoryEventView) => void;
  canEdit?: boolean;
  canManage?: boolean;
  pending?: boolean;
  onUploadImages?: (eventId: string, files: File[]) => void;
  onDeleteImage?: (attachmentId: string) => void;
};

export function EquipmentTimeline({
  events,
  selectedId,
  onSelect,
  canEdit,
  canManage,
  pending,
  onUploadImages,
  onDeleteImage,
}: Props) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingFileNames, setPendingFileNames] = useState<string[]>([]);

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Chưa có sự kiện lý lịch
      </div>
    );
  }

  const handleSelect = (event: EquipmentHistoryEventView) => {
    setPendingFiles([]);
    setPendingFileNames([]);
    onSelect(event);
  };

  const handleUpload = (eventId: string) => {
    if (pendingFiles.length === 0 || !onUploadImages) return;
    onUploadImages(eventId, pendingFiles);
    setPendingFiles([]);
    setPendingFileNames([]);
  };

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
      {events.map((event) => {
        const isSelected = selectedId === event.id;
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 pl-10">
            <span
              className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ring-2 ${
                isSelected ? "bg-cyan-600 ring-cyan-300" : "bg-cyan-600 ring-cyan-100"
              }`}
            />
            <div className="flex-1">
              <button
                type="button"
                onClick={() => handleSelect(event)}
                className={`w-full rounded-xl border p-4 text-left shadow-sm transition-colors ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                      {event.eventTypeLabel}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">{event.title}</h3>
                  </div>
                  <span className="text-sm text-slate-500">
                    {event.eventDate ? formatDate(event.eventDate) : "-"}
                  </span>
                </div>
                {event.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{event.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {event.isAutoSynced ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Đồng bộ tự động</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Nhập thủ công</span>
                  )}
                  {event.createdBy ? <span>Người tạo: {event.createdBy}</span> : null}
                  {event.images.length > 0 ? (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-cyan-700">
                      {event.images.length} ảnh
                    </span>
                  ) : null}
                </div>
              </button>

              {isSelected ? (
                <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">{HISTORY.images}</p>
                  <HistoryEventImageGallery
                    images={event.images}
                    canManage={canManage}
                    onDelete={onDeleteImage}
                  />

                  {event.otherFiles.length > 0 ? (
                    <div>
                      <p className="mb-1 text-xs text-slate-500">{HISTORY.otherFiles}</p>
                      <EquipmentAttachmentList
                        attachments={event.otherFiles.map((f) => ({ path: f.path, name: f.name }))}
                      />
                    </div>
                  ) : null}

                  {canEdit && onUploadImages ? (
                    <div className="border-t border-slate-100 pt-4">
                      <EquipmentFileUpload
                        label={HISTORY.addImages}
                        accept=".jpg,.jpeg,.png"
                        multiple
                        selectedFileNames={pendingFileNames}
                        onMultipleChange={(files) => {
                          setPendingFiles(files);
                          setPendingFileNames(files.map((f) => f.name));
                        }}
                      />
                      {pendingFiles.length > 0 ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleUpload(event.id)}
                          className="mt-2 rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                          {pending ? "Đang tải..." : HISTORY.uploadImages}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
