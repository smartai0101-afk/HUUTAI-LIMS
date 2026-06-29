import { ResultsClient } from "@/components/analysis/ResultsClient";
import { listTestResults } from "@/lib/services/analysis/test-results";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const results = await listTestResults();
  return <ResultsClient results={results} />;
}
