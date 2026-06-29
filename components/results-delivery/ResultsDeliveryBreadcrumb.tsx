"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESULTS_DELIVERY_NAV } from "@/lib/result-delivery-labels";
import { cn } from "@/lib/utils";

const CRUMBS: { href: string; label: string }[] = [
  { href: "/results-delivery/pending", label: RESULTS_DELIVERY_NAV.pending },
  { href: "/results-delivery/reports", label: RESULTS_DELIVERY_NAV.reports },
  { href: "/results-delivery/history", label: RESULTS_DELIVERY_NAV.history },
  { href: "/results-delivery/issued", label: RESULTS_DELIVERY_NAV.issued },
];

export function ResultsDeliveryBreadcrumb() {
  const pathname = usePathname();
  const current = CRUMBS.find((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));

  return (
    <nav className="mb-4 text-sm text-slate-500">
      <Link href="/results-delivery/pending" className="hover:text-slate-800">
        {RESULTS_DELIVERY_NAV.group}
      </Link>
      {current ? (
        <>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{current.label}</span>
        </>
      ) : null}
    </nav>
  );
}
