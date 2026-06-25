import { expandCatalogToLotRows, exportGroupedValue, groupedCell } from "../lib/catalog-lot-rows";
import type { StockLotView } from "../types";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`OK ${label}`);
}

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

type TestItem = {
  id: string;
  code: string;
  name: string;
  lot: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  coaPath: string;
  storageLocation: string;
  notes: string;
  status: string;
  stockLots: StockLotView[];
};

function makeLot(id: string, lot: string, quantity: number, unit = "g"): StockLotView {
  return {
    id,
    lot,
    quantity,
    unit,
    expiryDate: "2027-01-01",
    afterOpenExpiry: "",
    coaPath: "",
    storageLocation: "A1",
    notes: "",
    status: "Ready",
  };
}

function testNoLots() {
  const items: TestItem[] = [
    {
      id: "m1",
      code: "STD-0001",
      name: "Test",
      lot: "L1",
      quantity: 5,
      unit: "g",
      expiryDate: "2027-01-01",
      coaPath: "",
      storageLocation: "A1",
      notes: "",
      status: "Ready",
      stockLots: [],
    },
  ];
  const rows = expandCatalogToLotRows(items);
  assertEqual("no lots → 1 row", rows.length, 1);
  assertTrue("no lots → showMasterFields", rows[0]!.showMasterFields);
  assertEqual("no lots → stockLotId null", rows[0]!.stockLotId, null);
}

function testSingleLot() {
  const items: TestItem[] = [
    {
      id: "m2",
      code: "STD-0002",
      name: "Benzoic",
      lot: "Nhiều lot",
      quantity: 8,
      unit: "g",
      expiryDate: "2026-09-12",
      coaPath: "",
      storageLocation: "C2",
      notes: "",
      status: "Ready",
      stockLots: [makeLot("sl1", "BEN-2304", 5)],
    },
  ];
  const rows = expandCatalogToLotRows(items);
  assertEqual("1 lot → 1 row", rows.length, 1);
  assertEqual("1 lot → lot from StockLot", rows[0]!.lot, "BEN-2304");
  assertEqual("1 lot → quantity from StockLot", rows[0]!.quantity, 5);
  assertTrue("1 lot → showMasterFields", rows[0]!.showMasterFields);
}

function testMultiLot() {
  const items: TestItem[] = [
    {
      id: "m3",
      code: "STD-0002",
      name: "Benzoic Acid CRM",
      lot: "Nhiều lot",
      quantity: 8,
      unit: "g",
      expiryDate: "2026-09-12",
      coaPath: "",
      storageLocation: "C2-05",
      notes: "",
      status: "Ready",
      stockLots: [makeLot("sl1", "BEN-2304", 5), makeLot("sl2", "H2354", 3)],
    },
  ];
  const rows = expandCatalogToLotRows(items);
  assertEqual("2 lots → 2 rows", rows.length, 2);
  assertTrue("row 1 showMasterFields", rows[0]!.showMasterFields);
  assertEqual("row 1 lot", rows[0]!.lot, "BEN-2304");
  assertEqual("row 2 hide master", rows[1]!.showMasterFields, false);
  assertEqual("row 2 lot", rows[1]!.lot, "H2354");
  assertEqual("row 2 quantity", rows[1]!.quantity, 3);

  assertEqual("groupedCell hides code on row 2", groupedCell(rows[1]!.showMasterFields, "STD-0002"), "");
  assertEqual("groupedCell shows code on row 1", groupedCell(rows[0]!.showMasterFields, "STD-0002"), "STD-0002");
  assertEqual("exportGroupedValue row 2", exportGroupedValue(rows[1]!.showMasterFields, "STD-0002"), "");
  assertEqual("exportGroupedValue row 1", exportGroupedValue(rows[0]!.showMasterFields, "STD-0002"), "STD-0002");
}

function main() {
  testNoLots();
  testSingleLot();
  testMultiLot();
  console.log("ALL CATALOG LOT ROW TESTS PASSED");
}

main();
