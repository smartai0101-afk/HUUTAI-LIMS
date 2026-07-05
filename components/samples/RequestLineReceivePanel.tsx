"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  batchReceiveSampleLinesAction,
  receiveSampleLineAction,
} from "@/lib/actions/request-lines";
import { SAMPLE_CONDITION_LABELS } from "@/lib/sample-labels";
import type { RequestSampleLineView } from "@/types/catalog";

type Props = {
  requestId: string;
  requestCode: string;
  sampleCount: number;
  receivedCount: number;
  lines: RequestSampleLineView[];
  defaultReceivedBy: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none";

export function RequestLineReceivePanel({
  requestId,
  requestCode,
  sampleCount,
  receivedCount,
  lines,
  defaultReceivedBy,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const nowLocal = new Date();
  nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  const defaultDateTime = nowLocal.toISOString().slice(0, 16);

  const draftLines = useMemo(() => lines.filter((l) => l.status === "draft"), [lines]);
  const remaining = sampleCount - receivedCount;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildFormData(extra?: Record<string, string>) {
    const fd = new FormData();
    fd.set("receivedBy", defaultReceivedBy);
    fd.set("receivedAt", defaultDateTime);
    fd.set("conditionOnReceipt", "Pass");
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    return fd;
  }

  function receiveOne(lineId: string) {
    setError("");
    startTransition(async () => {
      const res = await receiveSampleLineAction(lineId, buildFormData());
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function receiveBatch() {
    if (selected.size === 0) {
      setError("Chọn ít nhất một dòng mẫu");
      return;
    }
    if (selected.size > remaining) {
      setError(`Chỉ còn được tiếp nhận tối đa ${remaining} mẫu`);
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await batchReceiveSampleLinesAction([...selected], buildFormData());
      if (res.error) {
        setError(res.error);
        return;
      }
      const failed = res.results?.filter((r) => r.error) ?? [];
      if (failed.length > 0) {
        setError(failed.map((f) => f.error).join("; "));
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  if (draftLines.length === 0 && receivedCount >= sampleCount) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-semibold text-emerald-900">Tiếp nhận từ phiếu {requestCode}</h2>
        <p className="mt-1 text-sm text-emerald-700">Đã tiếp nhận đủ {sampleCount} mẫu.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tiếp nhận từ phiếu {requestCode}</h2>
          <p className="text-sm text-slate-600">
            Đã tiếp nhận {receivedCount}/{sampleCount} · Còn {remaining} mẫu
          </p>
        </div>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          onClick={receiveBatch}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Tiếp nhận hàng loạt ({selected.size})
        </button>
      </div>
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.size === draftLines.length && draftLines.length > 0}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(draftLines.map((l) => l.id)) : new Set())
                  }
                />
              </th>
              <th className="px-3 py-2">Mã tạm</th>
              <th className="px-3 py-2">Tên mẫu</th>
              <th className="px-3 py-2">Nền mẫu</th>
              <th className="px-3 py-2">Chỉ tiêu</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  {line.status === "draft" ? (
                    <input
                      type="checkbox"
                      checked={selected.has(line.id)}
                      onChange={() => toggle(line.id)}
                    />
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{line.tempCode}</td>
                <td className="px-3 py-2">{line.sampleName}</td>
                <td className="px-3 py-2">{line.matrixName ?? "—"}</td>
                <td className="px-3 py-2">{line.tests.length}</td>
                <td className="px-3 py-2">
                  {line.status === "received" ? (
                    <span className="text-emerald-600">Đã tiếp nhận</span>
                  ) : (
                    <span className="text-amber-600">Chờ tiếp nhận</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {line.status === "draft" && line.tests.length > 0 ? (
                    <button
                      type="button"
                      disabled={pending || receivedCount >= sampleCount}
                      onClick={() => receiveOne(line.id)}
                      className="rounded-lg bg-cyan-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                    >
                      Tiếp nhận
                    </button>
                  ) : line.sampleId ? (
                    <a href={`/samples/${line.sampleId}`} className="text-xs text-cyan-700 hover:underline">
                      Xem mẫu
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa có chỉ tiêu</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Tình trạng mặc định: {SAMPLE_CONDITION_LABELS.Pass}. Tiếp nhận từng mẫu hoặc chọn nhiều dòng.
      </p>
      <input type="hidden" value={requestId} readOnly />
    </section>
  );
}
