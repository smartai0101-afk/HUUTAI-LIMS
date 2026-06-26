"use client";

import { useState } from "react";
import { ModalShell } from "@/components/ModalShell";

type Props = {
  open: boolean;
  title?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  pending?: boolean;
};

export function AmendmentReasonDialog({
  open,
  title = "Lý do sửa đổi",
  onConfirm,
  onCancel,
  pending = false,
}: Props) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <ModalShell open={open} onClose={onCancel} className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Bản ghi đã duyệt — bắt buộc nhập lý do sửa đổi theo ISO 17025.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="Mô tả lý do sửa đổi..."
        className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 text-sm">
          Hủy
        </button>
        <button
          type="button"
          disabled={pending || !reason.trim()}
          onClick={handleConfirm}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Xác nhận"}
        </button>
      </div>
    </ModalShell>
  );
}
