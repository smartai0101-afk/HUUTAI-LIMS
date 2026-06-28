"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export function ChemInfoErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-rose-200">
        <AlertCircle className="h-7 w-7 text-rose-500" />
      </div>
      <p className="max-w-md text-sm text-rose-800">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
