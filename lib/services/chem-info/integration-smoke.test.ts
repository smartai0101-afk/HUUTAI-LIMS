import assert from "node:assert/strict";
import { searchPubChem, fetchPubChemCompound, mapPubChemToReference } from "./pubchem";
import { findExistingReference, upsertFromPubChem } from "./chemical-reference-sync";
import { db } from "@/lib/db";

const COMMON = [
  { label: "ethanol", query: "64-17-5", mode: "cas" as const },
  { label: "acetone", query: "67-64-1", mode: "cas" as const },
  { label: "sodium chloride", query: "7647-14-5", mode: "cas" as const },
  { label: "sulfuric acid", query: "7664-93-9", mode: "cas" as const },
  { label: "caffeine", query: "58-08-2", mode: "cas" as const },
];

async function main() {
  console.log("PubChem integration smoke test...");

  for (const item of COMMON) {
    const hits = await searchPubChem(item.query, item.mode, 5);
    assert.ok(hits.length > 0, `${item.label}: expected hits`);
    const compound = await fetchPubChemCompound(hits[0].cid);
    assert.ok(compound, `${item.label}: compound fetch`);
    const draft = mapPubChemToReference(compound!);
    assert.ok(draft.molecularFormula, `${item.label}: formula`);
    console.log(`  ok ${item.label} -> CID ${hits[0].cid}`);
  }

  const benzeneHits = await searchPubChem("71-43-2", "cas", 5);
  assert.ok(benzeneHits.length > 0, "benzene search");
  const benzeneCid = benzeneHits[0].cid;

  const existingBefore = await findExistingReference({ pubchemCid: benzeneCid });
  if (existingBefore) {
    console.log("  benzene already in DB, skipping create test");
  } else {
    const created = await upsertFromPubChem(benzeneCid, {
      performedBy: "integration-test",
      query: "71-43-2",
    });
    assert.ok(created.id, "benzene sync id");
    const dup = await upsertFromPubChem(benzeneCid, {
      performedBy: "integration-test",
      query: "71-43-2",
    });
    assert.equal(dup.id, created.id, "dedup same CID");
    assert.equal(dup.created, false, "second sync should merge not create");
    console.log("  ok benzene sync + dedup");
  }

  const manualRef = await db.chemicalReference.findFirst({ where: { syncStatus: "manual" } });
  if (manualRef) {
    const beforeName = manualRef.name;
    await db.chemicalReference.update({
      where: { id: manualRef.id },
      data: { syncStatus: "manual", name: "Manual Test Name" },
    });
    const { refreshReferenceFromPubChem } = await import("./chemical-reference-sync");
    if (manualRef.pubchemCid) {
      await refreshReferenceFromPubChem(manualRef.id, {
        performedBy: "integration-test",
        force: false,
      });
      const after = await db.chemicalReference.findUnique({ where: { id: manualRef.id } });
      assert.equal(after?.name, "Manual Test Name", "manual name preserved");
      console.log("  ok manual guard");
    }
  } else {
    console.log("  skip manual guard (no manual record)");
  }

  console.log("integration smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
