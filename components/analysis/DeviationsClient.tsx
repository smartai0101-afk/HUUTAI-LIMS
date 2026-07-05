"use client";

import { useTransition, useState } from "react";
import {
  closeDeviationAction,
  createCapaActionAction,
  verifyCapaActionAction,
} from "@/lib/actions/analysis";

type DeviationRow = Awaited<
  ReturnType<typeof import("@/lib/services/analysis/deviation").listDeviations>
>[number];

type Props = {
  deviations: DeviationRow[];
};

export function DeviationsClient({ deviations }: Props) {
  const [pending, startTransition] = useTransition();
  const [rootCause, setRootCause] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sai lệch / CAPA</h1>
        <p className="text-sm text-slate-500">Quản lý sai lệch QC và hành động khắc phục</p>
      </div>

      <div className="space-y-4">
        {deviations.length === 0 ? (
          <p className="text-sm text-slate-500">Không có sai lệch mở.</p>
        ) : (
          deviations.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">
                    {d.sample.sampleCode} · {d.type || "QC_FAIL"}
                  </div>
                  <div className="text-sm text-slate-500">{d.description}</div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {d.status}
                </span>
              </div>

              {d.capaActions.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {d.capaActions.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <span>
                        {c.actionType}: {c.description} ({c.status})
                      </span>
                      {c.status !== "verified" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await verifyCapaActionAction(c.id);
                            })
                          }
                          className="text-xs text-cyan-700 hover:underline"
                        >
                          Xác nhận
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {d.status !== "closed" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    value={rootCause[d.id] ?? ""}
                    onChange={(e) =>
                      setRootCause((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    placeholder="Nguyên nhân gốc / mô tả CAPA"
                    className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await createCapaActionAction(
                          d.id,
                          "Corrective",
                          rootCause[d.id] ?? "CAPA",
                          d.task?.analystName ?? "Analyst",
                        );
                      })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    Tạo CAPA
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await closeDeviationAction(d.id, rootCause[d.id] ?? "Đã xử lý");
                      })
                    }
                    className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    Đóng sai lệch
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
