"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResultsDeliveryBreadcrumb } from "@/components/results-delivery/ResultsDeliveryBreadcrumb";

export function ResultsDeliveryAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.endsWith("/print")) {
    return <>{children}</>;
  }

  return (
    <AppShell>
      <ResultsDeliveryBreadcrumb />
      {children}
    </AppShell>
  );
}
