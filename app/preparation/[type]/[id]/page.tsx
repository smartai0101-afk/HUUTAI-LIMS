import { notFound } from "next/navigation";
import { PreparationDetailClient } from "@/components/preparation/PreparationDetailClient";
import {
  getPreparationSummary,
  parsePreparationTypeSlug,
} from "@/lib/services/preparation-traceability";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ type: string; id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { type: typeSlug, id } = await params;
  const preparationType = parsePreparationTypeSlug(typeSlug);
  if (!preparationType) notFound();

  const summary = await getPreparationSummary(preparationType, id);
  if (!summary) notFound();

  return <PreparationDetailClient summary={summary} />;
}
