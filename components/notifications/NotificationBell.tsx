"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationView } from "@/lib/notifications/types";

const POLL_MS = 45_000;

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

function badgeLabel(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setUnreadCount(data.count ?? 0);
    } catch {
      /* ignore network errors */
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=15&filter=all", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationView[] };
      setItems(data.items ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
    const id = window.setInterval(() => void fetchUnreadCount(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void fetchRecent();
    void fetchUnreadCount();
  }, [open, fetchRecent, fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setUnreadCount(0);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    void fetchUnreadCount();
  }

  const badge = badgeLabel(unreadCount);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-[60] mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Thông báo</h2>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
            >
              Đánh dấu đã đọc
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Đang tải…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Không có thông báo</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!item.read) void markOneRead(item.id);
                        setOpen(false);
                      }}
                      className={`block px-4 py-3 transition hover:bg-slate-50 ${item.read ? "opacity-70" : "bg-cyan-50/30"}`}
                    >
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{item.actorName}</span>{" "}
                        <span className="text-slate-600">{item.actionLabel}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {item.moduleLabel} · {item.recordLabel}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block py-2 text-center text-sm font-medium text-cyan-700 hover:text-cyan-900"
            >
              Xem tất cả
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
