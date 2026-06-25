export const STOCK_SHORTAGE_MESSAGE = "Số lượng sử dụng vượt quá tồn kho hiện tại.";
export const STOCK_ERROR_PREFIX = STOCK_SHORTAGE_MESSAGE;

export const UNIT_CONVERSION_ERROR =
  "Không thể quy đổi đơn vị — chỉ hỗ trợ kg/g/mg và L/mL/µL trong cùng nhóm.";

type UnitFamily = "mass" | "volume";

const MASS_TO_GRAMS: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
};

/** Liters as base unit. Keys use normalizeUnitToken() output. */
const VOLUME_TO_LITERS: Record<string, number> = {
  ul: 1e-6,
  ml: 0.001,
  l: 1,
};

export function roundStockQuantity(value: number): number {
  return Number(value.toFixed(4));
}

export function formatStockQty(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(roundStockQuantity(value));
}

function normalizeUnitToken(unit: string): string {
  return unit
    .trim()
    .replace(/\u00b5|\u03bc/g, "u") // µ (micro sign) and μ (Greek mu) → u
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function getUnitFamily(unit: string): UnitFamily | null {
  const token = normalizeUnitToken(unit);
  if (token in MASS_TO_GRAMS) return "mass";
  if (token in VOLUME_TO_LITERS) return "volume";
  return null;
}

function toGrams(value: number, unit: string): number | null {
  const token = normalizeUnitToken(unit);
  const factor = MASS_TO_GRAMS[token];
  if (factor === undefined) return null;
  return value * factor;
}

function fromGrams(grams: number, unit: string): number | null {
  const token = normalizeUnitToken(unit);
  const factor = MASS_TO_GRAMS[token];
  if (factor === undefined) return null;
  return grams / factor;
}

function toLiters(value: number, unit: string): number | null {
  const token = normalizeUnitToken(unit);
  const factor = VOLUME_TO_LITERS[token];
  if (factor === undefined) return null;
  return value * factor;
}

function fromLiters(liters: number, unit: string): number | null {
  const token = normalizeUnitToken(unit);
  const factor = VOLUME_TO_LITERS[token];
  if (factor === undefined) return null;
  return liters / factor;
}

export function convertQuantity(
  value: number,
  fromUnit: string,
  toUnit: string,
): number | { error: string } {
  const fromTrim = fromUnit.trim();
  const toTrim = toUnit.trim();
  if (!fromTrim || !toTrim) {
    return { error: UNIT_CONVERSION_ERROR };
  }
  if (normalizeUnitToken(fromTrim) === normalizeUnitToken(toTrim)) {
    return roundStockQuantity(value);
  }

  const fromFamily = getUnitFamily(fromUnit);
  const toFamily = getUnitFamily(toUnit);
  if (!fromFamily || !toFamily || fromFamily !== toFamily) {
    return { error: describeUnitMismatch(fromUnit, toUnit) };
  }

  if (fromFamily === "mass") {
    const grams = toGrams(value, fromUnit);
    if (grams === null) return { error: UNIT_CONVERSION_ERROR };
    const converted = fromGrams(grams, toUnit);
    if (converted === null) return { error: UNIT_CONVERSION_ERROR };
    return roundStockQuantity(converted);
  }

  const liters = toLiters(value, fromUnit);
  if (liters === null) return { error: UNIT_CONVERSION_ERROR };
  const converted = fromLiters(liters, toUnit);
  if (converted === null) return { error: UNIT_CONVERSION_ERROR };
  return roundStockQuantity(converted);
}

export function sumQuantitiesInUnit(
  lines: { quantityUsed: number; unit: string }[],
  targetUnit: string,
): number | { error: string } {
  let total = 0;
  for (const line of lines) {
    const converted = convertQuantity(line.quantityUsed, line.unit, targetUnit);
    if (typeof converted === "object") return converted;
    total += converted;
  }
  return roundStockQuantity(total);
}

export function unitsAreConvertible(fromUnit: string, toUnit: string): boolean {
  const fromTrim = fromUnit.trim();
  const toTrim = toUnit.trim();
  if (!fromTrim || !toTrim) return true;
  if (normalizeUnitToken(fromTrim) === normalizeUnitToken(toTrim)) return true;
  const fromFamily = getUnitFamily(fromTrim);
  const toFamily = getUnitFamily(toTrim);
  if (!fromFamily || !toFamily) return false;
  return fromFamily === toFamily;
}

export function describeUnitMismatch(fromUnit: string, toUnit: string): string {
  const fromTrim = fromUnit.trim();
  const toTrim = toUnit.trim();
  if (!fromTrim || !toTrim) {
    return "Thiếu đơn vị — không thể quy đổi.";
  }
  const fromFamily = getUnitFamily(fromTrim);
  const toFamily = getUnitFamily(toTrim);
  if (!fromFamily || !toFamily) {
    return `Đơn vị "${fromTrim}" hoặc "${toTrim}" không hợp lệ — chỉ hỗ trợ kg/g/mg và L/mL/µL.`;
  }
  if (fromFamily !== toFamily) {
    return `Không thể quy đổi ${fromTrim} sang ${toTrim} — khác nhóm đơn vị (khối lượng vs thể tích).`;
  }
  return UNIT_CONVERSION_ERROR;
}
