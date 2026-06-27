import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import type { EnvironmentalLogView } from "@/types";

function formatSnapshot(row: {
  loggedAt: Date;
  location: string;
  temperature: number | null;
  humidity: number | null;
  notes: string;
}): string {
  const parts: string[] = [`Điều kiện môi trường — ${row.location}`, toDateString(row.loggedAt)];
  if (row.temperature != null) parts.push(`${row.temperature}°C`);
  if (row.humidity != null) parts.push(`${row.humidity}% RH`);
  const base = parts.join(" · ");
  return row.notes.trim() ? `${base} — ${row.notes.trim()}` : base;
}

function mapRow(row: {
  id: string;
  loggedAt: Date;
  location: string;
  temperature: number | null;
  humidity: number | null;
  recordedByStaffId: string | null;
  notes: string;
  createdAt: Date;
  recordedByStaff: { name: string } | null;
}): EnvironmentalLogView {
  return {
    id: row.id,
    loggedAt: toDateString(row.loggedAt),
    location: row.location,
    temperature: row.temperature,
    humidity: row.humidity,
    recordedByStaffId: row.recordedByStaffId,
    recordedByStaffName: row.recordedByStaff?.name ?? "",
    notes: row.notes,
    createdAt: toDateString(row.createdAt),
    snapshotText: formatSnapshot(row),
  };
}

export async function getEnvironmentalLogs(limit = 200): Promise<EnvironmentalLogView[]> {
  const rows = await db.environmentalLog.findMany({
    include: { recordedByStaff: { select: { name: true } } },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
  return rows.map(mapRow);
}

export async function getRecentEnvironmentalLogs(limit = 20): Promise<EnvironmentalLogView[]> {
  return getEnvironmentalLogs(limit);
}
