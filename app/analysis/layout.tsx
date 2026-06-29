import { AnalysisAppShell } from "@/components/analysis/AnalysisAppShell";

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return <AnalysisAppShell>{children}</AnalysisAppShell>;
}
