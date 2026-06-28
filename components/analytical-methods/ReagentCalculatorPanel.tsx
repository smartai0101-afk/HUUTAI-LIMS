"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateReagentsAction,
  deleteMethodReagentAction,
  saveMethodReagentAction,
} from "@/lib/actions/method-execution";
import type { MethodReagentView, ReagentCalculationRow } from "@/types/analytical-methods";

type Props = {
  methodId: string;
  reagents: MethodReagentView[];
  editable: boolean;
};

export function ReagentCalculatorPanel({ methodId, reagents, editable }: Props) {
  const router = useRouter();
  const [sampleCount, setSampleCount] = useState(1);
  const [calcRows, setCalcRows] = useState<ReagentCalculationRow[]>([]);

  return (
    <div className="space-y-6">
      {editable ? (
        <form
          className="rounded-2xl border bg-white p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await saveMethodReagentAction(methodId, fd);
            router.refresh();
            e.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">Thêm hóa chất / vật tư</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input name="nameFreeText" placeholder="Tên hóa chất/vật tư" className="rounded-lg border px-2 py-1" required />
            <input name="casNumber" placeholder="CAS (optional)" className="rounded-lg border px-2 py-1" />
            <input name="amountPerSample" placeholder="Định mức / mẫu" type="number" step="any" className="rounded-lg border px-2 py-1" required />
            <input name="unit" placeholder="Đơn vị (g, mL...)" className="rounded-lg border px-2 py-1" required />
            <input name="chemicalId" placeholder="Chemical ID (optional)" className="rounded-lg border px-2 py-1" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isConsumable" value="true" />
              Vật tư tiêu hao
            </label>
          </div>
          <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white">
            Thêm
          </button>
        </form>
      ) : null}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Danh sách hóa chất / vật tư</h2>
        <ul className="space-y-2 text-sm">
          {reagents.map((r) => (
            <li key={r.id} className="flex justify-between gap-2 border-b pb-2">
              <span>
                {r.chemicalName || r.standardName || r.nameFreeText} — {r.amountPerSample} {r.unit}/mẫu
                {r.casNumber ? ` · CAS ${r.casNumber}` : ""}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await deleteMethodReagentAction(methodId, r.id);
                    router.refresh();
                  }}
                >
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Tính toán theo số mẫu</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={sampleCount}
            onChange={(e) => setSampleCount(Number(e.target.value) || 1)}
            className="w-24 rounded-lg border px-2 py-1"
          />
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white"
            onClick={async () => {
              const rows = await calculateReagentsAction(methodId, sampleCount);
              setCalcRows(rows);
            }}
          >
            Tính
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {calcRows.map((row) => (
            <li key={row.id} className={row.warning ? "text-amber-800" : ""}>
              {row.name}: {row.totalAmount} {row.unit}
              {row.stockAvailable != null ? ` (tồn: ${row.stockAvailable} ${row.stockUnit})` : ""}
              {row.warning ? ` — ${row.warning}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
