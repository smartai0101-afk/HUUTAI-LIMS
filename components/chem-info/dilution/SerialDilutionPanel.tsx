"use client";

import { useMemo, useState } from "react";
import {
  calculateSerialDilution,
  AQUEOUS_CONCENTRATION_DISCLAIMER,
  DILUTION_CONCENTRATION_UNITS,
  DILUTION_TABLE_VOLUME_UNITS,
  DILUTION_VOLUME_UNITS,
  type ConcentrationUnit,
  type SerialDilutionRow,
  type TableVolumeUnit,
  type VolumeUnit,
} from "@/lib/chem-info/calculators/dilution";
import { CopyableTable } from "./CopyableTable";

const FACTOR_PRESETS = [2, 5, 10] as const;

export function SerialDilutionPanel() {
  const [cInitial, setCInitial] = useState("1000");
  const [cInitialUnit, setCInitialUnit] = useState<ConcentrationUnit>("mg/L");
  const [factorPreset, setFactorPreset] = useState<string>("10");
  const [customFactor, setCustomFactor] = useState("");
  const [steps, setSteps] = useState("5");
  const [finalVolume, setFinalVolume] = useState("10");
  const [finalVolumeUnit, setFinalVolumeUnit] = useState<VolumeUnit>("mL");
  const [volumeDisplayUnit, setVolumeDisplayUnit] = useState<TableVolumeUnit>("mL");

  const dilutionFactor = factorPreset === "custom" ? Number(customFactor) : Number(factorPreset);

  const result = useMemo(
    () =>
      calculateSerialDilution({
        cInitial: Number(cInitial),
        cInitialUnit,
        dilutionFactor,
        steps: Number(steps),
        finalVolumePerTube: Number(finalVolume),
        finalVolumeUnit,
        volumeDisplayUnit,
      }),
    [cInitial, cInitialUnit, dilutionFactor, steps, finalVolume, finalVolumeUnit, volumeDisplayUnit],
  );

  const tableRows = result.ok
    ? result.rows.map((row) => ({
        ...row,
        warningsText: row.warnings.join("; ") || "—",
      }))
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Pha loãng nối tiếp: mỗi bước lấy 1/factor thể tích từ nguồn trước, pha đến thể tích cuối
        cố định mỗi ống.
      </p>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
        {AQUEOUS_CONCENTRATION_DISCLAIMER}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Nồng độ ban đầu</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={cInitial}
              onChange={(e) => setCInitial(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
            <select
              value={cInitialUnit}
              onChange={(e) => setCInitialUnit(e.target.value as ConcentrationUnit)}
              className="h-11 w-28 shrink-0 rounded-xl border border-slate-200 px-2 text-sm outline-none focus:border-cyan-300"
            >
              {DILUTION_CONCENTRATION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Hệ số pha loãng</label>
          <select
            value={factorPreset}
            onChange={(e) => setFactorPreset(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {FACTOR_PRESETS.map((f) => (
              <option key={f} value={String(f)}>
                {f}×
              </option>
            ))}
            <option value="custom">Tùy chỉnh</option>
          </select>
        </div>

        {factorPreset === "custom" ? (
          <div>
            <label className="mb-1 block text-sm text-slate-600">Hệ số tùy chỉnh</label>
            <input
              type="number"
              min={1}
              step="any"
              value={customFactor}
              onChange={(e) => setCustomFactor(e.target.value)}
              placeholder="> 1"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm text-slate-600">Số bước</label>
          <input
            type="number"
            min={1}
            step={1}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Thể tích cuối mỗi ống</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={finalVolume}
              onChange={(e) => setFinalVolume(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
            <select
              value={finalVolumeUnit}
              onChange={(e) => setFinalVolumeUnit(e.target.value as VolumeUnit)}
              className="h-11 w-28 shrink-0 rounded-xl border border-slate-200 px-2 text-sm outline-none focus:border-cyan-300"
            >
              {DILUTION_VOLUME_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-xs text-slate-500">{result.formula}</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Hiển thị thể tích bằng</label>
              <select
                value={volumeDisplayUnit}
                onChange={(e) => setVolumeDisplayUnit(e.target.value as TableVolumeUnit)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                {DILUTION_TABLE_VOLUME_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <CopyableTable<SerialDilutionRow & { warningsText: string }>
            columns={[
              { key: "step", header: "Step" },
              {
                key: "cFinal",
                header: "Cfinal",
                render: (r) => `${r.cFinal} ${r.cFinalUnit}`,
              },
              {
                key: "vStock",
                header: "V stock",
                render: (r) => `${r.vStock} ${r.vStockUnit}`,
              },
              {
                key: "vDiluent",
                header: "V dung môi",
                render: (r) => `${r.vDiluent} ${r.vDiluentUnit}`,
              },
              {
                key: "vFinal",
                header: "V cuối",
                render: (r) => `${r.vFinal} ${r.vFinalUnit}`,
              },
              { key: "warningsText", header: "Cảnh báo" },
            ]}
            rows={tableRows}
            getRowKey={(r) => String(r.step)}
          />
        </div>
      )}
    </div>
  );
}
