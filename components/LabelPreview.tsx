import { QrCode } from "lucide-react";

interface LabelPreviewProps {
  title: string;
  code: string;
  secondary: string;
  expiry: string;
  location: string;
}

export function LabelPreview({
  title,
  code,
  secondary,
  expiry,
  location,
}: LabelPreviewProps) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Label preview</p>
          <h4 className="mt-1 font-semibold text-slate-900">{title}</h4>
        </div>
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-slate-100 text-[10px] font-medium text-slate-600">
          <QrCode className="h-5 w-5" />
          <span className="mt-0.5">QR: {code}</span>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <p>Code: {code}</p>
        <p>{secondary}</p>
        <p>Expiry: {expiry}</p>
        <p>Location: {location}</p>
      </div>
    </div>
  );
}
