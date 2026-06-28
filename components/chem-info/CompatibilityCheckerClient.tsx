"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";
import {
  evaluateCompatibility,
  evaluateGroupCompatibility,
  subjectFromCategory,
  subjectFromChemical,
} from "@/lib/services/chem-info/compatibility-engine";
import { cn } from "@/lib/utils";
import type { CompatibilityRuleView } from "@/types/chem-info";

type Mode = "category" | "chemical";

export type CompatibilityCategoryOption = {
  id: string;
  label: string;
};

export type CompatibilityChemicalOption = {
  id: string;
  name: string;
  casNumber: string;
  hazardCategories: string[];
};

function severityStyles(severity: string) {
  if (severity === "critical") {
    return {
      card: "border-rose-300 bg-rose-50",
      icon: "text-rose-700",
      badge: "bg-rose-200 text-rose-900",
      header: "text-rose-950",
    };
  }
  if (severity === "high") {
    return {
      card: "border-rose-200 bg-rose-50",
      icon: "text-rose-600",
      badge: "bg-rose-100 text-rose-800",
      header: "text-rose-900",
    };
  }
  if (severity === "medium") {
    return {
      card: "border-amber-200 bg-amber-50",
      icon: "text-amber-600",
      badge: "bg-amber-100 text-amber-800",
      header: "text-amber-900",
    };
  }
  return {
    card: "border-slate-200 bg-slate-50",
    icon: "text-slate-600",
    badge: "bg-slate-200 text-slate-700",
    header: "text-slate-900",
  };
}

function severityLabel(severity: string) {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "Cao";
  if (severity === "medium") return "Trung bình";
  return "Thấp";
}

function CompatibilityResults({ rules }: { rules: CompatibilityRuleView[] }) {
  if (!rules.length) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-950">Không có dữ liệu tương thích</p>
          <p className="mt-1 text-sm text-amber-900">
            Không phải là an toàn. Hãy tham khảo SDS hoặc quy định nội bộ trước khi lưu chung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
        <div>
          <p className="font-semibold text-rose-950">Không tương thích</p>
          <p className="text-sm text-rose-900">
            Phát hiện {rules.length} quy tắc xung đột lưu trữ cho cặp đã chọn.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => {
          const styles = severityStyles(rule.severity);
          return (
            <div
              key={rule.code}
              className={cn("rounded-2xl border p-4 shadow-sm", styles.card)}
            >
              <div className="flex items-start gap-3">
                {rule.severity === "critical" || rule.severity === "high" ? (
                  <ShieldAlert className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} />
                ) : (
                  <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("font-semibold", styles.header)}>{rule.title}</p>
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", styles.badge)}>
                      Mức: {severityLabel(rule.severity)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {rule.categoryALabel} + {rule.categoryBLabel}
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {rule.ruleType}
                    </span>
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-800">
                    <p>
                      <span className="font-medium">Nguy cơ:</span> {rule.message}
                    </p>
                    {rule.storageGuidance ? (
                      <p>
                        <span className="font-medium">Khuyến nghị:</span> {rule.storageGuidance}
                      </p>
                    ) : null}
                  </div>
                  {rule.examples.length ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Ví dụ: {rule.examples.join("; ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompatibilityCheckerClient({
  rules,
  categoryOptions,
  chemicalOptions,
}: {
  rules: CompatibilityRuleView[];
  categoryOptions: CompatibilityCategoryOption[];
  chemicalOptions: CompatibilityChemicalOption[];
}) {
  const [mode, setMode] = useState<Mode>("category");
  const [categoryA, setCategoryA] = useState("");
  const [categoryB, setCategoryB] = useState("");
  const [chemicalAId, setChemicalAId] = useState("");
  const [chemicalBId, setChemicalBId] = useState("");

  const evaluation = useMemo(() => {
    if (mode === "category") {
      if (!categoryA || !categoryB) {
        return { status: "unknown" as const, rules: [], tier: null };
      }
      return evaluateGroupCompatibility(
        subjectFromCategory(categoryA),
        subjectFromCategory(categoryB),
        rules,
      );
    }
    const chemA = chemicalOptions.find((c) => c.id === chemicalAId);
    const chemB = chemicalOptions.find((c) => c.id === chemicalBId);
    if (!chemA || !chemB) {
      return { status: "unknown" as const, rules: [], tier: null };
    }
    return evaluateCompatibility(
      subjectFromChemical(chemA.casNumber, chemA.hazardCategories),
      subjectFromChemical(chemB.casNumber, chemB.hazardCategories),
      rules,
    );
  }, [mode, categoryA, categoryB, chemicalAId, chemicalBId, rules, chemicalOptions]);

  const matchedRules = evaluation.rules;

  const hasSelection =
    mode === "category"
      ? Boolean(categoryA && categoryB)
      : Boolean(chemicalAId && chemicalBId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Thông tin hóa học</p>
        <h1 className="text-2xl font-semibold text-slate-900">Kiểm tra tương thích hóa chất</h1>
        <p className="mt-1 text-sm text-slate-600">
          So sánh nhóm nguy hiểm hoặc chọn hai hóa chất tra cứu để xem quy tắc lưu trữ.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode("category")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            mode === "category"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          Theo nhóm nguy hiểm
        </button>
        <button
          type="button"
          onClick={() => setMode("chemical")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            mode === "chemical"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          Theo hóa chất tra cứu
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {mode === "category" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Nhóm A</label>
              <select
                value={categoryA}
                onChange={(e) => setCategoryA(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                <option value="">— Chọn nhóm —</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Nhóm B</label>
              <select
                value={categoryB}
                onChange={(e) => setCategoryB(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                <option value="">— Chọn nhóm —</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Hóa chất A</label>
              <select
                value={chemicalAId}
                onChange={(e) => setChemicalAId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                <option value="">— Chọn hóa chất —</option>
                {chemicalOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.casNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Hóa chất B</label>
              <select
                value={chemicalBId}
                onChange={(e) => setChemicalBId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                <option value="">— Chọn hóa chất —</option>
                {chemicalOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.casNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {!hasSelection ? (
        <ChemInfoEmptyState message="Chọn hai nhóm hoặc hai hóa chất để kiểm tra tương thích." />
      ) : (
        <CompatibilityResults rules={matchedRules} />
      )}
    </div>
  );
}
