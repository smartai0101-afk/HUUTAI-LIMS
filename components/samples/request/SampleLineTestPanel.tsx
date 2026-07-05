"use client";

import { TestMethodSelector } from "./TestMethodSelector";
import { TestPackageSelector } from "./TestPackageSelector";
import type { SampleLineDraft } from "./SampleTable";
import type { TestMethodView, TestPackageView } from "@/types/catalog";

type Props = {
  line: SampleLineDraft | null;
  testMethods: TestMethodView[];
  packages: TestPackageView[];
  onChangeTests: (testMethodIds: string[]) => void;
  onApplyPackage: (testMethodIds: string[]) => void;
  readOnly?: boolean;
};

export function SampleLineTestPanel({
  line,
  testMethods,
  packages,
  onChangeTests,
  onApplyPackage,
  readOnly,
}: Props) {
  if (!line) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Chọn một dòng mẫu trong bảng để chọn chỉ tiêu phân tích.
      </section>
    );
  }

  if (!line.matrixId) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Mẫu <strong>{line.sampleName || "(chưa đặt tên)"}</strong> cần chọn nền mẫu trước khi chọn chỉ tiêu.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Chỉ tiêu — {line.sampleName || line.tempCode}
      </h3>
      <div className="mt-3 space-y-3">
        <TestPackageSelector
          packages={packages.filter((p) => !p.matrixId || p.matrixId === line.matrixId)}
          disabled={readOnly}
          onApply={(_, ids) => onApplyPackage(ids)}
        />
        <TestMethodSelector
          testMethods={testMethods}
          selectedIds={line.testMethodIds}
          onChange={onChangeTests}
          disabled={readOnly}
        />
      </div>
    </section>
  );
}
