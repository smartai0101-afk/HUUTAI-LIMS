import { notFound } from "next/navigation";
import { ChemicalReferenceDetailClient } from "@/components/chem-info/ChemicalReferenceDetailClient";
import { getChemicalReferenceById } from "@/lib/services/chem-info/chemical-references";
import { findInventoryChemicalsByCas } from "@/lib/services/chem-info/inventory-link";

export const dynamic = "force-dynamic";

export default async function ChemicalReferenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reference = await getChemicalReferenceById(id);
  if (!reference) notFound();
  const inventoryLinks = await findInventoryChemicalsByCas(reference.casNumber);
  return (
    <ChemicalReferenceDetailClient reference={reference} inventoryLinks={inventoryLinks} />
  );
}
