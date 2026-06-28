"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { DilutionCalculator } from "@/components/chem-info/DilutionCalculator";
import { MolecularWeightCalculator } from "@/components/chem-info/MolecularWeightCalculator";
import { SolutionPrepCalculator } from "@/components/chem-info/SolutionPrepCalculator";
import { UnitConverter } from "@/components/chem-info/UnitConverter";

type TabId = "mw" | "solution" | "dilution" | "units";

const tabs: { id: TabId; label: string }[] = [
  { id: "mw", label: "Khối lượng mol" },
  { id: "solution", label: "Pha dung dịch" },
  { id: "dilution", label: "Pha loãng C₁V₁=C₂V₂" },
  { id: "units", label: "Quy đổi đơn vị" },
];

export function CalculatorTabs() {
  const [active, setActive] = useState<TabId>("mw");

  const content = useMemo(() => {
    switch (active) {
      case "mw":
        return <MolecularWeightCalculator />;
      case "solution":
        return <SolutionPrepCalculator />;
      case "dilution":
        return <DilutionCalculator />;
      case "units":
        return <UnitConverter />;
      default:
        return null;
    }
  }, [active]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Thông tin hóa học</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <Calculator className="h-7 w-7 text-cyan-600" />
          Máy tính hóa học
        </h1>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              active === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{content}</div>
    </div>
  );
}
