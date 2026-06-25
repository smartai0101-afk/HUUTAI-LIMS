import type { UsageLogType, UsageSourceType } from "@prisma/client";
import { db } from "@/lib/db";
import { usageSourceLabel } from "@/lib/usage-source";

export type UsageStatsFilters = {
  from?: Date;
  to?: Date;
  performedBy?: string;
  sourceType?: UsageSourceType | "all";
  type?: UsageLogType | "all";
};

type RawUsageLog = {
  id: string;
  date: Date;
  type: UsageLogType;
  sourceType: UsageSourceType;
  sourceId: string;
  quantity: number;
  unit: string;
  performedBy: string;
  purpose: string;
};

function buildWhere(filters: UsageStatsFilters) {
  return {
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.performedBy ? { performedBy: filters.performedBy } : {}),
    ...(filters.sourceType && filters.sourceType !== "all" ? { sourceType: filters.sourceType } : {}),
    ...(filters.type && filters.type !== "all" ? { type: filters.type } : {}),
  };
}

async function fetchLogs(filters: UsageStatsFilters): Promise<RawUsageLog[]> {
  return db.usageLog.findMany({
    where: buildWhere(filters),
    select: {
      id: true,
      date: true,
      type: true,
      sourceType: true,
      sourceId: true,
      quantity: true,
      unit: true,
      performedBy: true,
      purpose: true,
    },
    orderBy: { date: "desc" },
  });
}

async function resolveItemNames(logs: RawUsageLog[]) {
  const chemicalIds = [...new Set(logs.filter((l) => l.sourceType === "Chemical").map((l) => l.sourceId))];
  const standardIds = [...new Set(logs.filter((l) => l.sourceType === "Standard").map((l) => l.sourceId))];
  const strainIds = [...new Set(logs.filter((l) => l.sourceType === "MicrobialStrain").map((l) => l.sourceId))];

  const [chemicals, standards, strains] = await Promise.all([
    chemicalIds.length
      ? db.chemical.findMany({ where: { id: { in: chemicalIds } }, select: { id: true, code: true, name: true } })
      : [],
    standardIds.length
      ? db.standard.findMany({ where: { id: { in: standardIds } }, select: { id: true, code: true, name: true } })
      : [],
    strainIds.length
      ? db.microbialStrain.findMany({ where: { id: { in: strainIds } }, select: { id: true, code: true, name: true } })
      : [],
  ]);

  const map = new Map<string, { code: string; name: string }>();
  for (const row of chemicals) map.set(`Chemical:${row.id}`, { code: row.code, name: row.name });
  for (const row of standards) map.set(`Standard:${row.id}`, { code: row.code, name: row.name });
  for (const row of strains) map.set(`MicrobialStrain:${row.id}`, { code: row.code, name: row.name });
  return map;
}

export type UsageEmployeeStatRow = {
  performedBy: string;
  transactionCount: number;
  useCount: number;
  outCount: number;
  inCount: number;
  disposeCount: number;
  quantities: Array<{ unit: string; total: number }>;
  topPurpose: string;
};

export type UsageItemStatRow = {
  sourceType: UsageSourceType;
  sourceLabel: string;
  itemCode: string;
  itemName: string;
  transactionCount: number;
  quantities: Array<{ unit: string; total: number }>;
};

export type UsagePeriodStatRow = {
  period: string;
  transactionCount: number;
  quantities: Array<{ unit: string; total: number }>;
};

export type UsagePurposeStatRow = {
  purpose: string;
  count: number;
};

function sumQuantitiesByUnit(logs: RawUsageLog[]) {
  const totals = new Map<string, number>();
  for (const log of logs) {
    const unit = log.unit.trim() || "-";
    totals.set(unit, (totals.get(unit) ?? 0) + log.quantity);
  }
  return [...totals.entries()]
    .map(([unit, total]) => ({ unit, total: Math.round(total * 1000) / 1000 }))
    .sort((a, b) => a.unit.localeCompare(b.unit));
}

