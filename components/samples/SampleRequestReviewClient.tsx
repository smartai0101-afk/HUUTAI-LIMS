"use client";

import { useTransition } from "react";
import Link from "next/link";
import { reviewSampleRequestAction } from "@/lib/actions/samples";
import { SAMPLE_REQUEST_STATUS_LABELS } from "@/lib/sample-labels";
import type { SampleRequestListItem } from "@/types/samples";

type Props = {
  requests: SampleRequestListItem[];
};

export function SampleRequestReviewClient({ requests }: Props) {
  const [pending, startTransition] = useTransition();

  function handleReview(id: string) {
    startTransition(async () => {
      await reviewSampleRequestAction(id);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Kiểm tra yêu cầu</h1>
        <p className="text-sm text-slate-500">Phiếu đã gửi chờ xác nhận trước khi tiếp nhận mẫu</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Người yêu cầu</th>
              <th className="px-4 py-3">Loại mẫu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Không có phiếu chờ kiểm tra
                </td>
              </tr>
            ) : (
              requests.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{row.requestCode}</td>
                  <td className="px-4 py-3">{row.requesterName}</td>
                  <td className="px-4 py-3">{row.sampleType}</td>
                  <td className="px-4 py-3">{SAMPLE_REQUEST_STATUS_LABELS[row.status]}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/samples/requests/${row.id}`}
                        className="text-cyan-700 hover:underline"
                      >
                        Xem
                      </Link>
                      <Link
                        href={`/samples/receive?requestId=${row.id}`}
                        className="text-cyan-700 hover:underline"
                      >
                        Tiếp nhận
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleReview(row.id)}
                        className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Xác nhận kiểm tra
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
