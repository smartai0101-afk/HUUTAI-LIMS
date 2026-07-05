"use client";

import { useEffect, useRef } from "react";
import { ModalShell } from "@/components/ModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  sampleCode: string;
  sampleName: string;
  barcodePayload?: string;
  sampleId?: string;
};

export function SamplePrintLabelDialog({
  open,
  onClose,
  sampleCode,
  sampleName,
  barcodePayload,
  sampleId,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 280;
    canvas.height = 140;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(sampleCode, 16, 32);
    ctx.font="12px sans-serif";
    ctx.fillText(sampleName.slice(0, 28), 16, 56);

    const qrData =
      barcodePayload ||
      (typeof window !== "undefined" && sampleId
        ? `${window.location.origin}/samples/${sampleId}`
        : sampleCode);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, canvas.width - 96, 24, 80, 80);
    };
    img.src = qrUrl;
  }, [open, sampleCode, sampleName, barcodePayload, sampleId]);

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<img src="${dataUrl}" onload="window.print();window.close()" />`);
    win.document.close();
  }

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">In tem mẫu / QR</h3>
        <canvas ref={canvasRef} className="mx-auto rounded-xl border border-slate-200" />
        <p className="text-center text-sm text-slate-500">
          Tem hiển thị mã mẫu và mã QR để quét tra cứu.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
          >
            In tem
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
