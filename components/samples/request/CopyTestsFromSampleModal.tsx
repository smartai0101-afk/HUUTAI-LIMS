"use client";

import { useState } from "react";
import type { RequestSampleLineView } from "@/types/catalog";

type Props = {
  open: boolean;
  onClose: () => void;
  lines: RequestSampleLineView[];
  onCopy: (sourceLineId: string, targetLineIds: string[]) => void;
  currentLineId?: string;
};

export function CopyTestsFromSampleModal({ open, onClose, lines, onCopy, currentLineId }: Props) {
  if (!open) return null;

  const sources = lines.filter((l) => l.tests.length > 0);
  const targets = lines.filter((l) => l.id !== currentLineId && l.status === "draft");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Copy chỉ tiêu từ mẫu khác</h3>
        <CopyForm
          sources={sources}
          targets={targets}
          onCopy={(sourceId, targetIds) => {
            onCopy(sourceId, targetIds);
            onClose();
          }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function CopyForm({
  sources,
  targets,
  onCopy,
  onClose,
}: {
  sources: RequestSampleLineView[];
  targets: RequestSampleLineView[];
  onCopy: (sourceId: string, targetIds: string[]) => void;
  onClose: () => void;
}) {
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");
  const [targetIds, setTargetIds] = useState<string[]>([]);

  return (
    <div className="mt-4 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Mẫu nguồn</span>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          {sources.map((l) => (
            <option key={l.id} value={l.id}>
              {l.sampleName} ({l.tests.length} chỉ tiêu)
            </option>
          ))}
        </select>
      </label>
      <div className="text-sm">
        <p className="mb-2 font-medium">Mẫu đích</p>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
          {targets.map((l) => (
            <label key={l.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={targetIds.includes(l.id)}
                onChange={(e) =>
                  setTargetIds(
                    e.target.checked ? [...targetIds, l.id] : targetIds.filter((id) => id !== l.id),
                  )
                }
              />
              {l.sampleName}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">
          Hủy
        </button>
        <button
          type="button"
          disabled={!sourceId || targetIds.length === 0}
          onClick={() => onCopy(sourceId, targetIds)}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
