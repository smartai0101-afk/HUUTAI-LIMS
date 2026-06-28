import { volumeToLiters, volumeToMicroliters } from "./normalize";
import type { TableVolumeUnit, VolumeUnit } from "./types";

const PIPETTE_WARNING_UL = 10;

export function validateDilutionConcentrations(
  c1: number,
  c2: number,
): { ok: true } | { ok: false; error: string } {
  if (c2 > c1) {
    return {
      ok: false,
      error: "Nồng độ sau pha loãng (C₂) không được cao hơn nồng độ stock (C₁).",
    };
  }
  return { ok: true };
}

export function validateDilutionVolumes(
  v1Liters: number,
  v2Liters: number,
): { ok: true } | { ok: false; error: string } {
  if (v1Liters > v2Liters) {
    return {
      ok: false,
      error: "Thể tích stock (V₁) không được lớn hơn thể tích cuối (V₂).",
    };
  }
  return { ok: true };
}

export function checkPipetteWarning(
  vStock: number,
  vStockUnit: VolumeUnit | TableVolumeUnit,
): string[] {
  const ul = volumeToMicroliters(vStock, vStockUnit);
  if (!ul.ok) return [];
  if (ul.microliters > 0 && ul.microliters < PIPETTE_WARNING_UL) {
    return ["Thể tích quá nhỏ, nên pha loãng trung gian."];
  }
  return [];
}

export function checkVStockExceedsVFinal(
  vStock: number,
  vStockUnit: VolumeUnit | TableVolumeUnit,
  vFinal: number,
  vFinalUnit: VolumeUnit | TableVolumeUnit,
): string[] {
  const stockUl = volumeToMicroliters(vStock, vStockUnit);
  const finalUl = volumeToMicroliters(vFinal, vFinalUnit);
  if (!stockUl.ok || !finalUl.ok) return [];
  if (stockUl.microliters > finalUl.microliters) {
    return ["Cảnh báo: thể tích stock lớn hơn thể tích cuối — kiểm tra lại nồng độ hoặc quy cách pha."];
  }
  return [];
}

export function collectVolumeWarnings(
  vStock: number,
  vStockUnit: VolumeUnit | TableVolumeUnit,
  vFinal: number,
  vFinalUnit: VolumeUnit | TableVolumeUnit,
): string[] {
  return [
    ...checkPipetteWarning(vStock, vStockUnit),
    ...checkVStockExceedsVFinal(vStock, vStockUnit, vFinal, vFinalUnit),
  ];
}

export function validatePositive(value: number, label: string): { ok: true } | { ok: false; error: string } {
  if (!(value > 0) || Number.isNaN(value)) {
    return { ok: false, error: `${label} phải > 0` };
  }
  return { ok: true };
}

export function validateFactor(factor: number): { ok: true } | { ok: false; error: string } {
  if (!(factor > 1) || Number.isNaN(factor)) {
    return { ok: false, error: "Hệ số pha loãng phải > 1" };
  }
  return { ok: true };
}

export function validateSteps(steps: number): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(steps) || steps < 1) {
    return { ok: false, error: "Số bước phải là số nguyên ≥ 1" };
  }
  return { ok: true };
}
