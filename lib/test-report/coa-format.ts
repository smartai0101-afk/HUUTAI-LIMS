export function formatCoaDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCoaDateEn(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatCoaDateVi(value: Date | string | null | undefined): string {
  return formatCoaDate(value);
}

export function formatMethodDisplay(row: {
  methodCode?: string;
  methodName?: string;
}): string {
  const code = row.methodCode?.trim();
  const name = row.methodName?.trim();
  if (code && name && code !== name) return `${code} — ${name}`;
  return name || code || "—";
}

export function formatEvaluationRemark(
  evaluation: string | null | undefined,
): string {
  if (evaluation === "pass") return "Pass / Đạt";
  if (evaluation === "fail") return "Fail / Không đạt";
  if (evaluation === "not_applicable") return "N/A";
  return "—";
}

export function inferStandardRef(limitValue: string): string {
  const v = limitValue.trim();
  if (!v) return "";
  const upper = v.toUpperCase();
  for (const prefix of ["QCVN", "TCVN", "ISO", "AOAC", "CODEX"]) {
    if (upper.includes(prefix)) return v;
  }
  return "";
}

export function formatEvaluationLabel(evaluation: string | null | undefined): string {
  if (evaluation === "pass") return "Đạt";
  if (evaluation === "fail") return "Không đạt";
  if (evaluation === "not_applicable") return "Không áp dụng";
  return "—";
}

export function formatLimitDisplay(limitValue: string): string {
  return limitValue.trim() || "Không quy định";
}

export function reportStatusDisplay(status: string): string {
  if (status === "issued" || status === "reissued") return "Released";
  if (status === "approved") return "Approved";
  if (status === "draft") return "Draft";
  if (status === "cancelled") return "Cancelled";
  return status;
}
