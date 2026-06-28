"use client";

import { useMemo, useState } from "react";
import { validateConversion } from "@/lib/chem-info/calculators/unit-convert";
import {
  calculateCalibrationStandards,
  AQUEOUS_CONCENTRATION_DISCLAIMER,
  DILUTION_CONCENTRATION_UNITS,
  DILUTION_TABLE_VOLUME_UNITS,
  DILUTION_VOLUME_UNITS,
  type CalibrationStandardRow,
  type ConcentrationUnit,
  type TableVolumeUnit,
  type VolumeUnit,
} from "@/lib/chem-info/calculators/dilution";
import { CopyableTable } from "./CopyableTable";

export function CalibrationStandardsPanel() {
  const [stockConcentration, setStockConcentration] = useState("1000");
  const [stockUnit, setStockUnit] = useState<ConcentrationUnit>("mg/L");
  const [targetUnit, setTargetUnit] = useState<ConcentrationUnit>("mg/L");
  const [targetsRaw, setTargetsRaw] = useState("1, 5, 10, 20");
  const [finalVolume, setFinalVolume] = useState("100");
  const [finalVolumeUnit, setFinalVolumeUnit] = useState<VolumeUnit>("mL");
  const [volumeDisplayUnit, setVolumeDisplayUnit] = useState<TableVolumeUnit>("mL");
  const [molecularWeight, setMolecularWeight] = useState("");
  const [density, setDensity] = useState("");

  const targetConcentrations = useMemo(
    () =>
      targetsRaw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n > 0),
    [targetsRaw],
  );

  const bridgeContext = useMemo(
    () => validateConversion(stockUnit, targetUnit).requiresContext,
    [stockUnit, targetUnit],
  );

  const result = useMemo(
    () =>
      calculateCalibrationStandards({
        stockConcentration: Number(stockConcentration),
        stockUnit,
        targetConcentrations,
        targetUnit,
        finalVolume: Number(finalVolume),
        finalVolumeUnit,
        volumeDisplayUnit,
        molecularWeight: molecularWeight.trim() ? Number(molecularWeight) : undefined,
        density: density.trim() ? Number(density) : undefined,
      }),
    [
      stockConcentration,
      stockUnit,
      targetConcentrations,
      targetUnit,
      finalVolume,
      finalVolumeUnit,
      volumeDisplayUnit,
      molecularWeight,
      density,
    ],
  );

  const tableRows = result.ok
    ? result.rows.map((row) => ({
        ...row,
        diluentNote: `Thêm dung môi đến vạch ${row.vFinal} ${row.vFinalUnit}`,
        warningsText: row.warnings.join("; ") || "—",
      }))
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Pha chuẩn nhiều điểm hiệu chuẩn từ một dung dịch stock. Nhập danh sách nồng độ đích (phân
        tách bằng dấu phẩy hoặc xuống dòng).
      </p>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
        {AQUEOUS_CONCENTRATION_DISCLAIMER}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Nồng độ stock</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={stockConcentration}
              onChange={(e) => setStockConcentration(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
            <select
              value={stockUnit}
              onChange={(e) => setStockUnit(e.target.value as ConcentrationUnit)}
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
          <label className="mb-1 block text-sm text-slate-600">Đơn vị nồng độ đích</label>
          <select
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value as ConcentrationUnit)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {DILUTION_CONCENTRATION_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">Nồng độ đích</label>
          <textarea
            value={targetsRaw}
            onChange={(e) => setTargetsRaw(e.target.value)}
            rows={3}
            placeholder="1, 5, 10, 20"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Thể tích cuối mỗi điểm</label>
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

      {bridgeContext.includes("molecularWeight") ? (
        <div>
          <label className="mb-1 block text-sm text-slate-600">Khối lượng mol (g/mol)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={molecularWeight}
            onChange={(e) => setMolecularWeight(e.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
      ) : null}

      {bridgeContext.includes("density") ? (
        <div>
          <label className="mb-1 block text-sm text-slate-600">Mật độ dung dịch (g/mL)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
      ) : null}

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-xs text-slate-500">{result.formula}</p>
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
          <CopyableTable<CalibrationStandardRow & { diluentNote: string; warningsText: string }>
            columns={[
              { key: "level", header: "Standard level" },
              {
                key: "cTarget",
                header: "C target",
                render: (r) => `${r.cTarget} ${r.cTargetUnit}`,
              },
              {
                key: "vStock",
                header: "V stock",
                render: (r) => `${r.vStock} ${r.vStockUnit}`,
              },
              { key: "diluentNote", header: "Diluent to volume" },
              { key: "warningsText", header: "Cảnh báo" },
            ]}
            rows={tableRows}
            getRowKey={(r) => String(r.level)}
          />
        </div>
      )}
    </div>
  );
}
