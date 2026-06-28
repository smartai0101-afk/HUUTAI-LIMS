import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { refreshReferenceFromPubChem } from "./chemical-reference-sync";

async function main() {
  const ethanol = await db.chemicalReference.findUnique({ where: { casNumber: "64-17-5" } });
  assert.ok(ethanol?.pubchemCid, "ethanol seed must exist");

  await db.chemicalReference.update({
    where: { id: ethanol!.id },
    data: {
      syncStatus: "manual",
      name: "Manual Ethanol Label",
      notes: "Do not overwrite",
    },
  });

  await refreshReferenceFromPubChem(ethanol!.id, {
    performedBy: "manual-guard-test",
    force: false,
  });

  const after = await db.chemicalReference.findUnique({ where: { id: ethanol!.id } });
  assert.equal(after?.name, "Manual Ethanol Label", "manual name preserved");
  assert.equal(after?.syncStatus, "manual", "manual status preserved");
  assert.ok(after?.pubchemCid, "pubchem cid still present");

  await db.chemicalReference.update({
    where: { id: ethanol!.id },
    data: {
      syncStatus: "local",
      name: "Ethanol",
      notes: "",
    },
  });

  console.log("manual-guard.test.ts: passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
