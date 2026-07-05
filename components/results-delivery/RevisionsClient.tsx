"use client";

import Link from "next/link";
import { useTransition } from "react";
import { reissueReportAction } from "@/lib/actions/results-delivery";

type RevisionRow = Awaited<
  ReturnType<typeof import("@/lib/services/results-delivery/test-report").listReportRevisions>
>[number];

type Props = {
  revisions: RevisionRow[];
};

export function RevisionsClient({ revisions }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Hiệu chỉnh kết quả</h1>
        <p className="text-sm text-slate-500">Lịch sử phát hành và tạo revision (không sửa dữ liệu đã issue)</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Phiếu</th>
              <th className="px-4 py-3">Mẫu</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/results-delivery/reports/${row.reportId}`}
                    className="text-cyan-700 hover:underline"
                  >
                    {row.report.reportCode}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.report.sample?.sampleCode ?? "—"}</td>
                <td className="px-4 py-3">
                  v{row.version} / #{row.issueNumber}
                </td>
                <td className="px-4 py-3">{row.action}</td>
                <td className="px-4 py-3">{new Date(row.actionAt).toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3">{row.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-500">
        Tạo revision từ trang chi tiết phiếu đã phát hành (nút Phát hành lại).
      </p>
    </div>
  );
}
