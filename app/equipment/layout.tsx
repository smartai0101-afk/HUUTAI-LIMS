import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";

export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return <EquipmentAppShell>{children}</EquipmentAppShell>;
}
