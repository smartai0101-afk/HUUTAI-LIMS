"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PermissionKey } from "@/lib/auth/nav-permissions";
import type { NotificationView } from "@/lib/notifications/types";

type ModuleOption = { key: PermissionKey; label: string };

type Props = {
  modules: ModuleOption[];
};

type TimeFilter = "all" | "7d" | "30d";

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
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [moduleKey, setModuleKey] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [items, setItems] = useState<NotificationView[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const pageSize = 20;

  const fetchNotifications = useCallback(
    async (nextOffset: number, append: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(nextOffset),
        filter,
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
    [filter, moduleKey, timeFilter],
  );

  useEffect(() => {
    void fetchNotifications(0, false);
  }, [fetchNotifications]);

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
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (!item.read) void markOneRead(item.id);
                  }}
                  className={`flex flex-col gap-1 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${item.read ? "" : "bg-cyan-50/40"}`}
                >
                  <div>
                    <p className="text-sm text-slate-900">
                      <span className="font-semibold">{item.actorName}</span>{" "}
                      <span className="text-slate-600">{item.actionLabel}</span>{" "}
                      <span className="text-slate-800">{item.recordLabel}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.moduleLabel} · {item.entityType}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {!item.read ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">Mới</span>
                    ) : null}
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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
