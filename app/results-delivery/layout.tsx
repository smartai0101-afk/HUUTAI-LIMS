import { ResultsDeliveryAppShell } from "@/components/results-delivery/ResultsDeliveryAppShell";

export default function ResultsDeliveryLayout({ children }: { children: React.ReactNode }) {
  return <ResultsDeliveryAppShell>{children}</ResultsDeliveryAppShell>;
}
