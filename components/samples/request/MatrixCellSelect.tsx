"use client";

import { matrixOptionLabel } from "@/lib/catalog/matrix-label";
import type { SampleMatrixView } from "@/types/catalog";

const selectClass =
  "w-full min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none";

type Props = {
  matrices: SampleMatrixView[];
  value: string | null;
  onChange: (matrixId: string | null) => void;
  disabled?: boolean;
};

export function MatrixCellSelect({ matrices, value, onChange, disabled }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className={selectClass}
      title={matrices.find((m) => m.id === value)?.name ?? "Chọn nền mẫu"}
    >
      <option value="">— Nền mẫu —</option>
      {matrices.map((m) => (
        <option key={m.id} value={m.id}>
          {matrixOptionLabel(m)}
        </option>
      ))}
    </select>
  );
}

export function matrixLabel(matrices: SampleMatrixView[], matrixId: string | null): string {
  if (!matrixId) return "—";
  const m = matrices.find((x) => x.id === matrixId);
  if (!m) return "—";
  if (m.groupName && m.name.startsWith(m.groupName)) return m.name;
  return m.groupName ? `${m.groupName} · ${m.name}` : m.name;
}

export function matrixGroup(matrices: SampleMatrixView[], matrixId: string | null): string {
  if (!matrixId) return "—";
  return matrices.find((x) => x.id === matrixId)?.groupName || "—";
}

export { matrixOptionLabel };
