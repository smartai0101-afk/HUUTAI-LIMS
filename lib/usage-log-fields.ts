export const USAGE_LOG_TYPE_LABELS: Record<string, string> = {
  IN: "Nhập kho",
  OUT: "Xuất kho",
  USE: "Sử dụng",
  DISPOSE: "Huỷ / thanh lý",
};

export const USAGE_PURPOSE_SUGGESTIONS = [
  "Pha chế",
  "Thí nghiệm",
  "Hiệu chuẩn",
  "Kiểm tra QC",
  "Huỷ",
  "Bảo trì thiết bị",
  "Đào tạo",
] as const;

export const USAGE_STATS_PERIOD_PRESETS = [
  { id: "7d", label: "7 ngày", days: 7 },
  { id: "30d", label: "30 ngày", days: 30 },
  { id: "90d", label: "90 ngày", days: 90 },
  { id: "all", label: "Tất cả", days: null },
] as const;

export type UsageStatsPeriodPreset = (typeof USAGE_STATS_PERIOD_PRESETS)[number]["id"];

export function usageStatsDateRange(preset: UsageStatsPeriodPreset): { from?: Date; to?: Date } {
  if (preset === "all") return {};
  const days = USAGE_STATS_PERIOD_PRESETS.find((item) => item.id === preset)?.days ?? 30;
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}
