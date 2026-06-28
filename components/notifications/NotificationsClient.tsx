"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import type { PermissionKey } from "@/lib/auth/nav-permissions";
import { nextSortParams, type SortOrder } from "@/lib/list-query";
import type { NotificationView } from "@/lib/notifications/types";

type ModuleOption = { key: PermissionKey; label: string };

type Props = {
  modules: ModuleOption[];
};

type TimeFilter = "all" | "7d" | "30d";

type NotificationSortKey = "createdAt" | "actorName" | "moduleLabel" | "action" | "recordLabel";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function timeRange(filter: TimeFilter): { from?: string; to?: string } {
  if (filter === "all") return {};
  const days = filter === "7d" ? 7 : 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString() };
}

export function NotificationsClient({ modules }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [moduleKey, setModuleKey] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [items, setItems] = useState<NotificationView[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<NotificationSortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortActive, setSortActive] = useState(false);

  const pageSize = 20;

  const fetchNotifications = useCallback(
    async (nextOffset: number, append: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(nextOffset),
        filter,
        sortBy,
        sortOrder,
      });
      if (moduleKey) params.set("module", moduleKey);
      const range = timeRange(timeFilter);
      if (range.from) params.set("from", range.from);

      try {
        const res = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { items: NotificationView[]; total: number };
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total ?? 0);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [filter, moduleKey, timeFilter, sortBy, sortOrder],
  );

  useEffect(() => {
    void fetchNotifications(0, false);
  }, [fetchNotifications]);

  const toggleSort = (sortKey: string) => {
    const key = sortKey as NotificationSortKey;
    const next = nextSortParams(key, sortBy, sortOrder);
    setSortBy((next.sortBy as NotificationSortKey) ?? "createdAt");
    setSortOrder(next.sortOrder ?? "desc");
    setSortActive(Boolean(next.sortBy));
  };

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi hoạt động trong các module bạn có quyền truy cập</p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "unread")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="unread">Chưa đọc</option>
        </select>

        <select
          value={moduleKey}
          onChange={(e) => setModuleKey(e.target.value)}
          className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Theo module — tất cả</option>
          {modules.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">Mọi thời gian</option>
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading && items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Không có thông báo phù hợp bộ lọc</p>
        ) : (
          <DataTable
            columns={[
              {
                key: "createdAt",
                header: "Thời gian",
                sortable: true,
                sortKey: "createdAt",
                render: (v, row) => (
                  <div className="flex items-center gap-2">
                    {!row.read ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        Mới
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-500">{formatRelativeTime(String(v))}</span>
                  </div>
                ),
              },
              {
                key: "actorName",
                header: "Người thực hiện",
                sortable: true,
                sortKey: "actorName",
                render: (v) => <span className="font-semibold text-slate-900">{String(v)}</span>,
              },
              {
                key: "actionLabel",
                header: "Hành động",
                sortable: true,
                sortKey: "action",
              },
              {
                key: "recordLabel",
                header: "Bản ghi",
                sortable: true,
                sortKey: "recordLabel",
                render: (v, row) => (
                  <Link href={row.href} onClick={() => !row.read && void markOneRead(row.id)} className="text-slate-800 hover:underline">
                    {String(v)}
                  </Link>
                ),
              },
              {
                key: "moduleLabel",
                header: "Module",
                sortable: true,
                sortKey: "moduleLabel",
                render: (v, row) => (
                  <span className="text-xs text-slate-500">
                    {String(v)} · {row.entityType}
                  </span>
                ),
              },
            ]}
            rows={items}
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              if (!row.read) void markOneRead(row.id);
              router.push(row.href);
            }}
            sort={{
              sortBy,
              sortOrder,
              sortActive,
              onSort: toggleSort,
            }}
          />
        )}
      </div>

      {items.length < total ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchNotifications(offset + pageSize, true)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Đang tải…" : "Tải thêm"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
