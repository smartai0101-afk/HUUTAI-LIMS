"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Plus } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { METHOD_VERSION_STATUS_LABELS } from "@/lib/analytical-methods-labels";
import type { MethodDashboardStats } from "@/types/analytical-methods";

type Props = { stats: MethodDashboardStats };

export function MethodsDashboardClient({ stats }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Quản lý SOP và quy trình phân tích</p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard phương pháp</h1>
        </div>
        <Link
          href="/analytical-methods/new"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4" />
          Tạo phương pháp
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Tổng phương pháp" value={`${stats.totalMethods}`} icon={FlaskConical} />
        <StatCard title={METHOD_VERSION_STATUS_LABELS.Draft} value={`${stats.draftCount}`} icon={FlaskConical} />
        <StatCard title={METHOD_VERSION_STATUS_LABELS.Review} value={`${stats.reviewCount}`} icon={FlaskConical} tone="warning" />
        <StatCard title={METHOD_VERSION_STATUS_LABELS.Approved} value={`${stats.approvedCount}`} icon={FlaskConical} />
        <StatCard title={METHOD_VERSION_STATUS_LABELS.Obsolete} value={`${stats.obsoleteCount}`} icon={FlaskConical} />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Kết quả AI (khi bật) chỉ là đề xuất — luôn kiểm tra theo SOP gốc trước khi phê duyệt.
      </div>

      <Link href="/analytical-methods/list" className="text-sm font-medium text-cyan-700 hover:underline">
        Xem danh sách phương pháp →
      </Link>
    </div>
  );
}
