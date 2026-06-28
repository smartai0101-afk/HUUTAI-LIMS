"use client";

import { usePathname } from "next/navigation";
import { CHEM_INFO_NAV } from "@/lib/chem-info-labels";

const titles: Record<string, string> = {
  "/chem-info/periodic-table": CHEM_INFO_NAV.periodicTable,
  "/chem-info/chemicals": CHEM_INFO_NAV.chemicalLookup,
  "/chem-info/calculators": CHEM_INFO_NAV.calculators,
  "/chem-info/compatibility": CHEM_INFO_NAV.compatibility,
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/chem-info/chemicals/") && pathname !== "/chem-info/chemicals") {
    return "Chi tiết hóa chất";
  }
  const match = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? CHEM_INFO_NAV.module;
}

export function ChemInfoBreadcrumb() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  return (
    <p className="px-1 pt-2 text-sm text-slate-500 lg:px-0">
      {CHEM_INFO_NAV.module} / <span className="font-medium text-slate-700">{title}</span>
    </p>
  );
}
