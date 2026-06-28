import { Suspense } from "react";
import { InventoryLedgerClient } from "@/components/inventory-ledger/InventoryLedgerClient";
import { listInventoryLedger, parseInventoryLedgerParams } from "@/lib/services/inventory-ledger";

export default async function InventoryLedgerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseInventoryLedgerParams(params);
  const result = await listInventoryLedger(listQuery);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <InventoryLedgerClient result={result} listQuery={listQuery} />
    </Suspense>
  );
}
