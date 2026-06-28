/** IUPAC group number → traditional A/B label. */
const TRADITIONAL_GROUP_LABELS: Readonly<Record<number, string>> = {
  1: "IA / 1A",
  2: "IIA / 2A",
  3: "IIIB / 3B",
  4: "IVB / 4B",
  5: "VB / 5B",
  6: "VIB / 6B",
  7: "VIIB / 7B",
  8: "VIIIB / 8B",
  9: "VIIIB / 8B",
  10: "VIIIB / 8B",
  11: "IB / 1B",
  12: "IIB / 2B",
  13: "IIIA / 3A",
  14: "IVA / 4A",
  15: "VA / 5A",
  16: "VIA / 6A",
  17: "VIIA / 7A",
  18: "VIIIA / 8A",
};

export function getTraditionalGroupLabel(groupIupac: number | null): string | null {
  if (groupIupac == null) return null;
  return TRADITIONAL_GROUP_LABELS[groupIupac] ?? null;
}

/** Display value for the "Nhóm" field (without the "Nhóm" prefix). */
export function formatGroupDisplay(groupIupac: number | null): string {
  if (groupIupac == null) return "—";
  const traditional = getTraditionalGroupLabel(groupIupac);
  if (traditional) return `${groupIupac} (${traditional})`;
  return String(groupIupac);
}
