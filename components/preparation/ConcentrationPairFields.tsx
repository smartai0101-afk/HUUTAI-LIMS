"use client";

type Props = {
  concentration: string;
  finalConcentration: string;
  concentrationUnit?: string;
  onChange: (patch: {
    concentration?: string;
    finalConcentration?: string;
    concentrationUnit?: string;
  }) => void;
  theoreticalRequired?: boolean;
  theoreticalLabel?: string;
  finalLabel?: string;
  unitLabel?: string;
  unitPlaceholder?: string;
  /** When false, omit unit column (e.g. PreparedStrain). Default true when concentrationUnit prop is passed. */
  showUnit?: boolean;
  className?: string;
};

const inputClass = "h-11 w-full rounded-xl border border-slate-200 px-3 text-sm";

export function ConcentrationPairFields({
  concentration,
  finalConcentration,
  concentrationUnit,
  onChange,
  theoreticalRequired = false,
  theoreticalLabel = "Nồng độ lý thuyết",
  finalLabel = "Nồng độ thực tế",
  unitLabel = "Đơn vị nồng độ",
  unitPlaceholder,
  showUnit = concentrationUnit !== undefined,
  className = "sm:col-span-2",
}: Props) {
  const cols = showUnit ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={`grid gap-3 ${cols} ${className}`}>
      <div>
        <label className="mb-1 block text-sm text-slate-600">
          {theoreticalLabel}
          {theoreticalRequired ? " *" : ""}
        </label>
        <input
          value={concentration}
          onChange={(e) => onChange({ concentration: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">{finalLabel}</label>
        <input
          value={finalConcentration}
          onChange={(e) => onChange({ finalConcentration: e.target.value })}
          className={inputClass}
        />
      </div>
      {showUnit ? (
        <div>
          <label className="mb-1 block text-sm text-slate-600">{unitLabel}</label>
          <input
            value={concentrationUnit ?? ""}
            onChange={(e) => onChange({ concentrationUnit: e.target.value })}
            placeholder={unitPlaceholder}
            className={inputClass}
          />
        </div>
      ) : null}
    </div>
  );
}
