"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { disposeSampleAction, storeSampleAction } from "@/lib/actions/samples";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import type { SampleListItem } from "@/types/samples";

type Props = {
  samples: SampleListItem[];
  defaultStoredBy: string;
  defaultDisposedBy: string;
};

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function SampleStorageClient({ samples, defaultStoredBy, defaultDisposedBy }: Props) {
  const [selectedId, setSelectedId] = useState(samples[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = samples.find((s) => s.id === selectedId);

  function handleStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    fd.set("sampleId", selectedId);
    startTransition(async () => {
      const result = await storeSampleAction(fd);
      if (result.error) setError(result.error);
      else setMessage("Đã lưu mẫu thành công");
    });
  }

  function handleDispose(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    fd.set("sampleId", selectedId);
    startTransition(async () => {
      const result = await disposeSampleAction(fd);
      if (result.error) setError(result.error);
      else setMessage("Đã hủy mẫu thành công");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Lưu mẫu / Hủy mẫu</h1>
        <p className="text-sm text-slate-500">Quản lý bảo quản và thanh lý mẫu sau phân tích</p>
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <label className="block max-w-xl text-sm font-medium">
        Chọn mẫu
        <select className={inputClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {samples.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sampleCode} — {s.sampleName}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium">{selected.sampleCode}</p>
            <SampleStatusBadge status={selected.status} />
            <Link href={`/samples/${selected.id}`} className="text-sm text-cyan-700 hover:underline">
              Xem chi tiết
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleStore} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Lưu mẫu</h2>
          <label className="block text-sm">
            Vị trí lưu mẫu *
            <input name="storageLocation" required className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Điều kiện lưu mẫu
            <input name="preservationCondition" className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Ngày hết hạn lưu mẫu
            <input name="retentionUntil" type="date" className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Người thực hiện lưu mẫu *
            <input name="storedBy" required className={inputClass} defaultValue={defaultStoredBy} />
          </label>
          <button
            type="submit"
            disabled={pending || !selectedId}
            className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Xác nhận lưu mẫu
          </button>
        </form>

        <form onSubmit={handleDispose} className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-red-800">Hủy mẫu</h2>
          <label className="block text-sm">
            Lý do hủy mẫu *
            <textarea name="disposeReason" required rows={3} className={inputClass} />
          </label>
          <label className="mt-3 block text-sm">
            Người xác nhận hủy mẫu *
            <input name="disposedBy" required className={inputClass} defaultValue={defaultDisposedBy} />
          </label>
          <button
            type="submit"
            disabled={pending || !selectedId}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Xác nhận hủy mẫu
          </button>
        </form>
      </div>
    </div>
  );
}
