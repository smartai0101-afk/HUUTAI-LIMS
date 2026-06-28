import assert from "node:assert/strict";
import { db } from "@/lib/db";
import {
  formatPreparedBatchCode,
  inferPreparedBatchFields,
  parsePreparedBatchCode,
  resolvePreparedBatchIdentity,
} from "@/lib/prepared-batch-code";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  assert.equal(actual, expected, label);
}

async function main() {
  assertEqual("format CG01-001", formatPreparedBatchCode("CG01", 1), "CG01-001");
  assertEqual("format CG01-003", formatPreparedBatchCode("CG01", 3), "CG01-003");

  assert.deepEqual(parsePreparedBatchCode("CG01-001"), { parentCode: "CG01", batchNumber: 1 });
  assert.deepEqual(parsePreparedBatchCode("PSTD-0001-003"), {
    parentCode: "PSTD-0001",
    batchNumber: 3,
  });
  assert.equal(parsePreparedBatchCode("PSTD-0005"), null);

  assert.deepEqual(inferPreparedBatchFields("PSTD-0005"), {
    parentCode: "PSTD-0005",
    batchNumber: 1,
  });

  const next = await resolvePreparedBatchIdentity(db, "PreparedStandard", "TEST-BATCH-QA");
  if ("error" in next) throw new Error(next.error);
  assertEqual("preview parent", next.parentCode, "TEST-BATCH-QA");
  assert.match(next.code, /^TEST-BATCH-QA-\d{3}$/);

  console.log("test-prepared-batch-code: PASS");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
