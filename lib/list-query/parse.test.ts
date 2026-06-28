import assert from "node:assert/strict";
import { parseListQueryParams, parseSortOrder } from "./parse";
import { nextSortParams } from "./url";

const allowlist = ["code", "name", "date"] as const;

assert.equal(parseSortOrder("asc"), "asc");
assert.equal(parseSortOrder("desc"), "desc");
assert.equal(parseSortOrder("invalid"), null);

const defaults = parseListQueryParams({}, { sortBy: "code", sortOrder: "asc" }, allowlist);
assert.equal(defaults.sortBy, "code");
assert.equal(defaults.sortOrder, "asc");
assert.equal(defaults.sortActive, false);

const active = parseListQueryParams(
  { sortBy: "name", sortOrder: "desc" },
  { sortBy: "code", sortOrder: "asc" },
  allowlist,
);
assert.equal(active.sortBy, "name");
assert.equal(active.sortOrder, "desc");
assert.equal(active.sortActive, true);

assert.deepEqual(nextSortParams("code", undefined, undefined), { sortBy: "code", sortOrder: "asc" });
assert.deepEqual(nextSortParams("code", "code", "asc"), { sortBy: "code", sortOrder: "desc" });
assert.deepEqual(nextSortParams("code", "code", "desc"), { sortBy: null, sortOrder: null });

console.log("list-query parse tests passed");
