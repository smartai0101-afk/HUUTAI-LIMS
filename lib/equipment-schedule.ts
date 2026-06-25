import type { ScheduleStatus } from "@prisma/client";

const THRESHOLD_DAYS = 30;

export function computeScheduleStatus(nextDate: Date | null | undefined): ScheduleStatus {
  if (!nextDate) return "Green";
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth(), nextDate.getUTCDate()));
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Red";
  if (diffDays <= THRESHOLD_DAYS) return "Yellow";
  return "Green";
}

export function addCycleMonths(baseDate: Date, cycleMonths: number): Date {
  const d = new Date(baseDate);
  d.setUTCMonth(d.getUTCMonth() + cycleMonths);
  return d;
}

export function computeNextDate(
  lastDate: Date | null | undefined,
  cycleMonths: number,
): Date | null {
  if (!lastDate) return null;
  return addCycleMonths(lastDate, cycleMonths);
}

export function refreshPlanSchedule(
  lastDate: Date | null | undefined,
  cycleMonths: number,
): { nextDate: Date | null; status: ScheduleStatus } {
  const nextDate = computeNextDate(lastDate, cycleMonths);
  return { nextDate, status: computeScheduleStatus(nextDate) };
}

export function scheduleStatusLabel(status: ScheduleStatus | string): string {
  switch (status) {
    case "Green":
      return "Còn hạn";
    case "Yellow":
      return "Sắp đến hạn (≤30 ngày)";
    case "Red":
      return "Quá hạn";
    default:
      return String(status);
  }
}

export const SCHEDULE_STATUS_FILTERS = ["All", "Green", "Yellow", "Red"] as const;
