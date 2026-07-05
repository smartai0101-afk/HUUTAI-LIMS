"use client";

import type { SampleMatrixGroupView } from "@/types/catalog";
import type { SampleRequestDetailView } from "@/types/samples";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-cyan-500 focus:outline-none";

type Props = {
  initial?: SampleRequestDetailView | null;
  lineCount: number;
  matrixGroups: SampleMatrixGroupView[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  readOnly?: boolean;
};

export function RequestHeaderSection({
  initial,
  lineCount,
  matrixGroups,
  selectedGroupId,
  onGroupChange,
  readOnly,
}: Props) {
  const selectedGroup = matrixGroups.find((g) => g.id === selectedGroupId);

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Thông tin phiếu · {lineCount} mẫu
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Ngày yêu cầu *</span>
          <input
            name="requestDate"
            type="date"
            required
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.requestDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Người yêu cầu *</span>
          <input
            name="requesterName"
            required
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.requesterName ?? ""}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Khách hàng</span>
          <input
            name="customerName"
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.customerName ?? ""}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Phòng ban</span>
          <input
            name="department"
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.department ?? ""}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Độ ưu tiên</span>
          <select
            name="priority"
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.priority ?? "normal"}
          >
            <option value="normal">Bình thường</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Deadline trả KQ</span>
          <input
            name="dueDate"
            type="date"
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.dueDate?.slice(0, 10) ?? ""}
          />
        </label>
        <label className="block text-sm md:col-span-2 xl:col-span-2">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Mục đích thử nghiệm</span>
          <input
            name="purpose"
            disabled={readOnly}
            className={inputClass}
            defaultValue={initial?.purpose ?? ""}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Loại mẫu mặc định *</span>
          <select
            required
            disabled={readOnly}
            className={inputClass}
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            <option value="" disabled>
              — Chọn nhóm nền mẫu —
            </option>
            {matrixGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="sampleType" value={selectedGroup?.name ?? initial?.sampleType ?? ""} />
        </label>
        <label className="block text-sm md:col-span-2 xl:col-span-2">
          <span className="mb-0.5 block text-xs font-medium text-slate-600">Ghi chú</span>
          <input name="note" disabled={readOnly} className={inputClass} defaultValue={initial?.note ?? ""} />
        </label>
        <input type="hidden" name="sampleCount" value={lineCount} />
      </div>
    </div>
  );
}
