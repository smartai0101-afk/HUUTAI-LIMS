"use client";

import { useMemo, useState } from "react";
import { validateConversion } from "@/lib/chem-info/calculators/unit-convert";
import {
  calculateSingleDilution,
  AQUEOUS_CONCENTRATION_DISCLAIMER,
  DILUTION_CONCENTRATION_UNITS,
  DILUTION_VOLUME_UNITS,
  type ConcentrationUnit,
  type SolveFor,
  type VolumeUnit,
} from "@/lib/chem-info/calculators/dilution";
import { DilutionProcedureSteps } from "./DilutionProcedureSteps";
import { cn } from "@/lib/utils";

const solveLabels: Record<SolveFor, string> = {
  v1: "V₁ — lấy bao nhiêu stock",
  v2: "V₂ — pha tới thể tích cuối",
  c1: "C₁ — nồng độ stock cần có",
  c2: "C₂ — nồng độ sau pha loãng",
};

const fieldLabels: Record<SolveFor, string> = {
  c1: "C₁ (nồng độ stock)",
  v1: "V₁ (thể tích stock)",
  c2: "C₂ (nồng độ sau pha loãng)",
  v2: "V₂ (thể tích cuối)",
};

function needsBridgeContext(c1Unit: ConcentrationUnit, c2Unit: ConcentrationUnit) {
  const v12 = validateConversion(c1Unit, c2Unit);
  return v12.requiresContext;
}

export function SingleDilutionPanel() {
  const [c1, setC1] = useState("1");
  const [v1, setV1] = useState("10");
  const [c2, setC2] = useState("0.1");
  const [v2, setV2] = useState("");
  const [c1Unit, setC1Unit] = useState<ConcentrationUnit>("M");
  const [c2Unit, setC2Unit] = useState<ConcentrationUnit>("M");
  const [v1Unit, setV1Unit] = useState<VolumeUnit>("mL");
  const [v2Unit, setV2Unit] = useState<VolumeUnit>("mL");
  const [solveFor, setSolveFor] = useState<SolveFor>("v2");
  const [molecularWeight, setMolecularWeight] = useState("");
  const [density, setDensity] = useState("");

  const bridgeContext = useMemo(
    () => needsBridgeContext(c1Unit, c2Unit),
    [c1Unit, c2Unit],
  );

  const result = useMemo(
    () =>
      calculateSingleDilution({
        c1: Number(c1),
        v1: Number(v1),
        c2: Number(c2),
        v2: Number(v2),
        c1Unit,
        c2Unit,
        v1Unit,
        v2Unit,
        solveFor,
        molecularWeight: molecularWeight.trim() ? Number(molecularWeight) : undefined,
        density: density.trim() ? Number(density) : undefined,
      }),
    [c1, v1, c2, v2, c1Unit, c2Unit, v1Unit, v2Unit, solveFor, molecularWeight, density],
  );

  const fields: Array<{
    key: SolveFor;
    value: string;
    setValue: (v: string) => void;
    unit: ConcentrationUnit | VolumeUnit;
    setUnit: (u: ConcentrationUnit | VolumeUnit) => void;
    unitOptions: readonly string[];
  }> = [
    {
      key: "c1",
      value: c1,
      setValue: setC1,
      unit: c1Unit,
      setUnit: (u) => setC1Unit(u as ConcentrationUnit),
      unitOptions: DILUTION_CONCENTRATION_UNITS,
    },
    {
      key: "v1",
      value: v1,
      setValue: setV1,
      unit: v1Unit,
      setUnit: (u) => setV1Unit(u as VolumeUnit),
      unitOptions: DILUTION_VOLUME_UNITS,
    },
    {
      key: "c2",
      value: c2,
      setValue: setC2,
      unit: c2Unit,
      setUnit: (u) => setC2Unit(u as ConcentrationUnit),
      unitOptions: DILUTION_CONCENTRATION_UNITS,
    },
    {
      key: "v2",
      value: v2,
      setValue: setV2,
      unit: v2Unit,
      setUnit: (u) => setV2Unit(u as VolumeUnit),
      unitOptions: DILUTION_VOLUME_UNITS,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Phương trình pha loãng C₁V₁ = C₂V₂. Chọn biến cần tính và nhập các giá trị còn lại kèm đơn
        vị.
      </p>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
        {AQUEOUS_CONCENTRATION_DISCLAIMER}
      </p>

      <div>
        <label className="mb-1 block text-sm text-slate-600">Tính biến</label>
        <select
          value={solveFor}
          onChange={(e) => setSolveFor(e.target.value as SolveFor)}
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
        >
          {(Object.keys(solveLabels) as SolveFor[]).map((key) => (
            <option key={key} value={key}>
              {solveLabels[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, value, setValue, unit, setUnit, unitOptions }) => {
          const disabled = solveFor === key;
          const displayValue =
            disabled && result.ok ? String(result.value) : value;
          return (
            <div key={key}>
              <label className="mb-1 block text-sm text-slate-600">{fieldLabels[key]}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  disabled={disabled}
                  value={displayValue}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={disabled ? "?" : ""}
                  className={cn(
                    "h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300",
                    disabled && "bg-slate-100 text-slate-500",
                  )}
                />
                <select
                  value={unit}
                  onChange={(e) => {
                    const u = e.target.value;
                    if (key === "c1" || key === "c2") setUnit(u as ConcentrationUnit);
                    else setUnit(u as VolumeUnit);
                  }}
                  className="h-11 w-28 shrink-0 rounded-xl border border-slate-200 px-2 text-sm outline-none focus:border-cyan-300"
                >
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
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
            placeholder="Bắt buộc khi quy đổi M ↔ mg/L"
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
            placeholder="Bắt buộc khi quy đổi % w/w ↔ mg/mL"
            className="h-11 w-full max-w-xs rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
      ) : null}

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-100">
            <p className="text-xs text-cyan-700">Kết quả — {fieldLabels[result.variable]}</p>
            <p className="text-2xl font-semibold text-cyan-900">
              {result.value} {result.valueUnit}
            </p>
            <p className="mt-1 font-mono text-xs text-cyan-800">{result.formula}</p>
          </div>

          {result.procedure ? <DilutionProcedureSteps procedure={result.procedure} /> : null}

          {result.warnings.length > 0 ? (
            <ul className="space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
