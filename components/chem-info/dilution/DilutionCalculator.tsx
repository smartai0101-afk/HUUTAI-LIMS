"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SingleDilutionPanel } from "./SingleDilutionPanel";
import { SerialDilutionPanel } from "./SerialDilutionPanel";
import { CalibrationStandardsPanel } from "./CalibrationStandardsPanel";

type DilutionMode = "single" | "serial" | "calibration";

const modes: { id: DilutionMode; label: string }[] = [
  { id: "single", label: "Pha loãng đơn" },
  { id: "serial", label: "Pha loãng nối tiếp" },
  { id: "calibration", label: "Chuẩn hiệu chuẩn" },
];

export function DilutionCalculator() {
  const [mode, setMode] = useState<DilutionMode>("single");

  const content = useMemo(() => {
    switch (mode) {
      case "single":
        return <SingleDilutionPanel />;
      case "serial":
        return <SerialDilutionPanel />;
      case "calibration":
        return <CalibrationStandardsPanel />;
      default:
        return null;
    }
  }, [mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mode === m.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}
