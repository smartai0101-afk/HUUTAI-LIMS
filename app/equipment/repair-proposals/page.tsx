import { Suspense } from "react";
import { RepairProposalsClient } from "@/components/equipment/RepairProposalsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import {
  generateTicketNo,
  listRepairProposals,
  parseRepairProposalListParams,
} from "@/lib/services/equipment-maintenance";

export default async function RepairProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseRepairProposalListParams(params);
  const [result, equipmentOptions, defaultTicketNo] = await Promise.all([
    listRepairProposals(query),
    getEquipmentOptions(),
    generateTicketNo(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <RepairProposalsClient
        result={result}
        equipmentOptions={equipmentOptions}
        defaultTicketNo={defaultTicketNo}
        listQuery={query}
      />
    </Suspense>
  );
}
