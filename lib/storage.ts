import { Chemical, Standard, Solution, Transaction, AlertItem } from "@/types";

export const STORAGE_KEYS = {
  chemicals: "lims_chemicals",
  standards: "lims_standards",
  solutions: "lims_solutions",
  transactions: "lims_transactions",
  inventory: "lims_inventory",
  alerts: "lims_alerts",
  reviewedAlerts: "lims_reviewed_alerts",
};

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? "");
            return `"${value.replaceAll('"', '""')}"`;
          })
          .join(","),
      ),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getAlertItems(
  chemicals: Chemical[],
  standards: Standard[],
  solutions: Solution[],
): AlertItem[] {
  const alerts: AlertItem[] = [];
  chemicals.forEach((item) => {
    if (item.status === "Expired") {
      alerts.push({
        id: `alert-${item.id}`,
        title: "Hết hạn",
        description: `${item.name} đã hết hạn`,
        severity: "Critical",
        type: "Expiry",
        date: item.expiryDate,
      });
    } else if (item.quantity <= 5) {
      alerts.push({
        id: `alert-${item.id}`,
        title: "Tồn kho thấp",
        description: `${item.name} chỉ còn ${item.quantity} ${item.unit}`,
        severity: "Warning",
        type: "Low Stock",
        date: item.expiryDate,
      });
    }
  });

  standards.forEach((item) => {
    if (item.status === "Expired") {
      alerts.push({
        id: `alert-${item.id}`,
        title: "Chất chuẩn hết hạn",
        description: `${item.name} đã hết hạn chứng chỉ`,
        severity: "Critical",
        type: "Expiry",
        date: item.certificateExpiry,
      });
    }
  });

  solutions.forEach((item) => {
    if (item.status === "Expired") {
      alerts.push({
        id: `alert-${item.id}`,
        title: "Dung dịch chuẩn hết hạn",
        description: `${item.name} đã hết hạn`,
        severity: "Warning",
        type: "Expiry",
        date: item.expiryDate,
      });
    }
  });

  return alerts;
}
