import {
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortOrder,
} from "@/lib/list-query";
import { getChemicals } from "@/lib/services/chemicals";
import { enrichItemWithAvailable } from "@/lib/services/inventory-available-enrichment";
import { getMicrobialStrains } from "@/lib/services/microbial-strains";
import { getStandards } from "@/lib/services/standards";
import type { InventoryStatRow, InventoryStatSourceType } from "@/types";

export const INVENTORY_STATISTICS_SORT_ALLOWLIST = [
  "code",
  "name",
  "manufacturer",
  "casOrProductNumber",
  "lot",
  "purity",
  "unit",
  "quantity",
  "status",
  "notes",
  "storageLocation",
  "sourceType",
] as const;

export type InventoryStatisticsSortKey = (typeof INVENTORY_STATISTICS_SORT_ALLOWLIST)[number];

export type InventoryStatisticsListParams = ListQueryParams & {
  sourceFilter: "all" | InventoryStatSourceType;
  statusFilter: string;
  riskFilter: "All" | "expiring" | "low";
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseInventoryStatisticsListParams(
  searchParams: SearchParamsInput,
): InventoryStatisticsListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "code", sortOrder: "asc", page: 1, limit: 50 },
    INVENTORY_STATISTICS_SORT_ALLOWLIST,
  );
  const rawSource = firstParam(searchParams, "sourceFilter");
  const sourceFilter =
    rawSource === "chemical" || rawSource === "standard" || rawSource === "microbial" ? rawSource : "all";
  const statusFilter = firstParam(searchParams, "statusFilter")?.trim() || "All";
  const rawRisk = firstParam(searchParams, "riskFilter");
  const riskFilter = rawRisk === "expiring" || rawRisk === "low" ? rawRisk : "All";

  return { ...base, sourceFilter, statusFilter, riskFilter };
}

function formatCasOrProduct(casNumber: string, productCode: string): string {
  const parts = [casNumber.trim(), productCode.trim()].filter(Boolean);
  return parts.join(" / ");
}

async function buildAllInventoryStatRows(): Promise<InventoryStatRow[]> {
  const [chemicals, standards, strains] = await Promise.all([
    getChemicals(),
    getStandards(),
    getMicrobialStrains(),
  ]);

  const rows: InventoryStatRow[] = [];

  for (const item of chemicals) {
    const { quantity, stockLots } = await enrichItemWithAvailable("Chemical", item.id, item.stockLots);
    rows.push({
      id: item.id,
      sourceType: "chemical",
      sourceLabel: "Hoá chất gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: formatCasOrProduct(item.casNumber, item.productCode),
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/chemicals",
      stockLots,
    });
  }

  for (const item of standards) {
    const { quantity, stockLots } = await enrichItemWithAvailable("Standard", item.id, item.stockLots);
    rows.push({
      id: item.id,
      sourceType: "standard",
      sourceLabel: "Chất chuẩn gốc",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.productCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/standards",
      stockLots,
    });
  }

  for (const item of strains) {
    const { quantity, stockLots } = await enrichItemWithAvailable(
      "MicrobialStrain",
      item.id,
      item.stockLots,
    );
    rows.push({
      id: item.id,
      sourceType: "microbial",
      sourceLabel: "Chủng gốc vi sinh",
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      casOrProductNumber: item.atccProductCode,
      lot: item.lot,
      purity: item.purity,
      coaPath: item.coaPath,
      unit: item.unit,
      quantity,
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes,
      detailHref: "/microbial-strains",
      stockLots,
    });
  }

  return rows;
}

function matchesQuery(row: InventoryStatRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [row.code, row.name, row.manufacturer, row.casOrProductNumber, row.lot, row.notes].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function matchesRisk(row: InventoryStatRow, riskFilter: InventoryStatisticsListParams["riskFilter"]): boolean {
  if (riskFilter === "All") return true;
  const now = Date.now();
  const soon = now + 30 * 24 * 60 * 60 * 1000;
  if (riskFilter === "expiring") {
    return row.stockLots.some((lot) => {
      if (!lot.expiryDate) return false;
      const t = new Date(lot.expiryDate).getTime();
      return t >= now && t <= soon;
    });
  }
  return row.quantity <= 5;
}

function compareRows(a: InventoryStatRow, b: InventoryStatRow, sortBy: string, sortOrder: SortOrder): number {
  const dir = sortOrder === "asc" ? 1 : -1;
  const av = a[sortBy as keyof InventoryStatRow];
  const bv = b[sortBy as keyof InventoryStatRow];

  if (sortBy === "quantity") {
    return (Number(a.quantity) - Number(b.quantity)) * dir;
  }

  const as = av == null ? "" : String(av);
  const bs = bv == null ? "" : String(bv);
  return as.localeCompare(bs, "vi") * dir;
}

function filterRows(rows: InventoryStatRow[], params: InventoryStatisticsListParams): InventoryStatRow[] {
  return rows.filter((row) => {
    const matchQuery = matchesQuery(row, params.q);
    const matchSource = params.sourceFilter === "all" || row.sourceType === params.sourceFilter;
    const matchStatus = params.statusFilter === "All" || row.status === params.statusFilter;
    const matchRisk = matchesRisk(row, params.riskFilter);
    return matchQuery && matchSource && matchStatus && matchRisk;
  });
}

export async function listInventoryStatistics(
  params: InventoryStatisticsListParams,
): Promise<PaginatedResult<InventoryStatRow>> {
  const allRows = await buildAllInventoryStatRows();
  const filtered = filterRows(allRows, params);
  const sorted = [...filtered].sort((a, b) => compareRows(a, b, params.sortBy, params.sortOrder));
  const total = sorted.length;
  const start = (params.page - 1) * params.limit;
  const items = sorted.slice(start, start + params.limit);

  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function getInventoryStatistics(): Promise<InventoryStatRow[]> {
  const { items } = await listInventoryStatistics({
    q: "",
    sortBy: "code",
    sortOrder: "asc",
    page: 1,
    limit: 10_000,
    sortActive: false,
    sourceFilter: "all",
    statusFilter: "All",
    riskFilter: "All",
  });
  return items;
}
