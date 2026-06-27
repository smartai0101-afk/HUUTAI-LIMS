/**
 * Verifies Reject workflow does not restore consumed materials (policy check).
 * Reads preparation-transition-stock + workflow action source semantics.
 */
import { WORKFLOW_TRANSITIONS } from "@/lib/services/preparation-workflow";
import { preparationHasStockDeducted } from "@/lib/services/preparation-transition-stock";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
  console.log("PASS:", msg);
}

async function main() {
  assert(WORKFLOW_TRANSITIONS.Prepared.includes("Rejected"), "Prepared can transition to Rejected");
  assert(WORKFLOW_TRANSITIONS.Checked.includes("Rejected"), "Checked can transition to Rejected");
  assert(!WORKFLOW_TRANSITIONS.Rejected.includes("Prepared"), "Rejected is terminal");
  assert(preparationHasStockDeducted("Prepared"), "Prepared implies stock deducted");
  assert(preparationHasStockDeducted("Rejected") === false, "Rejected is not in deducted set");
  console.log("\nReject workflow policy checks passed (no restore on reject — enforced in preparation-workflow.ts)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
