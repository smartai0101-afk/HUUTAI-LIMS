import { formatGroupDisplay, getTraditionalGroupLabel } from "@/lib/chem-info/element-groups";
import { getBohrElectronShell } from "@/lib/chem-info/electron-shell";
import { ELEMENT_SEED, getElementApplications } from "@/lib/chem-info/elements-data";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function findBySymbol(symbol: string) {
  const row = ELEMENT_SEED.find((el) => el.symbol === symbol);
  if (!row) throw new Error(`Missing seed element: ${symbol}`);
  return row;
}

function groupDisplayForSymbol(symbol: string) {
  const row = findBySymbol(symbol);
  return formatGroupDisplay(row.group);
}

function applicationsForSymbol(symbol: string) {
  const row = findBySymbol(symbol);
  return getElementApplications(row.symbol, row.applications);
}

// Group display — main group A
assert(groupDisplayForSymbol("B") === "13 (IIIA / 3A)", `Boron group: ${groupDisplayForSymbol("B")}`);
assert(groupDisplayForSymbol("C") === "14 (IVA / 4A)", `Carbon group: ${groupDisplayForSymbol("C")}`);
assert(groupDisplayForSymbol("O") === "16 (VIA / 6A)", `Oxygen group: ${groupDisplayForSymbol("O")}`);
assert(groupDisplayForSymbol("Na") === "1 (IA / 1A)", `Sodium group: ${groupDisplayForSymbol("Na")}`);

// Group display — transition metals B
assert(groupDisplayForSymbol("Sc") === "3 (IIIB / 3B)", `Scandium group: ${groupDisplayForSymbol("Sc")}`);
assert(groupDisplayForSymbol("Ti") === "4 (IVB / 4B)", `Titanium group: ${groupDisplayForSymbol("Ti")}`);
assert(groupDisplayForSymbol("Fe") === "8 (VIIIB / 8B)", `Iron group: ${groupDisplayForSymbol("Fe")}`);
assert(groupDisplayForSymbol("Cu") === "11 (IB / 1B)", `Copper group: ${groupDisplayForSymbol("Cu")}`);
assert(groupDisplayForSymbol("Zn") === "12 (IIB / 2B)", `Zinc group: ${groupDisplayForSymbol("Zn")}`);

assert(formatGroupDisplay(null) === "—", "Null group should display em dash");

// Traditional label lookup
assert(getTraditionalGroupLabel(13) === "IIIA / 3A", "Group 13 traditional label");
assert(getTraditionalGroupLabel(8) === "VIIIB / 8B", "Group 8 traditional label");
assert(getTraditionalGroupLabel(9) === "VIIIB / 8B", "Group 9 traditional label");
assert(getTraditionalGroupLabel(null) === null, "Null group traditional label");

// Electron shells
assert(JSON.stringify(getBohrElectronShell(5)) === JSON.stringify([2, 3]), "Boron shell");
assert(JSON.stringify(getBohrElectronShell(12)) === JSON.stringify([2, 8, 2]), "Magnesium shell");
assert(getBohrElectronShell(0).length === 0, "Zero atomic number shell");

// Applications
const bApps = applicationsForSymbol("B");
assert(bApps.length >= 5, `Boron should have >=5 applications, got ${bApps.length}`);
assert(bApps.includes("Flame retardants"), "Boron should include Flame retardants");

const scApps = applicationsForSymbol("Sc");
assert(scApps.length >= 4, `Scandium should have >=4 applications, got ${scApps.length}`);

assert(applicationsForSymbol("C").length > 0, "Carbon should have applications");
assert(applicationsForSymbol("O").length > 0, "Oxygen should have applications");
assert(applicationsForSymbol("Na").length > 0, "Sodium should have applications");
assert(applicationsForSymbol("Mt").length === 0, "Meitnerium should have no applications");

console.log("element-display.test.ts: all tests passed");
