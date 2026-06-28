import { ChemInfoAppShell } from "@/components/chem-info/ChemInfoAppShell";

export default function ChemInfoLayout({ children }: { children: React.ReactNode }) {
  return <ChemInfoAppShell>{children}</ChemInfoAppShell>;
}
