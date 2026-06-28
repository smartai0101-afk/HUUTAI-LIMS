"use client";

import { AppShell } from "@/components/AppShell";
import { ChemInfoBreadcrumb } from "@/components/chem-info/ChemInfoBreadcrumb";

export function ChemInfoAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ChemInfoBreadcrumb />
      {children}
    </AppShell>
  );
}
