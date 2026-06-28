import { Suspense } from "react";
import { PeriodicTableClient } from "@/components/chem-info/PeriodicTableClient";
import { listElements } from "@/lib/services/chem-info/elements";

export const dynamic = "force-dynamic";

export default async function PeriodicTablePage() {
  const elements = await listElements();
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <PeriodicTableClient elements={elements} />
    </Suspense>
  );
}
