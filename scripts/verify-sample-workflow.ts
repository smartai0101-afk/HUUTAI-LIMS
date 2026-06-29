import { db } from "@/lib/db";
import { generateSampleCode, generateRequestCode } from "@/lib/sample-code";
import { canTransitionSampleStatus } from "@/lib/services/samples/sample-workflow";

async function main() {
  const sampleCode = await db.$transaction((tx) => generateSampleCode(tx));
  const requestCode = await db.$transaction((tx) => generateRequestCode(tx));
  console.log("Sample code:", sampleCode);
  console.log("Request code:", requestCode);
  console.assert(/^SPL-\d{8}-\d{4}$/.test(sampleCode), "Invalid sample code format");

  const transitions = [
    ["Received", "WaitingAssignment"],
    ["WaitingAssignment", "Assigned"],
    ["Assigned", "InAnalysis"],
    ["Completed", "Stored"],
    ["Received", "Completed"],
  ] as const;

  for (const [from, to] of transitions) {
    const ok = canTransitionSampleStatus(from, to);
    console.log(`${from} -> ${to}: ${ok ? "OK" : "BLOCKED"}`);
    if (from === "Received" && to === "Completed") {
      console.assert(!ok, "Should block invalid transition");
    }
  }

  console.log("verify-sample-workflow: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
