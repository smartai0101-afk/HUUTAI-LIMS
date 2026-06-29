"use client";

import { useState, useTransition } from "react";
import {
  approveReportAction,
  issueReportAction,
  qaApproveReportAction,
  reissueReportAction,
} from "@/lib/actions/results-delivery";
import { TestReportDocument } from "@/components/results-delivery/TestReportDocument";
import { REPORT_STATUS_LABELS } from "@/lib/result-delivery-labels";
import type { TestReportView } from "@/types/result-delivery";

function downloadCsv(report: TestReportView) {
  const header = "STT,Chỉ tiêu,Nhóm,Kết quả,Đơn vị,LOD,LOQ,Giới hạn,Đánh giá,Phương pháp";
  const lines = report.results.map((r, i) =>
    [
      i + 1,
      r.parameterName,
      r.parameterGroup,
      r.resultValue,
      r.unit,
      r.lod,
      r.loq,
      r.limitValue,
      r.evaluation ?? "",
      r.methodName ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([`\uFEFF${[header, ...lines].join("\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.reportCode}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrint(reportId: string) {
  window.open(`/results-delivery/reports/${reportId}/print`, "_blank");
}

export function ReportDetailClient({ report }: { report: TestReportView }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [reissueReason, setReissueReason] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{report.reportCode}</h1>
          <p className="text-sm text-slate-500">
            {report.sampleCode} — {report.sampleName} · {REPORT_STATUS_LABELS[report.status]}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Phiên bản v{report.reportVersion} · Lần phát hành {report.issueNumber}
            {report.note ? ` · Ghi chú: ${report.note}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openPrint(report.id)} className="rounded border px-3 py-1.5 text-sm">
            In / PDF
          </button>
          <button type="button" onClick={() => downloadCsv(report)} className="rounded border px-3 py-1.5 text-sm">
            Xuất Excel (CSV)
          </button>
        </div>
      </div>

      {error ? (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="no-print flex flex-wrap gap-2 rounded-2xl border bg-slate-50 p-4">
        {report.status === "draft" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => approveReportAction(report.id))}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
          >
            Lab Manager duyệt
          </button>
        ) : null}
        {report.status === "approved" && !report.qaApprovedBy ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => qaApproveReportAction(report.id))}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white"
          >
            QA phê duyệt
          </button>
        ) : null}
        {report.status === "approved" && report.qaApprovedBy ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => issueReportAction(report.id))}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            Phát hành
          </button>
        ) : null}
        {["issued", "reissued"].includes(report.status) ? (
          <>
            <input
              value={reissueReason}
              onChange={(e) => setReissueReason(e.target.value)}
              placeholder="Lý do phát hành lại / đính chính"
              className="min-w-[240px] rounded border px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={pending || !reissueReason.trim()}
              onClick={() => run(() => reissueReportAction(report.id, reissueReason))}
              className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white"
            >
              Phát hành lại
            </button>
          </>
        ) : null}
      </section>

      <section>
        <h2 className="no-print mb-3 text-lg font-semibold text-slate-800">Xem trước phiếu kết quả</h2>
        <TestReportDocument report={report} mode="preview" />
      </section>
    </div>
  );
}
