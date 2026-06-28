"use client";

import { useMemo, useState } from "react";
import {
  calculateSolutionPrep,
  type SolutionPrepInput,
} from "@/lib/chem-info/calculators/solution-prep";

export function SolutionPrepCalculator() {
  const [concentration, setConcentration] = useState("0.1");
  const [concentrationUnit, setConcentrationUnit] =
    useState<SolutionPrepInput["concentrationUnit"]>("M");
  const [volume, setVolume] = useState("1000");
  const [volumeUnit, setVolumeUnit] = useState<SolutionPrepInput["volumeUnit"]>("mL");
  const [molecularWeight, setMolecularWeight] = useState("");

  const result = useMemo(() => {
    const mw = molecularWeight.trim() ? Number(molecularWeight) : undefined;
    return calculateSolutionPrep({
      concentration: Number(concentration),
      concentrationUnit,
      volume: Number(volume),
      volumeUnit,
      molecularWeight: mw,
    });
  }, [concentration, concentrationUnit, volume, volumeUnit, molecularWeight]);

  const needsMw = concentrationUnit === "M" || concentrationUnit === "mM";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Tính khối lượng chất rắn cần cân để pha dung dịch theo nồng độ và thể tích mục tiêu.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Nồng độ</label>
          <input
            type="number"
            min={0}
            step="any"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Đơn vị nồng độ</label>
          <select
            value={concentrationUnit}
            onChange={(e) =>
              setConcentrationUnit(e.target.value as SolutionPrepInput["concentrationUnit"])
            }
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            <option value="M">M (mol/L)</option>
            <option value="mM">mM</option>
            <option value="g/L">g/L</option>
            <option value="mg/mL">mg/mL</option>
            <option value="%w/v">% w/v</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Thể tích</label>
          <input
            type="number"
            min={0}
            step="any"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Đơn vị thể tích</label>
          <select
            value={volumeUnit}
            onChange={(e) => setVolumeUnit(e.target.value as SolutionPrepInput["volumeUnit"])}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            <option value="L">L</option>
            <option value="mL">mL</option>
            <option value="µL">µL</option>
          </select>
        </div>
        {needsMw ? (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">Khối lượng mol (g/mol)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={molecularWeight}
              onChange={(e) => setMolecularWeight(e.target.value)}
              placeholder="Bắt buộc cho M/mM"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        ) : null}
      </div>

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-100">
          <p className="text-xs text-cyan-700">Khối lượng cần cân</p>
          <p className="text-2xl font-semibold text-cyan-900">
            {result.mass} {result.massUnit}
          </p>
          <p className="mt-1 font-mono text-xs text-cyan-800">{result.formula}</p>
        </div>
      )}
    </div>
  );
}
