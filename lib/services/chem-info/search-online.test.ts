import assert from "node:assert/strict";
import { handlePubChemOnlineSearch } from "./pubchem-search-handler";

const CASES = [
  { label: "ethanol", query: "ethanol", expectCid: 702 },
  { label: "acetone", query: "acetone", expectCid: 180 },
  { label: "benzene", query: "benzene", expectCid: 241 },
  { label: "caffeine", query: "caffeine", expectCid: 2519 },
  { label: "cas ethanol", query: "64-17-5", expectCid: 702 },
];

async function main() {
  console.log("PubChem online search test...");

  for (const item of CASES) {
    const result = await handlePubChemOnlineSearch({
      query: item.query,
      mode: "all",
      limit: 20,
      performedBy: "search-online-test",
    });
    assert.equal(result.ok, true, `${item.label}: should succeed`);
    if (!result.ok) continue;
    assert.ok(result.items.length > 0, `${item.label}: expected hits`);
    assert.ok(
      result.items.some((h) => h.cid === item.expectCid),
      `${item.label}: expected CID ${item.expectCid}, got ${result.items.map((h) => h.cid).join(",")}`,
    );
    console.log(`  ok ${item.label} -> CID ${item.expectCid}`);
  }

  const notFound = await handlePubChemOnlineSearch({
    query: "zzzznonexistentcompound99999xyz",
    mode: "all",
    limit: 20,
    performedBy: "search-online-test",
  });
  assert.equal(notFound.ok, true, "not found should still ok");
  if (notFound.ok) {
    assert.equal(notFound.items.length, 0, "not found: empty items");
    assert.equal(notFound.notFound, true, "not found flag");
  }
  console.log("  ok not found query");

  const empty = await handlePubChemOnlineSearch({
    query: "   ",
    performedBy: "search-online-test",
  });
  assert.equal(empty.ok, false, "empty query should fail");
  if (!empty.ok) {
    assert.equal(empty.code, "EMPTY_QUERY");
  }
  console.log("  ok empty query validation");

  console.log("search-online test passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
