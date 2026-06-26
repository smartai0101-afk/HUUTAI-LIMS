"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { fetchCatalogPreparedDerivatives } from "@/lib/actions/preparation-workflow";
import type {
  CatalogSourceKind,
  PreparedDerivativeView,
} from "@/lib/services/preparation-traceability";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";

type Props = {
  catalogKind: CatalogSourceKind;
  catalogId: string;
};

export function CatalogPreparedDerivatives({ catalogKind, catalogId }: Props) {
  const [derivatives, setDerivatives] = useState<PreparedDerivativeView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fd = new FormData();
    fd.set("catalogKind", catalogKind);
    fd.set("catalogId", catalogId);
    startTransition(async () => {
      const result = await fetchCatalogPreparedDerivatives(fd);
      if ("derivatives" in result && result.derivatives) {
        setDerivatives(result.derivatives);
      }
      setLoaded(true);
    });
  }, [catalogKind, catalogId]);

  if (!loaded || pending) {
    return (
      <div className="sm:col-span-2">
        <p className="text-xs text-slate-500">Bản ghi pha chế phát sinh</p>
        <p className="mt-1 text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }
  if (!derivatives.length) {
    return null;
  }

  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-xs font-medium text-slate-500">Bản ghi pha chế phát sinh</p>
      <div className="space-y-2 rounded-xl border border-slate-200 p-3">
        {derivatives.map((d) => (
          <div
            key={`${d.preparationType}:${d.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0"
          >
            <div>
              <Link href={d.href} className="font-medium text-sky-700 hover:underline">
                {d.code}
              </Link>
              <span className="text-slate-600"> · {d.name}</span>
              <p className="text-xs text-slate-500">
                {d.role}
                {d.quantityUsed != null && d.unit ? ` · ${d.quantityUsed} ${d.unit}` : ""}
              </p>
            </div>
            <WorkflowStatusBadge status={d.workflowStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
