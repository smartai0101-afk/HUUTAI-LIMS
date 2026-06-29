"use client";

import { usePathname } from "next/navigation";
import { ANALYSIS_NAV } from "@/lib/analysis-labels";

const titles: Record<string, string> = {
  "/analysis/inbox": ANALYSIS_NAV.inbox,
  "/analysis/assign-analyst": ANALYSIS_NAV.assignAnalyst,
  "/analysis/worklists": ANALYSIS_NAV.worklist,
  "/analysis/worksheets": ANALYSIS_NAV.worksheet,
  "/analysis/results": ANALYSIS_NAV.results,
  "/analysis/qc": ANALYSIS_NAV.qc,
  "/analysis/review": ANALYSIS_NAV.review,
};

function resolveTitle(pathname: string) {
  const match = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? ANALYSIS_NAV.group;
}

export function AnalysisBreadcrumb() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  return (
    <p className="px-1 pt-2 text-sm text-slate-500 lg:px-0">
      {ANALYSIS_NAV.group} / <span className="font-medium text-slate-700">{title}</span>
    </p>
  );
}
