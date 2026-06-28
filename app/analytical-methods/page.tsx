import { Suspense } from "react";
import { MethodsDashboardClient } from "@/components/analytical-methods/MethodsDashboardClient";
import { getMethodDashboardStats } from "@/lib/services/analytical-methods/methods";

export const dynamic = "force-dynamic";

export default async function AnalyticalMethodsDashboardPage() {
  const stats = await getMethodDashboardStats();
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MethodsDashboardClient stats={stats} />
    </Suspense>
  );
}
