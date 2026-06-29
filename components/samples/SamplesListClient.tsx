"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { FilterChipBar } from "@/components/FilterChipBar";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { useSession } from "@/components/SessionProvider";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import { SAMPLE_STATUS_LABELS } from "@/lib/sample-labels";
import type { SampleListItem } from "@/types/samples";
import type { SampleListParams } from "@/lib/services/samples/sample-list";

type Props = {
  result: PaginatedResult<SampleListItem>;
  listQuery: SampleListParams;
  sampleTypeOptions: string[];
  methodOptions: { id: string; methodCode: string; methodName: string }[];
};

export function SamplesListClient({ result, listQuery, sampleTypeOptions, methodOptions }: Props) {
  const router = useRouter();
  const { hasPermission } = useSession();
  const { setQuery, setFilter, setPage } = useListQueryState();
  const [q, setQ] = useState(listQuery.q);

  const statusFilters = useMemo(
    () => [
      { value: "All", label: "Tất cả trạng thái" },
      ...Object.entries(SAMPLE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  const canReceive = hasPermission("samples_receive", "write");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Danh sách mẫu</h1>
          <p className="text-sm text-slate-500">Quản lý mẫu thử đã tiếp nhận</p>
        </div>
        {canReceive ? (
          <Link
            href="/samples/receive"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            Tiếp nhận mẫu mới
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setQuery(q);
            }}
            placeholder="Tìm mã mẫu, tên mẫu, người nhận..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setQuery(q)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Tìm kiếm
        </button>
      </div>

      <FilterChipBar
        options={statusFilters}
        value={listQuery.status}
        onChange={(status) => setFilter("status", status === "All" ? null : status)}
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={listQuery.sampleType}
          onChange={(e) => setFilter("sampleType", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="All">Tất cả loại mẫu</option>
          {sampleTypeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={listQuery.methodId}
          onChange={(e) => setFilter("methodId", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="All">Tất cả phương pháp</option>
          {methodOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.methodCode} — {m.methodName}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={listQuery.receivedFrom}
          onChange={(e) => setFilter("receivedFrom", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={listQuery.receivedTo}
          onChange={(e) => setFilter("receivedTo", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={listQuery.overdue}
            onChange={(e) => setFilter("overdue", e.target.checked ? "true" : "")}
          />
          Mẫu quá hạn
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="table-scroll-viewport overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Mã mẫu</th>
                <th className="px-4 py-3">Tên mẫu</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Ngày tiếp nhận</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Phương pháp</th>
                <th className="px-4 py-3">Quản lý phòng</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.sampleCode}</td>
                  <td className="px-4 py-3">{row.sampleName}</td>
                  <td className="px-4 py-3">{row.sampleType}</td>
                  <td className="px-4 py-3">
                    {new Date(row.receivedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <SampleStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    {row.needsMethodAssignment ? (
                      <span className="text-amber-600">Cần chỉ định phương pháp</span>
                    ) : (
                      row.methodName
                    )}
                  </td>
                  <td className="px-4 py-3">{row.assignedTo || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.dueDate ? new Date(row.dueDate).toLocaleDateString("vi-VN") : "—"}
                      {row.isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Quá hạn
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/samples/${row.id}`)}
                      className="text-cyan-700 hover:underline"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Chưa có mẫu nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
