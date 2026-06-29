"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { FilterChipBar } from "@/components/FilterChipBar";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { useSession } from "@/components/SessionProvider";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import { SAMPLE_REQUEST_STATUS_LABELS } from "@/lib/sample-labels";
import type { SampleRequestListItem } from "@/types/samples";

type Props = {
  result: PaginatedResult<SampleRequestListItem>;
  listQuery: ReturnType<typeof import("@/lib/services/samples/sample-requests").parseSampleRequestListParams>;
};

export function SampleRequestsClient({ result, listQuery }: Props) {
  const { hasPermission } = useSession();
  const { setQuery, setFilter, setPage } = useListQueryState();
  const [q, setQ] = useState(listQuery.q);
  const canEdit = hasPermission("samples_requests", "write");

  const statusFilters = useMemo(
    () => [
      { value: "All", label: "Tất cả" },
      ...Object.entries(SAMPLE_REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Phiếu yêu cầu phân tích</h1>
          <p className="text-sm text-slate-500">Quản lý yêu cầu thử nghiệm từ khách hàng / phòng ban</p>
        </div>
        {canEdit ? (
          <Link
            href="/samples/requests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Tạo phiếu mới
          </Link>
        ) : null}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(q)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm"
            placeholder="Tìm mã phiếu, người yêu cầu..."
          />
        </div>
        <button
          type="button"
          onClick={() => setQuery(q)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        >
          Tìm
        </button>
      </div>

      <FilterChipBar
        options={statusFilters}
        value={listQuery.status}
        onChange={(status) => setFilter("status", status === "All" ? null : status)}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Ngày YC</th>
              <th className="px-4 py-3">Người yêu cầu</th>
              <th className="px-4 py-3">Loại mẫu</th>
              <th className="px-4 py-3">SL mẫu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{row.requestCode}</td>
                <td className="px-4 py-3">{new Date(row.requestDate).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">{row.requesterName}</td>
                <td className="px-4 py-3">{row.sampleType}</td>
                <td className="px-4 py-3">{row.sampleCount}</td>
                <td className="px-4 py-3">{SAMPLE_REQUEST_STATUS_LABELS[row.status]}</td>
                <td className="px-4 py-3">
                  <Link href={`/samples/requests/${row.id}`} className="text-cyan-700 hover:underline">
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPaginationBar
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        limit={result.limit}
        onPageChange={setPage}
      />
    </div>
  );
}
