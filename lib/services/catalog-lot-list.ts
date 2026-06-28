import type { Prisma, StandardExpiryStatus } from "@prisma/client";
import { applyShowMasterFieldsToCatalogRows, type CatalogLotRowMeta } from "@/lib/catalog-lot-rows";
import { db } from "@/lib/db";
import {
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortOrder,
} from "@/lib/list-query";
import { mapChemical, mapMicrobialStrain, mapStandard } from "@/lib/mappers";
import { mapStockLot } from "@/lib/map-stock-lot";
import type { ChemicalView, MicrobialStrainView, StandardView } from "@/types";

export type CatalogSource = "chemical" | "standard" | "strain";

export const CATALOG_SORT_ALLOWLIST = [
  "code",
  "name",
  "group",
  "manufacturer",
  "casNumber",
  "lot",
  "quantity",
  "expiryDate",
  "status",
] as const;

export type CatalogSortKey = (typeof CATALOG_SORT_ALLOWLIST)[number];

export type CatalogListParams = ListQueryParams & {
  group: string;
  status: string;
};

export function parseCatalogListParams(searchParams: SearchParamsInput): CatalogListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "code", sortOrder: "asc" },
    CATALOG_SORT_ALLOWLIST,
  );
  const first = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    ...base,
    group: first("group")?.trim() || "All",
    status: first("status")?.trim() || "All",
  };
}

function statusLabelToEnum(label: string): StandardExpiryStatus | null {
  if (label === "Expiring Soon") return "ExpiringSoon";
  if (label === "Ready" || label === "Expired") return label;
  return null;
}

function compareValues(a: string | number, b: string | number, order: SortOrder): number {
  if (typeof a === "number" && typeof b === "number") {
    return order === "asc" ? a - b : b - a;
  }
  const cmp = String(a).localeCompare(String(b), "vi");
  return order === "asc" ? cmp : -cmp;
}

type SortableCatalogRow = {
  id: string;
  code: string;
  name: string;
  group: string;
  manufacturer: string;
  casNumber: string;
  lot: string;
  quantity: number;
  expiryDate: string;
  status: string;
};

function mergeSortedRows<T extends SortableCatalogRow>(
  left: T[],
  right: T[],
  sortBy: string,
  sortOrder: SortOrder,
): T[] {
  const rowSortValue = (row: SortableCatalogRow, key: string): string | number => {
    switch (key) {
      case "name":
        return row.name;
      case "group":
        return row.group;
      case "manufacturer":
        return row.manufacturer;
      case "casNumber":
        return row.casNumber;
      case "lot":
        return row.lot;
      case "quantity":
        return row.quantity;
      case "expiryDate":
        return row.expiryDate;
      case "status":
        return row.status;
      case "code":
      default:
        return row.code;
    }
  };

  const merged: T[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const cmp = compareValues(
      rowSortValue(left[i]!, sortBy),
      rowSortValue(right[j]!, sortBy),
      sortOrder,
    );
    if (cmp <= 0) merged.push(left[i]!);
    else merged.push(right[j]!);
    if (cmp <= 0) i++;
    else j++;
  }
  while (i < left.length) merged.push(left[i++]!);
  while (j < right.length) merged.push(right[j++]!);
  return merged;
}

function buildTextSearchOr(fields: string[], q: string): { OR: Record<string, { contains: string }>[] } {
  return {
    OR: fields.map((field) => ({ [field]: { contains: q } })),
  };
}

function chemicalLotOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.StockLotOrderByWithRelationInput[] {
  const dir = sortOrder;
  const tie = [{ chemical: { code: "asc" as const } }, { lot: "asc" as const }];
  switch (sortBy) {
    case "name":
      return [{ chemical: { name: dir } }, ...tie];
    case "group":
      return [{ chemical: { chemicalGroup: dir } }, ...tie];
    case "manufacturer":
      return [{ chemical: { manufacturer: dir } }, ...tie];
    case "casNumber":
      return [{ chemical: { casNumber: dir } }, ...tie];
    case "lot":
      return [{ lot: dir }, { chemical: { code: "asc" } }];
    case "quantity":
      return [{ quantity: dir }, ...tie];
    case "expiryDate":
      return [{ expiryDate: dir }, ...tie];
    case "status":
      return [{ status: dir }, ...tie];
    case "code":
    default:
      return [{ chemical: { code: dir } }, { lot: "asc" }];
  }
}

function chemicalMasterOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.ChemicalOrderByWithRelationInput[] {
  const dir = sortOrder;
  switch (sortBy) {
    case "name":
      return [{ name: dir }];
    case "group":
      return [{ chemicalGroup: dir }];
    case "manufacturer":
      return [{ manufacturer: dir }];
    case "casNumber":
      return [{ casNumber: dir }];
    case "lot":
      return [{ lot: dir }];
    case "quantity":
      return [{ quantity: dir }];
    case "expiryDate":
      return [{ expiryDate: dir }];
    case "status":
      return [{ status: dir }];
    case "code":
    default:
      return [{ code: dir }];
  }
}

function buildChemicalLotWhere(params: CatalogListParams): Prisma.StockLotWhereInput {
  const and: Prisma.StockLotWhereInput[] = [{ chemicalId: { not: null } }];
  if (params.q) {
    and.push({
      OR: [
        { lot: { contains: params.q } },
        { storageLocation: { contains: params.q } },
        { notes: { contains: params.q } },
        { chemical: buildTextSearchOr(["code", "name", "chemicalGroup", "manufacturer", "casNumber", "productCode", "storageCondition", "notes"], params.q) },
      ],
    });
  }
  if (params.group !== "All") {
    and.push({ chemical: { chemicalGroup: params.group } });
  }
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

function buildChemicalOrphanWhere(params: CatalogListParams): Prisma.ChemicalWhereInput {
  const and: Prisma.ChemicalWhereInput[] = [{ stockLots: { none: {} } }];
  if (params.q) {
    and.push(
      buildTextSearchOr(
        ["code", "name", "chemicalGroup", "manufacturer", "casNumber", "productCode", "lot", "storageLocation", "storageCondition", "notes"],
        params.q,
      ),
    );
  }
  if (params.group !== "All") and.push({ chemicalGroup: params.group });
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

function mapChemicalLotRow(
  lot: Parameters<typeof mapStockLot>[0] & { id: string },
  master: ReturnType<typeof mapChemical> & { stockLots: never[] },
): ChemicalView & CatalogLotRowMeta {
  const lotView = mapStockLot(lot);
  return {
    ...master,
    ...lotView,
    lot: lotView.lot,
    quantity: lotView.quantity,
    unit: lotView.unit,
    purity: lotView.purity || master.purity,
    uncertainty: lotView.uncertainty || master.uncertainty,
    expiryDate: lotView.expiryDate || master.expiryDate,
    coaPath: lotView.coaPath || master.coaPath,
    storageLocation: lotView.storageLocation || master.storageLocation,
    notes: lotView.notes || master.notes,
    status: lotView.status || master.status,
    stockLots: [lotView],
    rowKey: `${master.id}:${lot.id}`,
    showMasterFields: true,
    stockLotId: lot.id,
  };
}

function mapChemicalOrphanRow(master: ReturnType<typeof mapChemical>): ChemicalView & CatalogLotRowMeta {
  return {
    ...master,
    stockLots: [],
    rowKey: master.id,
    showMasterFields: true,
    stockLotId: null,
  };
}

async function listChemicalLotRows(params: CatalogListParams): Promise<(ChemicalView & CatalogLotRowMeta)[]> {
  const lotWhere = buildChemicalLotWhere(params);
  const orphanWhere = buildChemicalOrphanWhere(params);
  const lotOrderBy = chemicalLotOrderBy(params.sortBy, params.sortOrder);
  const masterOrderBy = chemicalMasterOrderBy(params.sortBy, params.sortOrder);

  const [lots, orphans] = await Promise.all([
    db.stockLot.findMany({
      where: lotWhere,
      include: { chemical: true },
      orderBy: lotOrderBy,
    }),
    db.chemical.findMany({ where: orphanWhere, orderBy: masterOrderBy }),
  ]);

  const lotRows = lots
    .filter((l) => l.chemical)
    .map((l) => {
      const mapped = mapChemicalLotRow(l, { ...mapChemical(l.chemical!), stockLots: [] });
      return { ...mapped, group: mapped.chemicalGroup, casNumber: mapped.casNumber };
    });

  const orphanRows = orphans.map((m) => {
    const mapped = mapChemicalOrphanRow(mapChemical(m));
    return { ...mapped, group: mapped.chemicalGroup, casNumber: mapped.casNumber };
  });

  return applyShowMasterFieldsToCatalogRows(
    mergeSortedRows(
      lotRows as Array<SortableCatalogRow & (ChemicalView & CatalogLotRowMeta)>,
      orphanRows as Array<SortableCatalogRow & (ChemicalView & CatalogLotRowMeta)>,
      params.sortBy,
      params.sortOrder,
    ),
  );
}

// --- Standard (mirror chemical) ---

function standardLotOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.StockLotOrderByWithRelationInput[] {
  const dir = sortOrder;
  const tie = [{ standard: { code: "asc" as const } }, { lot: "asc" as const }];
  switch (sortBy) {
    case "name":
      return [{ standard: { name: dir } }, ...tie];
    case "group":
      return [{ standard: { standardGroup: dir } }, ...tie];
    case "manufacturer":
      return [{ standard: { manufacturer: dir } }, ...tie];
    case "casNumber":
      return [{ standard: { casNumber: dir } }, ...tie];
    case "lot":
      return [{ lot: dir }, { standard: { code: "asc" } }];
    case "quantity":
      return [{ quantity: dir }, ...tie];
    case "expiryDate":
      return [{ expiryDate: dir }, ...tie];
    case "status":
      return [{ status: dir }, ...tie];
    default:
      return [{ standard: { code: dir } }, { lot: "asc" }];
  }
}

function standardMasterOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.StandardOrderByWithRelationInput[] {
  const dir = sortOrder;
  switch (sortBy) {
    case "name":
      return [{ name: dir }];
    case "group":
      return [{ standardGroup: dir }];
    case "manufacturer":
      return [{ manufacturer: dir }];
    case "casNumber":
      return [{ casNumber: dir }];
    case "lot":
      return [{ lot: dir }];
    case "quantity":
      return [{ quantity: dir }];
    case "expiryDate":
      return [{ expiryDate: dir }];
    case "status":
      return [{ status: dir }];
    default:
      return [{ code: dir }];
  }
}

function buildStandardLotWhere(params: CatalogListParams): Prisma.StockLotWhereInput {
  const and: Prisma.StockLotWhereInput[] = [{ standardId: { not: null } }];
  if (params.q) {
    and.push({
      OR: [
        { lot: { contains: params.q } },
        { standard: buildTextSearchOr(["code", "name", "standardGroup", "manufacturer", "casNumber", "productCode", "notes"], params.q) },
      ],
    });
  }
  if (params.group !== "All") and.push({ standard: { standardGroup: params.group } });
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

function buildStandardOrphanWhere(params: CatalogListParams): Prisma.StandardWhereInput {
  const and: Prisma.StandardWhereInput[] = [{ stockLots: { none: {} } }];
  if (params.q) {
    and.push(
      buildTextSearchOr(["code", "name", "standardGroup", "manufacturer", "casNumber", "productCode", "lot", "notes"], params.q),
    );
  }
  if (params.group !== "All") and.push({ standardGroup: params.group });
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

function mapStandardLotRow(
  lot: Parameters<typeof mapStockLot>[0] & { id: string },
  master: ReturnType<typeof mapStandard> & { stockLots: never[] },
): StandardView & CatalogLotRowMeta {
  const lotView = mapStockLot(lot);
  return {
    ...master,
    ...lotView,
    lot: lotView.lot,
    quantity: lotView.quantity,
    unit: lotView.unit,
    purity: lotView.purity || master.purity,
    uncertainty: lotView.uncertainty || master.uncertainty,
    expiryDate: lotView.expiryDate || master.expiryDate,
    afterOpenExpiry: lotView.afterOpenExpiry || master.afterOpenExpiry,
    coaPath: lotView.coaPath || master.coaPath,
    storageLocation: lotView.storageLocation || master.storageLocation,
    notes: lotView.notes || master.notes,
    status: lotView.status || master.status,
    stockLots: [lotView],
    rowKey: `${master.id}:${lot.id}`,
    showMasterFields: true,
    stockLotId: lot.id,
  };
}

async function listStandardLotRows(params: CatalogListParams): Promise<(StandardView & CatalogLotRowMeta)[]> {
  const [lots, orphans] = await Promise.all([
    db.stockLot.findMany({
      where: buildStandardLotWhere(params),
      include: { standard: true },
      orderBy: standardLotOrderBy(params.sortBy, params.sortOrder),
    }),
    db.standard.findMany({
      where: buildStandardOrphanWhere(params),
      orderBy: standardMasterOrderBy(params.sortBy, params.sortOrder),
    }),
  ]);

  const lotRows = lots
    .filter((l) => l.standard)
    .map((l) => {
      const master = mapStandard({ ...l.standard!, containers: [] });
      const mapped = mapStandardLotRow(l, { ...master, stockLots: [] });
      return { ...mapped, group: mapped.standardGroup, casNumber: mapped.casNumber };
    });
  const orphanRows = orphans.map((m) => {
    const mapped = {
      ...mapStandard({ ...m, containers: [] }),
      stockLots: [],
      rowKey: m.id,
      showMasterFields: true,
      stockLotId: null,
    };
    return { ...mapped, group: mapped.standardGroup, casNumber: mapped.casNumber };
  });

  return applyShowMasterFieldsToCatalogRows(
    mergeSortedRows(
      lotRows as Array<SortableCatalogRow & (StandardView & CatalogLotRowMeta)>,
      orphanRows as Array<SortableCatalogRow & (StandardView & CatalogLotRowMeta)>,
      params.sortBy,
      params.sortOrder,
    ),
  );
}

// --- Strain ---

function strainLotOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.StockLotOrderByWithRelationInput[] {
  const dir = sortOrder;
  const tie = [{ microbialStrain: { code: "asc" as const } }, { lot: "asc" as const }];
  switch (sortBy) {
    case "name":
      return [{ microbialStrain: { name: dir } }, ...tie];
    case "group":
      return [{ microbialStrain: { strainGroup: dir } }, ...tie];
    case "manufacturer":
      return [{ microbialStrain: { manufacturer: dir } }, ...tie];
    case "casNumber":
      return [{ microbialStrain: { atccProductCode: dir } }, ...tie];
    case "lot":
      return [{ lot: dir }, { microbialStrain: { code: "asc" } }];
    case "quantity":
      return [{ quantity: dir }, ...tie];
    case "expiryDate":
      return [{ expiryDate: dir }, ...tie];
    case "status":
      return [{ status: dir }, ...tie];
    default:
      return [{ microbialStrain: { code: dir } }, { lot: "asc" }];
  }
}

function strainMasterOrderBy(sortBy: string, sortOrder: SortOrder): Prisma.MicrobialStrainOrderByWithRelationInput[] {
  const dir = sortOrder;
  switch (sortBy) {
    case "name":
      return [{ name: dir }];
    case "group":
      return [{ strainGroup: dir }];
    case "manufacturer":
      return [{ manufacturer: dir }];
    case "casNumber":
      return [{ atccProductCode: dir }];
    case "lot":
      return [{ lot: dir }];
    case "quantity":
      return [{ quantity: dir }];
    case "expiryDate":
      return [{ expiryDate: dir }];
    case "status":
      return [{ status: dir }];
    default:
      return [{ code: dir }];
  }
}

function buildStrainLotWhere(params: CatalogListParams): Prisma.StockLotWhereInput {
  const and: Prisma.StockLotWhereInput[] = [{ microbialStrainId: { not: null } }];
  if (params.q) {
    and.push({
      OR: [
        { lot: { contains: params.q } },
        {
          microbialStrain: buildTextSearchOr(
            ["code", "name", "strainGroup", "manufacturer", "atccProductCode", "speciesStrain", "notes"],
            params.q,
          ),
        },
      ],
    });
  }
  if (params.group !== "All") and.push({ microbialStrain: { strainGroup: params.group } });
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

function buildStrainOrphanWhere(params: CatalogListParams): Prisma.MicrobialStrainWhereInput {
  const and: Prisma.MicrobialStrainWhereInput[] = [{ stockLots: { none: {} } }];
  if (params.q) {
    and.push(
      buildTextSearchOr(
        ["code", "name", "strainGroup", "manufacturer", "atccProductCode", "lot", "speciesStrain", "notes"],
        params.q,
      ),
    );
  }
  if (params.group !== "All") and.push({ strainGroup: params.group });
  if (params.status !== "All") {
    const statusEnum = statusLabelToEnum(params.status);
    if (statusEnum) and.push({ status: statusEnum });
  }
  return { AND: and };
}

async function listStrainLotRows(params: CatalogListParams): Promise<(MicrobialStrainView & CatalogLotRowMeta)[]> {
  const [lots, orphans] = await Promise.all([
    db.stockLot.findMany({
      where: buildStrainLotWhere(params),
      include: { microbialStrain: true },
      orderBy: strainLotOrderBy(params.sortBy, params.sortOrder),
    }),
    db.microbialStrain.findMany({
      where: buildStrainOrphanWhere(params),
      orderBy: strainMasterOrderBy(params.sortBy, params.sortOrder),
    }),
  ]);

  const lotRows = lots
    .filter((l) => l.microbialStrain)
    .map((l) => {
      const master = mapMicrobialStrain(l.microbialStrain!);
      const lotView = mapStockLot(l);
      const mapped = {
        ...master,
        ...lotView,
        stockLots: [lotView],
        rowKey: `${master.id}:${l.id}`,
        showMasterFields: true,
        stockLotId: l.id,
      };
      return { ...mapped, group: mapped.strainGroup, casNumber: mapped.atccProductCode };
    });

  const orphanRows = orphans.map((m) => {
    const mapped = {
      ...mapMicrobialStrain(m),
      stockLots: [],
      rowKey: m.id,
      showMasterFields: true,
      stockLotId: null,
    };
    return { ...mapped, group: mapped.strainGroup, casNumber: mapped.atccProductCode };
  });

  return applyShowMasterFieldsToCatalogRows(
    mergeSortedRows(
      lotRows as Array<SortableCatalogRow & (MicrobialStrainView & CatalogLotRowMeta)>,
      orphanRows as Array<SortableCatalogRow & (MicrobialStrainView & CatalogLotRowMeta)>,
      params.sortBy,
      params.sortOrder,
    ),
  );
}

export async function listCatalogLotRows<T extends CatalogSource>(
  source: T,
  params: CatalogListParams,
): Promise<PaginatedResult<
  T extends "chemical"
    ? ChemicalView & CatalogLotRowMeta
    : T extends "standard"
      ? StandardView & CatalogLotRowMeta
      : MicrobialStrainView & CatalogLotRowMeta
>> {
  let items;
  if (source === "chemical") items = await listChemicalLotRows(params);
  else if (source === "standard") items = await listStandardLotRows(params);
  else items = await listStrainLotRows(params);

  return {
    items: items as never,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}
