import assert from "node:assert/strict";
import {
  buildSyncStatusWhere,
  listChemicalReferences,
  parseChemicalReferenceListParams,
  SYNC_STATUS_FILTER_VALUES,
} from "./chemical-references";

async function main() {
  for (const status of SYNC_STATUS_FILTER_VALUES) {
    const params = parseChemicalReferenceListParams({ syncStatus: status });
    assert.equal(params.syncStatus, status, `parse accepts ${status}`);
    assert.deepEqual(buildSyncStatusWhere(status), { syncStatus: status });
  }

  assert.equal(parseChemicalReferenceListParams({ syncStatus: "invalid" }).syncStatus, "all");
  assert.equal(parseChemicalReferenceListParams({ syncStatus: "dataStatus" }).syncStatus, "all");
  assert.equal(parseChemicalReferenceListParams({}).syncStatus, "all");

  const base = {
    q: "",
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    page: 1,
    limit: 25,
    sortActive: false,
    searchMode: "all" as const,
  };

  const all = await listChemicalReferences({ ...base, syncStatus: "all" });
  assert.ok(all.total >= 0, "all filter does not crash");

  const local = await listChemicalReferences({ ...base, syncStatus: "local" });
  assert.ok(local.total >= 0, "local filter does not crash");

  const synced = await listChemicalReferences({ ...base, syncStatus: "synced" });
  assert.ok(synced.total >= 0, "synced filter does not crash");

  const sorted = await listChemicalReferences({
    ...base,
    syncStatus: "all",
    sortBy: "lastSyncedAt",
    sortOrder: "desc",
    sortActive: true,
  });
  assert.ok(sorted.items.length >= 0, "lastSyncedAt sort does not crash");

  const search = await listChemicalReferences({ ...base, q: "car", syncStatus: "all" });
  assert.ok(search.total >= 0, "search car does not crash");

  console.log("chemical-references-filter.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
