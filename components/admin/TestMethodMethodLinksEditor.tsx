"use client";

import { useEffect, useMemo, useState } from "react";
import { TestUnitInput } from "@/components/admin/TestUnitInput";
import type { TestMethodMethodLinkInput } from "@/lib/services/catalog/test-methods";
import type { TestMethodMethodLink } from "@/types/catalog";

type AnalyticalMethodOption = {
  id: string;
  methodCode: string;
  methodName: string;
};

type DraftLink = {
  methodId: string;
  unit: string;
  lod: string;
  isPrimary: boolean;
};

type Props = {
  analyticalMethods: AnalyticalMethodOption[];
  defaultLinks?: TestMethodMethodLink[];
  defaultUnit?: string;
  defaultLod?: string;
  unitSuggestions: string[];
  disabled?: boolean;
  name?: string;
  onChange?: (links: TestMethodMethodLinkInput[]) => void;
};

function toDraftLinks(
  links: TestMethodMethodLink[],
  fallbackUnit: string,
  fallbackLod: string,
): DraftLink[] {
  if (links.length === 0) return [];
  return links.map((l) => ({
    methodId: l.methodId,
    unit: l.unit || fallbackUnit,
    lod: l.lod || fallbackLod,
    isPrimary: l.isPrimary,
  }));
}

function emptyRow(defaultUnit: string, defaultLod: string): DraftLink {
  return { methodId: "", unit: defaultUnit, lod: defaultLod, isPrimary: false };
}

export function TestMethodMethodLinksEditor({
  analyticalMethods,
  defaultLinks = [],
  defaultUnit = "",
  defaultLod = "",
  unitSuggestions,
  disabled,
  name = "methodLinks",
  onChange,
}: Props) {
  const [links, setLinks] = useState<DraftLink[]>(() =>
    toDraftLinks(defaultLinks, defaultUnit, defaultLod),
  );

  const payload = useMemo((): TestMethodMethodLinkInput[] => {
    return links
      .filter((l) => l.methodId)
      .map((l, index) => ({
        methodId: l.methodId,
        unit: l.unit,
        lod: l.lod,
        isPrimary: l.isPrimary,
        sortOrder: index,
      }));
  }, [links]);

  useEffect(() => {
    onChange?.(payload);
  }, [payload, onChange]);

  function updateLink(index: number, patch: Partial<DraftLink>) {
    setLinks((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function setPrimary(index: number) {
    setLinks((prev) => prev.map((row, i) => ({ ...row, isPrimary: i === index })));
  }

  function addRow() {
    setLinks((prev) => [...prev, emptyRow(defaultUnit, defaultLod)]);
  }

  function removeRow(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {links.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa gán phương pháp thử.</p>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={`${index}-${link.methodId}`}
              className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2 sm:grid-cols-[1fr_100px_80px_auto_auto]"
            >
              <select
                value={link.methodId}
                disabled={disabled}
                onChange={(e) => updateLink(index, { methodId: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">Chọn Mã PP</option>
                {analyticalMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.methodCode}
                  </option>
                ))}
              </select>
              <TestUnitInput
                listId={`tm-method-unit-${index}`}
                suggestions={unitSuggestions}
                value={link.unit}
                onChange={(v) => updateLink(index, { unit: v })}
                placeholder="ĐVT"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                value={link.lod}
                disabled={disabled}
                onChange={(e) => updateLink(index, { lod: e.target.value })}
                placeholder="LOD"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="radio"
                  name={`primary-${name}`}
                  checked={link.isPrimary}
                  disabled={disabled || !link.methodId}
                  onChange={() => setPrimary(index)}
                />
                Chính
              </label>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Xóa
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {!disabled ? (
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-medium text-cyan-700 hover:underline"
        >
          + Thêm PP
        </button>
      ) : null}
      <input type="hidden" name={name} value={JSON.stringify(payload)} />
    </div>
  );
}
