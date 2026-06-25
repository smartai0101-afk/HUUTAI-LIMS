import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { StandardsClient } from "@/components/standards/StandardsClient";
import { getStandardGroups, getStandards } from "@/lib/services/standards";

export default async function StandardsPage() {
  const [items, groupOptions] = await Promise.all([getStandards(), getStandardGroups()]);

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <StandardsClient items={items} groupOptions={groupOptions} />
    </Suspense>
  );
}
