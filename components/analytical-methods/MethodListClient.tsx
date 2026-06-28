"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { METHOD_VERSION_STATUS_LABELS } from "@/lib/analytical-methods-labels";
import type { AnalyticalMethodListItem } from "@/types/analytical-methods";
import type { PaginatedResult } from "@/lib/list-query";

type Props = {
  listResult: PaginatedResult<AnalyticalMethodListItem>;
};

export function MethodListClient({ listResult }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Danh sách phương pháp</h1>
        </div>
        <Link
          href="/analytical-methods/new"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </Link>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const query = String(fd.get("q") ?? "");
          router.push(`/analytical-methods/list?q=${encodeURIComponent(query)}`);
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm mã, tên, matrix, analyte..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
          Tìm
        </button>
      </form>

      <DataTable
        columns={[
          {
            key: "methodCode",
            header: "Mã PP",
            render: (_, row) => (
              <Link href={`/analytical-methods/${row.id}`} className="font-medium text-cyan-700 hover:underline">
                {row.methodCode}
              </Link>
            ),
          },
          { key: "methodName", header: "Tên phương pháp" },
          { key: "matrix", header: "Matrix" },
          { key: "analyte", header: "Analyte" },
          { key: "technique", header: "Kỹ thuật" },
          { key: "standardRef", header: "Chuẩn tham chiếu" },
          {
            key: "versionStatus",
            header: "Trạng thái",
            render: (v) => METHOD_VERSION_STATUS_LABELS[String(v)] ?? String(v ?? "-"),
          },
          { key: "version", header: "Ver.", render: (v) => (v != null ? `v${v}` : "-") },
        ]}
        rows={listResult.items}
        getRowKey={(row) => row.id}
      />

      <p className="text-sm text-slate-500">
        {listResult.total} phương pháp · trang {listResult.page}/{listResult.totalPages}
      </p>
    </div>
  );
}
