"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SampleBreadcrumb } from "@/components/samples/SampleBreadcrumb";

export function SampleAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullWidth = pathname?.startsWith("/samples/requests/") ?? false;

  return (
    <AppShell fullWidth={fullWidth}>
      <SampleBreadcrumb />
      {children}
    </AppShell>
  );
}
