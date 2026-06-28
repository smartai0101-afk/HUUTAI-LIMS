"use client";

import { useEffect, useMemo, useState } from "react";
import {
  convertUnits,
  getUnitCategories,
  getUnitLabelsByCategory,
  validateConversion,
  type UnitCategory,
} from "@/lib/chem-info/calculators/unit-convert";

const CATEGORY_DISCLAIMERS: Partial<Record<UnitCategory, string>> = {
  PPM_PPB:
    "Với dung dịch aqueous pha loãng: 1 ppm ≈ 1 mg/L và 1 ppb ≈ 1 µg/L.",
  CONCENTRATION_BRIDGE:
    "Quy đổi giữa nồng độ mol và khối lượng cần khối lượng mol (g/mol).",
  MASS_VOLUME:
    "Quy đổi khối lượng ↔ thể tích cần mật độ (g/mL).",
  CENTRIFUGATION:
    "Quy đổi rpm ↔ RCF cần bán kính rotor (cm).",
  NORMALITY_MOLALITY:
    "Normality (N) phụ thuộc số proton equivalent — chỉ quy đổi cùng loại N hoặc mol/kg.",
};

export function UnitConverter() {
  const categories = useMemo(() => getUnitCategories(), []);
  const [category, setCategory] = useState<UnitCategory>("MASS");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("g");
  const [to, setTo] = useState("mg");
  const [molecularWeight, setMolecularWeight] = useState("");
  const [density, setDensity] = useState("");
  const [rotorRadius, setRotorRadius] = useState("");

  const unitOptions = useMemo(() => getUnitLabelsByCategory(category), [category]);

  useEffect(() => {
    if (unitOptions.length >= 2) {
      setFrom(unitOptions[0] ?? "g");
      setTo(unitOptions[1] ?? "mg");
    } else if (unitOptions.length === 1) {
      setFrom(unitOptions[0] ?? "");
      setTo(unitOptions[0] ?? "");
    }
  }, [category, unitOptions]);

  const validation = useMemo(() => validateConversion(from, to), [from, to]);

  const result = useMemo(() => {
    const mw = molecularWeight.trim() ? Number(molecularWeight) : undefined;
    const rho = density.trim() ? Number(density) : undefined;
    const radius = rotorRadius.trim() ? Number(rotorRadius) : undefined;
    return convertUnits({
      value: Number(value),
      from,
      to,
      molecularWeight: mw,
      context: {
        molecularWeight: mw,
        density: rho,
        rotorRadiusCm: radius,
      },
    });
  }, [value, from, to, molecularWeight, density, rotorRadius]);

  const needsMw = validation.requiresContext.includes("molecularWeight");
  const needsDensity = validation.requiresContext.includes("density");
  const needsRadius = validation.requiresContext.includes("rotorRadius");

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Chọn loại đơn vị trước, sau đó quy đổi trong cùng nhóm. Một số cặp cần thông tin bổ sung
        (MW, mật độ, bán kính rotor).
      </p>

      {CATEGORY_DISCLAIMERS[category] ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          {CATEGORY_DISCLAIMERS[category]}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Loại đơn vị</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as UnitCategory)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Giá trị</label>
          <input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Từ</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {unitOptions.map((u) => (
              <option key={`from-${u}`} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Sang</label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {unitOptions.map((u) => (
              <option key={`to-${u}`} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        {needsMw ? (
          <div>
            <label className="mb-1 block text-sm text-slate-600">Khối lượng mol (g/mol)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={molecularWeight}
              onChange={(e) => setMolecularWeight(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        ) : null}
        {needsDensity ? (
          <div>
            <label className="mb-1 block text-sm text-slate-600">Mật độ (g/mL)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        ) : null}
        {needsRadius ? (
          <div>
            <label className="mb-1 block text-sm text-slate-600">Bán kính rotor (cm)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={rotorRadius}
              onChange={(e) => setRotorRadius(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        ) : null}
      </div>

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-100">
          <p className="text-xs text-cyan-700">Kết quả</p>
          <p className="text-2xl font-semibold text-cyan-900">
            {result.result} {to}
          </p>
          <p className="mt-1 font-mono text-xs text-cyan-800">{result.formula}</p>
        </div>
      )}
    </div>
  );
}
