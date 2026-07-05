"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  approveReportAction,
  issueReportAction,
  qaApproveReportAction,
} from "@/lib/actions/results-delivery";

type ReportRow = Awaited<
  ReturnType<typeof import("@/lib/services/results-delivery/test-report").listReportsForReview>
>[number];

type Props = {
  reports: ReportRow[];
};

export function DeliveryReviewClient({ reports }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Soát xét phát hành</h1>
        <p className="text-sm text-slate-500">Lab Manager duyệt nháp → QA phê duyệt → phát hành</p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{report.reportCode}</div>
                <div className="text-sm text-slate-500">
                  {report.sample?.sampleCode ?? report.requestCode} · {report.sample?.sampleName ?? "—"}
                </div>
                <div className="mt-1 text-sm">
                  LM: {report.approvedBy || "—"} · QA: {report.qaApprovedBy || "—"}
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{report.status}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/results-delivery/reports/${report.id}`}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                Chi tiết
              </Link>
              {report.status === "draft" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await approveReportAction(report.id);
                    })
                  }
                  className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
                >
                  LM duyệt
                </button>
              ) : null}
              {report.status === "approved" && !report.qaApprovedBy ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await qaApproveReportAction(report.id);
                    })
                  }
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                >
                  QA duyệt
                </button>
              ) : null}
              {report.status === "approved" && report.qaApprovedBy ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await issueReportAction(report.id);
                    })
                  }
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                >
                  Phát hành
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
