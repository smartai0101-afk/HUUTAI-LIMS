/**
 * QA: standards Excel import round-trip (export rows → parse → import → preview duplicates).
 * Run: npx tsx scripts/test-standards-import-qa.ts
 */
import { expandCatalogToLotRows } from "@/lib/catalog-lot-rows";
import {
  buildCatalogExportRows,
  CATALOG_EXCEL,
} from "@/lib/catalog-excel";
import { importCatalogLotRows, previewCatalogImport } from "@/lib/catalog-import";
import { exportToXlsxBuffer, parseXlsx } from "@/lib/excel";
import { getStandards } from "@/lib/services/standards";
import { STANDARD_IMPORT_COLUMN_MAP } from "@/lib/standards-fields";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("=== Standards import round-trip QA ===\n");

  const standards = await getStandards();
  const displayRows = expandCatalogToLotRows(standards);
  assert(displayRows.length > 0, `seed has ${displayRows.length} lot row(s)`);

  const cfg = CATALOG_EXCEL.standard;
  const exportRows = buildCatalogExportRows(displayRows, cfg.fieldKeys, cfg.masterKeys);
  const buffer = exportToXlsxBuffer(exportRows, [...cfg.columns]);
  const parsed = parseXlsx(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), STANDARD_IMPORT_COLUMN_MAP);
  assert(!parsed.error, "parse exported xlsx");
  assert(parsed.rows.length > 0, `parsed ${parsed.rows.length} row(s)`);

  // 1) Round-trip re-import (existing lots) — should skip without error spam / identity mismatch
  const reimport = await importCatalogLotRows({
    kind: "standard",
    rows: parsed.rows,
    user: "QA",
    mergeDuplicates: false,
  });
  const reimportErr = reimport.error ?? "";
  const reimportSkipMsgs = (reimport.errors ?? []).join("; ");
  assert(
    !reimportErr.includes("Mã vật tư đã tồn tại") &&
      !reimportSkipMsgs.includes("Mã vật tư đã tồn tại"),
    "no stale 'Mã vật tư đã tồn tại' error",
  );
  assert(
    (reimport.count ?? 0) === 0,
    `re-import skips existing lots (count=0, got ${reimport.count}, err=${reimportErr.slice(0, 80)})`,
  );
  assert(
    reimportErr.includes("đã tồn tại") || reimportSkipMsgs.includes("đã tồn tại"),
    "skip messages mention existing lots",
  );

  // 2) Preview should detect DB duplicates
  const preview = await previewCatalogImport({ kind: "standard", rows: parsed.rows });
  assert(!!preview.duplicates?.length, `preview finds ${preview.duplicates?.length ?? 0} duplicate lot(s) in DB`);

  // 3) Merge duplicates should succeed
  const merged = await importCatalogLotRows({
    kind: "standard",
    rows: parsed.rows,
    user: "QA",
    mergeDuplicates: true,
  });
  assert((merged.count ?? 0) > 0, `merge import count=${merged.count}`);

  // 4) Identity mismatch — change name on first row
  const tampered = parsed.rows.map((r, i) =>
    i === 0 ? { ...r, name: `${r.name} TAMPERED` } : r,
  );
  const mismatch = await importCatalogLotRows({
    kind: "standard",
    rows: tampered,
    user: "QA",
    mergeDuplicates: false,
  });
  const errText = mismatch.error ?? (mismatch.errors ?? []).join("; ");
  assert(
    errText.includes("đã tồn tại") || errText.includes("không khớp"),
    `identity mismatch message: ${errText.slice(0, 120)}`,
  );

  // 5) New lot on existing master
  const first = parsed.rows[0]!;
  const newLot = `${first.lot}-QA-${Date.now()}`;
  const newRow = { ...first, lot: newLot, quantity: "1" };
  const added = await importCatalogLotRows({
    kind: "standard",
    rows: [newRow],
    user: "QA",
  });
  assert((added.count ?? 0) === 1, `new lot import count=${added.count}`);

  console.log("\n=== All standards import QA passed ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
