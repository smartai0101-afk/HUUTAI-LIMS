import { canTransitionMethodStatus, METHOD_STATUS_TRANSITIONS } from "@/lib/services/analytical-methods/method-approval";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(canTransitionMethodStatus("Draft", "Review"), "Draft -> Review");
assert(canTransitionMethodStatus("Review", "Approved"), "Review -> Approved");
assert(!canTransitionMethodStatus("Draft", "Approved"), "Draft -> Approved blocked");
assert(METHOD_STATUS_TRANSITIONS.Approved.includes("Obsolete"), "Approved -> Obsolete");

console.log("test-method-approval.ts OK");
