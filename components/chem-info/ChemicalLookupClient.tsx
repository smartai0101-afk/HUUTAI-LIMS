"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";
import { ChemicalSyncStatusBadge, sourceLabel } from "@/components/chem-info/ChemicalSyncStatusBadge";
import { PubChemSearchPanel } from "@/components/chem-info/PubChemSearchPanel";
import { useDebouncedListQuery } from "@/lib/hooks/useDebouncedListQuery";
import { formatDate } from "@/lib/utils";
import type { PaginatedResult } from "@/lib/list-query";
import type { ChemicalReferenceListParams } from "@/lib/services/chem-info/chemical-references";
import type { ChemicalReferenceView } from "@/types/chem-info";

export function ChemicalLookupClient({
  result,
  listQuery,
}: {
  result: PaginatedResult<ChemicalReferenceView>;
  listQuery: ChemicalReferenceListParams;
}) {
  const router = useRouter();
  const { inputValue, onSearchChange, onSearchFocus, onSearchBlur, commitSearch, toggleSort, setPage, setLimit, setFilter } =
    useDebouncedListQuery({ initialQuery: listQuery.q, debounceMs: 450 });
  const [showOnline, setShowOnline] = useState(false);

  const hasSearch = Boolean(listQuery.q.trim());
  const showLocalEmpty = hasSearch && result.total === 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Thông tin hóa học</p>
        <h1 className="text-2xl font-semibold text-slate-900">Tra cứu hóa chất</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={inputValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitSearch();
                }
              }}
              placeholder="Tìm theo tên, CAS, công thức..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="search"
              enterKeyHint="search"
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs text-slate-500">Chế độ tìm</label>
            <select
              value={listQuery.searchMode}
              onChange={(e) => setFilter("searchMode", e.target.value === "all" ? null : e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            >
              <option value="all">Tất cả trường</option>
              <option value="name">Tên</option>
              <option value="cas">CAS</option>
              <option value="formula">Công thức</option>
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs text-slate-500">Trạng thái dữ liệu</label>
            <select
              value={listQuery.syncStatus ?? "all"}
              onChange={(e) => setFilter("syncStatus", e.target.value === "all" ? null : e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            >
              <option value="all">Tất cả</option>
              <option value="local">Nội bộ</option>
              <option value="synced">Đồng bộ PubChem</option>
              <option value="manual">Nhập thủ công</option>
              <option value="needs_review">Chưa xác minh</option>
            </select>
          </div>
        </div>
      </div>

      {showLocalEmpty ? (
        <ChemInfoEmptyState message="Không tìm thấy trong dữ liệu nội bộ. Bạn có thể tra cứu thêm trên PubChem và lưu có chọn lọc vào hệ thống." />
      ) : null}

      {showLocalEmpty && !showOnline ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowOnline(true)}
            className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-800"
          >
            Tra cứu online
          </button>
        </div>
      ) : null}

      {showLocalEmpty && showOnline ? (
        <PubChemSearchPanel
          query={listQuery.q}
          searchMode={listQuery.searchMode}
          onClose={() => setShowOnline(false)}
        />
      ) : null}

      {!showLocalEmpty ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={[
              {
                key: "casNumber",
                header: "CAS",
                sortable: true,
                sortKey: "casNumber",
                render: (v, row) => (
                  <Link
                    href={`/chem-info/chemicals/${row.id}`}
                    className="font-medium text-cyan-700 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {String(v)}
                  </Link>
                ),
              },
              {
                key: "name",
                header: "Tên hóa chất",
                sortable: true,
                sortKey: "name",
              },
              {
                key: "molecularFormula",
                header: "Công thức",
                sortable: true,
                sortKey: "molecularFormula",
              },
              {
                key: "molecularWeight",
                header: "Khối lượng mol (g/mol)",
                sortable: true,
                sortKey: "molecularWeight",
                render: (v) => (v != null ? String(v) : "—"),
              },
              {
                key: "source",
                header: "Nguồn",
                sortable: true,
                sortKey: "source",
                render: (v, row) => (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-700">{sourceLabel(String(v))}</span>
                    <ChemicalSyncStatusBadge syncStatus={row.syncStatus} source={row.source} />
                  </div>
                ),
              },
              {
                key: "lastSyncedAt",
                header: "Cập nhật lần cuối",
                sortable: true,
                sortKey: "lastSyncedAt",
                render: (v) => (v ? formatDate(String(v)) : "—"),
              },
            ]}
            rows={result.items}
            sort={{
              sortBy: listQuery.sortBy,
              sortOrder: listQuery.sortOrder,
              sortActive: listQuery.sortActive,
              onSort: toggleSort,
            }}
            getRowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/chem-info/chemicals/${row.id}`)}
          />
          <ListPaginationBar
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            limit={result.limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      ) : null}

      {!showLocalEmpty && hasSearch ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowOnline((v) => !v)}
            className="text-sm font-medium text-cyan-700 hover:underline"
          >
            {showOnline ? "Ẩn tra cứu online" : "Tra cứu thêm trên PubChem"}
          </button>
        </div>
      ) : null}

      {!showLocalEmpty && showOnline && hasSearch ? (
        <PubChemSearchPanel
          query={listQuery.q}
          searchMode={listQuery.searchMode}
          onClose={() => setShowOnline(false)}
        />
      ) : null}
    </div>
  );
}
