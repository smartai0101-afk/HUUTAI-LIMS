"use client";

import type { TestPackageView } from "@/types/catalog";

type Props = {
  packages: TestPackageView[];
  onApply: (packageId: string, testMethodIds: string[]) => void;
  disabled?: boolean;
};

export function TestPackageSelector({ packages, onApply, disabled }: Props) {
  if (packages.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
      <p className="mb-2 text-xs font-semibold text-cyan-900">Gói chỉ tiêu thường dùng</p>
      <div className="flex flex-wrap gap-2">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            disabled={disabled}
            onClick={() => onApply(pkg.id, pkg.testMethodIds)}
            className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50"
            title={pkg.testMethodNames.join(", ")}
          >
            {pkg.name}
          </button>
        ))}
      </div>
    </div>
  );
}
