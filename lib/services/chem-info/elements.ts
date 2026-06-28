import { db } from "@/lib/db";
import { getElementApplications, getElementGridPosition } from "@/lib/chem-info/elements-data";
import { formatGroupDisplay, getTraditionalGroupLabel } from "@/lib/chem-info/element-groups";
import { getBohrElectronShell } from "@/lib/chem-info/electron-shell";
import type { ElementView } from "@/types/chem-info";

function parseApplications(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function mapElement(row: {
  id: string;
  symbol: string;
  name: string;
  nameVi: string;
  atomicNumber: number;
  atomicMass: number;
  group: number | null;
  period: number;
  block: string;
  classification: string;
  electronConfig: string;
  electronegativity: number | null;
  meltingPointC: number | null;
  boilingPointC: number | null;
  applications: string;
  gridRow: number;
  gridColumn: number;
}): ElementView {
  const grid =
    row.gridRow > 0 && row.gridColumn > 0
      ? { gridRow: row.gridRow, gridColumn: row.gridColumn }
      : (() => {
          const pos = getElementGridPosition(row.atomicNumber);
          return { gridRow: pos.row, gridColumn: pos.col };
        })();

  const groupIupac = row.group;
  const groupTraditional = getTraditionalGroupLabel(groupIupac);

  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    nameVi: row.nameVi,
    atomicNumber: row.atomicNumber,
    atomicMass: row.atomicMass,
    group: groupIupac,
    groupIupac,
    groupTraditional,
    groupDisplay: formatGroupDisplay(groupIupac),
    period: row.period,
    block: row.block,
    classification: row.classification,
    electronConfig: row.electronConfig,
    electronegativity: row.electronegativity,
    meltingPointC: row.meltingPointC,
    boilingPointC: row.boilingPointC,
    applications: (() => {
      const dbApps = parseApplications(row.applications ?? "[]");
      return dbApps.length > 0 ? dbApps : getElementApplications(row.symbol);
    })(),
    electronShell: getBohrElectronShell(row.atomicNumber),
    gridRow: grid.gridRow,
    gridColumn: grid.gridColumn,
  };
}

export async function listElements(q?: string): Promise<ElementView[]> {
  const rows = await db.element.findMany({ orderBy: { atomicNumber: "asc" } });
  const items = rows.map(mapElement);
  const query = q?.trim().toLowerCase();
  if (!query) return items;
  return items.filter(
    (el) =>
      el.symbol.toLowerCase().includes(query) ||
      el.name.toLowerCase().includes(query) ||
      el.nameVi.toLowerCase().includes(query) ||
      String(el.atomicNumber) === query ||
      String(el.atomicNumber).includes(query),
  );
}

export async function getElementBySymbol(symbol: string): Promise<ElementView | null> {
  const row = await db.element.findUnique({ where: { symbol } });
  return row ? mapElement(row) : null;
}

export async function getElementByAtomicNumber(atomicNumber: number): Promise<ElementView | null> {
  const row = await db.element.findUnique({ where: { atomicNumber } });
  return row ? mapElement(row) : null;
}
