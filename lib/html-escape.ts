export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function displayHtml(value: string | null | undefined, fallback = "—"): string {
  const trimmed = (value ?? "").trim();
  return trimmed ? escapeHtml(trimmed) : fallback;
}
