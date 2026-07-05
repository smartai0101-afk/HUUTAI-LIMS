"use client";

import { AvailableTestsPanel } from "./AvailableTestsPanel";
import { matrixLabel } from "./MatrixCellSelect";
import { SelectedTestsTable } from "./SelectedTestsTable";
import { TestPackageSelector } from "./TestPackageSelector";
import type { SampleLineDraft } from "./SampleTable";
import type { SampleMatrixView, TestMethodView, TestPackageView } from "@/types/catalog";

type Props = {
  line: SampleLineDraft | null;
  matrices: SampleMatrixView[];
  testMethods: TestMethodView[];
  packages: TestPackageView[];
  onChangeTests: (testMethodIds: string[]) => void;
  onApplyPackage: (testMethodIds: string[]) => void;
  readOnly?: boolean;
  loading?: boolean;
};

export function SampleDetailPanel({
  line,
  matrices,
  testMethods,
  packages,
  onChangeTests,
  onApplyPackage,
  readOnly,
  loading,
}: Props) {
  if (!line) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
        Chọn một dòng mẫu trong bảng để chọn chỉ tiêu phân tích.
      </div>
    );
  }

  if (!line.matrixId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-amber-900">
          Mẫu <strong>{line.sampleName.trim() || line.tempCode}</strong> chưa có nền mẫu
        </p>
        <ol className="max-w-md list-inside list-decimal text-left text-xs text-slate-600">
          <li>Ở bảng trái, chọn nền ở cột <strong>Nền mẫu (gán tại đây)</strong></li>
          <li>Hoặc tick nhiều dòng → <strong>Gán nền hàng loạt</strong></li>
          <li>Sau đó chọn chỉ tiêu ở panel này</li>
        </ol>
        <p className="text-xs text-slate-400">
          Dropdown <strong>Lọc xem</strong> trên toolbar chỉ lọc bảng, không gán nền.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-100 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {line.sampleName || line.tempCode}
        </h3>
        <p className="text-xs text-slate-500">
          Nền: {matrixLabel(matrices, line.matrixId)} · {line.testMethodIds.length} chỉ tiêu
        </p>
        <div className="mt-2">
          <TestPackageSelector
            packages={packages.filter((p) => !p.matrixId || p.matrixId === line.matrixId)}
            disabled={readOnly}
            onApply={(_, ids) => onApplyPackage(ids)}
          />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <AvailableTestsPanel
          testMethods={testMethods}
          selectedIds={line.testMethodIds}
          onChange={onChangeTests}
          disabled={readOnly}
          loading={loading}
        />
        <SelectedTestsTable
          testMethods={testMethods}
          selectedIds={line.testMethodIds}
          onChange={onChangeTests}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
