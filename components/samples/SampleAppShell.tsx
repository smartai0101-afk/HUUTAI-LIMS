"use client";

import { AppShell } from "@/components/AppShell";
import { SampleBreadcrumb } from "@/components/samples/SampleBreadcrumb";

export function SampleAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SampleBreadcrumb />
      {children}
    </AppShell>
  );
}