function topPurpose(logs: RawUsageLog[]): string {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const purpose = log.purpose.trim() || "—";
    counts.set(purpose, (counts.get(purpose) ?? 0) + 1);
  }
  let best = "—";
  let bestCount = 0;
  for (const [purpose, count] of counts) {
    if (count > bestCount) {
      best = purpose;
      bestCount = count;
    }
  }
  return best;
}

function formatPeriod(date: Date, groupBy: "day" | "week" | "month") {
  const iso = date.toISOString().slice(0, 10);
  if (groupBy === "day") return iso;
  if (groupBy === "month") return iso.slice(0, 7);
  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  return weekStart.toISOString().slice(0, 10);
}

export async function getUsageStatsByEmployee(filters: UsageStatsFilters): Promise<UsageEmployeeStatRow[]> {
  const logs = await fetchLogs(filters);
  const grouped = new Map<string, RawUsageLog[]>();

  for (const log of logs) {
    const bucket = grouped.get(log.performedBy) ?? [];
    bucket.push(log);
    grouped.set(log.performedBy, bucket);
  }

  return [...grouped.entries()]
    .map(([performedBy, rows]) => ({
      performedBy,
      transactionCount: rows.length,
      useCount: rows.filter((r) => r.type === "USE").length,
      outCount: rows.filter((r) => r.type === "OUT").length,
      inCount: rows.filter((r) => r.type === "IN").length,
      disposeCount: rows.filter((r) => r.type === "DISPOSE").length,
      quantities: sumQuantitiesByUnit(rows.filter((r) => r.type !== "IN")),
      topPurpose: topPurpose(rows),
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount);
}

export async function getUsageStatsByItem(filters: UsageStatsFilters): Promise<UsageItemStatRow[]> {
  const logs = await fetchLogs(filters);
  const nameMap = await resolveItemNames(logs);
  const grouped = new Map<string, RawUsageLog[]>();

  for (const log of logs) {
    const key = `${log.sourceType}:${log.sourceId}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(log);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([key, rows]) => {
      const sample = rows[0]!;
      const meta = nameMap.get(key) ?? { code: "—", name: "—" };
      return {
        sourceType: sample.sourceType,
        sourceLabel: usageSourceLabel(sample.sourceType),
        itemCode: meta.code,
        itemName: meta.name,
        transactionCount: rows.length,
        quantities: sumQuantitiesByUnit(rows.filter((r) => r.type !== "IN")),
      };
    })
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 10);
}

export async function getUsageStatsByPeriod(
  filters: UsageStatsFilters,
  groupBy: "day" | "week" | "month" = "day",
): Promise<UsagePeriodStatRow[]> {
  const logs = await fetchLogs(filters);
  const grouped = new Map<string, RawUsageLog[]>();

  for (const log of logs) {
    const period = formatPeriod(log.date, groupBy);
    const bucket = grouped.get(period) ?? [];
    bucket.push(log);
    grouped.set(period, bucket);
  }

  return [...grouped.entries()]
    .map(([period, rows]) => ({
      period,
      transactionCount: rows.length,
      quantities: sumQuantitiesByUnit(rows.filter((r) => r.type !== "IN")),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export async function getUsageStatsByPurpose(filters: UsageStatsFilters): Promise<UsagePurposeStatRow[]> {
  const logs = await fetchLogs(filters);
  const counts = new Map<string, number>();
  for (const log of logs) {
    const purpose = log.purpose.trim() || "—";
    counts.set(purpose, (counts.get(purpose) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([purpose, count]) => ({ purpose, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function getUsageStatsEmployeeNames(filters: UsageStatsFilters): Promise<string[]> {
  const rows = await db.usageLog.findMany({
    where: buildWhere(filters),
    select: { performedBy: true },
    distinct: ["performedBy"],
    orderBy: { performedBy: "asc" },
  });
  return rows.map((row) => row.performedBy);
}
