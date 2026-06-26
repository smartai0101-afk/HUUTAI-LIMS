"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { useSession, useUserDisplayName } from "@/components/SessionProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { logout } from "@/lib/actions/auth";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const { role, user } = useSession();
  const displayName = useUserDisplayName();
  const initials = initialsFromName(displayName);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search item, lot, barcode..."
              className="h-10 w-[320px] rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <div className="block md:hidden">
            <span className="text-sm font-semibold text-slate-700">Lab Inventory</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-cyan-200 hover:bg-cyan-50/40"
            >
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-cyan-500 text-sm font-semibold text-white">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  initials || "U"
                )}
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-slate-900">{displayName}</p>
                {role ? <p className="text-xs text-slate-500">{role}</p> : null}
              </div>
            </Link>
          ) : null}
          {user ? (
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
