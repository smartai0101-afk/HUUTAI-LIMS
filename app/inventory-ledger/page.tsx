import { InventoryLedgerClient } from "@/components/inventory-ledger/InventoryLedgerClient";
import { getInventoryLedgerRows } from "@/lib/services/inventory-ledger";

export default async function InventoryLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ preparationId?: string }>;
}) {
  const params = await searchParams;
  const rows = await getInventoryLedgerRows(300);
  return <InventoryLedgerClient rows={rows} initialPreparationId={params.preparationId ?? ""} />;
}
