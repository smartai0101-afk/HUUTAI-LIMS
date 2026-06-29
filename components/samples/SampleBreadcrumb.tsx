"use client";

import { usePathname } from "next/navigation";
import { SAMPLES_NAV } from "@/lib/sample-labels";

const titles: Record<string, string> = {
  "/samples": SAMPLES_NAV.list,
  "/samples/receive": SAMPLES_NAV.receive,
  "/samples/assign": SAMPLES_NAV.assign,
  "/samples/tracking": SAMPLES_NAV.tracking,
  "/samples/storage": SAMPLES_NAV.storage,
  "/samples/requests": SAMPLES_NAV.requests,
  "/samples/reports": "Báo cáo tiếp nhận mẫu",
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/samples/requests/")) return "Chi tiết phiếu yêu cầu";
  if (pathname.match(/^\/samples\/[^/]+$/)) return "Chi tiết mẫu";
  const match = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? SAMPLES_NAV.group;
}

export function SampleBreadcrumb() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  return (
    <p className="px-1 pt-2 text-sm text-slate-500 lg:px-0">
      {SAMPLES_NAV.group} / <span className="font-medium text-slate-700">{title}</span>
    </p>
  );
}
