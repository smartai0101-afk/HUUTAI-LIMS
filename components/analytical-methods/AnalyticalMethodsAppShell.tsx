"use client";

import { AppShell } from "@/components/AppShell";
import { AnalyticalMethodsBreadcrumb } from "@/components/analytical-methods/AnalyticalMethodsBreadcrumb";

export function AnalyticalMethodsAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AnalyticalMethodsBreadcrumb />
      {children}
    </AppShell>
  );
}
