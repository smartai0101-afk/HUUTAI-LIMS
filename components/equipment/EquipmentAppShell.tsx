"use client";

import { AppShell } from "@/components/AppShell";
import { EquipmentBreadcrumb } from "@/components/equipment/EquipmentBreadcrumb";

export function EquipmentAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <EquipmentBreadcrumb />
      {children}
    </AppShell>
  );
}
