"use client";

import { AlertTriangle } from "lucide-react";
import { ModalShell } from "@/components/ModalShell";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
}: ConfirmDialogProps) {
  return (
    <ModalShell open={open} onClose={onCancel} zClass="z-[90]" className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white">
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
