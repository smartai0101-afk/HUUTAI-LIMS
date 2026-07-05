"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SampleTestMatrix } from "@/components/samples/request/SampleTestMatrix";
import { toggleMatrixCellAction } from "@/lib/actions/request-lines";
import type { SampleTestMatrixView } from "@/types/catalog";

type Props = {
  requestId: string;
  requestCode: string;
  matrix: SampleTestMatrixView;
  readOnly?: boolean;
};

export function RequestMatrixClient({ requestId, requestCode, matrix, readOnly }: Props) {
  const [data, setData] = useState(matrix);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function refreshCell(lineId: string, testMethodId: string, selected: boolean) {
    setData((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.lineId === lineId && c.testMethodId === testMethodId ? { ...c, selected } : c,
      ),
      lines: prev.lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              tests: selected
                ? [
                    ...l.tests.filter((t) => t.testMethodId !== testMethodId),
                    {
                      id: `tmp-${testMethodId}`,
                      testMethodId,
                      testMethodCode: "",
                      testMethodName: "",
                      categoryName: "",
                      defaultUnit: "",
                      methodId: null,
                      methodCode: null,
                      priority: "normal" as const,
                      note: "",
                    },
                  ]
                : l.tests.filter((t) => t.testMethodId !== testMethodId),
            }
          : l,
      ),
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ma trận mẫu – chỉ tiêu</h1>
          <p className="text-sm text-slate-500">Phiếu {requestCode}</p>
        </div>
        <Link href={`/samples/requests/${requestId}`} className="rounded-xl border px-4 py-2 text-sm">
          Quay lại phiếu
        </Link>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {pending ? <p className="text-sm text-slate-500">Đang cập nhật...</p> : null}
      <SampleTestMatrix
        matrix={data}
        readOnly={readOnly}
        onToggle={(lineId, testMethodId, selected) => {
          startTransition(async () => {
            const res = await toggleMatrixCellAction(lineId, testMethodId, selected);
            if (res.error) {
              setError(res.error);
              return;
            }
            setError("");
            refreshCell(lineId, testMethodId, selected);
          });
        }}
      />
    </div>
  );
}
