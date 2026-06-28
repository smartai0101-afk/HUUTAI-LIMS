export function parseJsonArray<T>(value: string, fallback: T[] = []): T[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function parseJsonStatements(value: string): Array<{ code: string; text: string }> {
  return parseJsonArray<{ code: string; text: string }>(value);
}
