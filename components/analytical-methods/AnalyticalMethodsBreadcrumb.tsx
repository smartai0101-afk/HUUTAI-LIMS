"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function AnalyticalMethodsBreadcrumb() {
  const pathname = usePathname();
  const segments: { label: string; href?: string }[] = [{ label: "Phương pháp phân tích", href: "/analytical-methods" }];

  if (pathname.startsWith("/analytical-methods/list")) {
    segments.push({ label: "Danh sách" });
  } else if (pathname.startsWith("/analytical-methods/new")) {
    segments.push({ label: "Tạo mới" });
  } else if (pathname.match(/^\/analytical-methods\/[^/]+/)) {
    segments.push({ label: "Chi tiết", href: pathname.split("/").slice(0, 3).join("/") });
  } else if (pathname.startsWith("/method-executions/")) {
    segments.push({ label: "Thực hiện" });
  }

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {segments.map((seg, i) => (
        <span key={`${seg.label}-${i}`} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          {seg.href ? (
            <Link href={seg.href} className="hover:text-cyan-700">
              {seg.label}
            </Link>
          ) : (
            <span className="text-slate-700">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
