"use client";

import { AppShell } from "@/components/AppShell";
import { AnalysisBreadcrumb } from "@/components/analysis/AnalysisBreadcrumb";

export function AnalysisAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AnalysisBreadcrumb />
      {children}
    </AppShell>
  );
}
