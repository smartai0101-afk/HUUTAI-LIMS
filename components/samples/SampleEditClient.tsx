"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSampleAction } from "@/lib/actions/samples";
import {
  CONDITION_REASON_SUGGESTIONS,
  SAMPLE_CONDITION_LABELS,
  SAMPLE_TYPE_OPTIONS,
} from "@/lib/sample-labels";
import type { SampleDetailView } from "@/types/samples";

type Props = {
  sample: SampleDetailView;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none";

export function SampleEditClient({ sample }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSampleAction(sample.id, fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push(`/samples/${sample.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sửa mẫu {sample.sampleCode}</h1>
        <p className="text-sm text-slate-500">Chỉ sửa được trước khi phát hành kết quả</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">Tên mẫu</span>
            <input name="sampleName" defaultValue={sample.sampleName} className={inputClass} required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Loại mẫu</span>
            <select name="sampleType" defaultValue={sample.sampleType} className={inputClass}>
              {SAMPLE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Người tiếp nhận</span>
            <input name="receivedBy" defaultValue={sample.receivedBy} className={inputClass} required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Điều kiện tiếp nhận</span>
            <select
              name="conditionOnReceipt"
              defaultValue={sample.conditionOnReceipt}
              className={inputClass}
            >
              {Object.entries(SAMPLE_CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Ghi chú điều kiện</span>
            <input
              name="conditionNote"
              defaultValue={sample.conditionNote}
              list="condition-reasons"
              className={inputClass}
            />
            <datalist id="condition-reasons">
              {CONDITION_REASON_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Số lượng</span>
            <input
              name="quantity"
              type="number"
              step="any"
              defaultValue={sample.quantity ?? ""}
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Đơn vị</span>
            <input name="unit" defaultValue={sample.unit} className={inputClass} required />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Ghi chú</span>
            <textarea name="note" defaultValue={sample.note} className={inputClass} rows={3} />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
