"use client";

import { useEffect, useMemo } from "react";
import { CodeSequenceInput } from "@/components/shared/CodeSequenceInput";
import { computeStandardStatus, standardStatusLabel } from "@/lib/standard-status";
import type { StockInMasterOption } from "@/lib/services/stock-in-options";
import { lotsMatch } from "@/lib/services/stock-in-match";
import { unitsAreConvertible } from "@/lib/inventory-units";
import { formatStockInCodeFromSequence } from "@/lib/stock-in-code";
import { findChemicalOptionByIdentity } from "@/lib/stock-in-form-helpers";

export type ChemicalStockInFormState = {
  existingMasterId: string;
  code: string;
  sequenceNumber: string;
  name: string;
  chemicalGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  unit: string;
  quantityIn: string;
  expiryDate: string;
  storageCondition: string;
  storageLocation: string;
  notes: string;
  coaPath: string;
};

type Props = {
  form: ChemicalStockInFormState;
  options: StockInMasterOption[];
  groupOptions: string[];
  onChange: (next: ChemicalStockInFormState) => void;
};

function previewStatus(expiryDate: string) {
  if (!expiryDate) return "Ready";
  const date = new Date(`${expiryDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Ready";
  return standardStatusLabel(computeStandardStatus(date));
}

const IDENTITY_KEYS = ["name", "manufacturer", "casNumber", "productCode"] as const;

export function ChemicalStockInForm({ form, options, groupOptions, onChange }: Props) {
  const identityInput = useMemo(
    () => ({
      name: form.name,
      casNumber: form.casNumber,
      manufacturer: form.manufacturer,
      productCode: form.productCode,
    }),
    [form.name, form.casNumber, form.manufacturer, form.productCode],
  );

  const identityMatch = useMemo(
    () => findChemicalOptionByIdentity(options, identityInput),
    [options, identityInput],
  );

  const selectedMaster = useMemo(
    () =>
      options.find((o) => o.id === form.existingMasterId) ??
      (identityMatch ? identityMatch : undefined),
    [options, form.existingMasterId, identityMatch],
  );

  const conflictingLot = useMemo(() => {
    if (!form.lot.trim() || !selectedMaster?.stockLots?.length) return null;
    const hit = selectedMaster.stockLots.find((sl) => lotsMatch(sl.lot, form.lot));
    if (!hit || !form.unit.trim() || !hit.unit.trim()) return null;
    if (!unitsAreConvertible(form.unit, hit.unit)) return hit;
    return null;
  }, [form.lot, form.unit, selectedMaster]);

  const resolvedCode = identityMatch?.code ?? form.code;
  const isExistingMaster = Boolean(identityMatch?.code || (form.existingMasterId && resolvedCode));

  const set = (patch: Partial<ChemicalStockInFormState>) => onChange({ ...form, ...patch });

  const applyIdentityResolution = (next: ChemicalStockInFormState) => {
    const match = findChemicalOptionByIdentity(options, {
      name: next.name,
      casNumber: next.casNumber,
      manufacturer: next.manufacturer,
      productCode: next.productCode,
    });
    if (match) {
      onChange({
        ...next,
        existingMasterId: match.id,
        code: match.code,
        sequenceNumber: "",
        unit: next.unit.trim() || match.unit || next.unit,
        chemicalGroup: match.chemicalGroup ?? next.chemicalGroup,
        manufacturer: match.manufacturer,
        casNumber: match.casNumber ?? "",
        productCode: match.productCode ?? "",
        purity: next.purity || match.purity || next.purity,
        uncertainty: next.uncertainty || match.uncertainty || next.uncertainty,
        storageCondition: next.storageCondition || match.storageCondition || next.storageCondition,
      });
      return;
    }
    onChange({ ...next, existingMasterId: "" });
  };

  useEffect(() => {
    if (!identityMatch) return;
    if (form.existingMasterId === identityMatch.id && form.code === identityMatch.code) return;
    applyIdentityResolution(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when identity match appears
  }, [identityMatch?.id]);

  const handleIdentityFieldChange = (key: typeof IDENTITY_KEYS[number], value: string) => {
    applyIdentityResolution({ ...form, [key]: value });
  };

  const handleSelectExisting = (id: string) => {
    const selected = options.find((item) => item.id === id);
    if (!selected) {
      set({ existingMasterId: "" });
      return;
    }
    set({
      existingMasterId: selected.id,
      code: selected.code,
      sequenceNumber: "",
      name: selected.name,
      unit: form.unit.trim() || selected.unit || form.unit,
      chemicalGroup: selected.chemicalGroup ?? form.chemicalGroup,
      manufacturer: selected.manufacturer,
      casNumber: selected.casNumber ?? "",
      productCode: selected.productCode ?? "",
      purity: selected.purity ?? form.purity,
      uncertainty: selected.uncertainty ?? form.uncertainty,
      storageCondition: selected.storageCondition ?? form.storageCondition,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="md:col-span-2 space-y-1">
        <span className="text-sm font-medium text-slate-700">Chọn hoá chất có sẵn</span>
        <select
          value={form.existingMasterId}
          onChange={(e) => handleSelectExisting(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        >
          <option value="">— Nhập mới hoặc chọn để auto-fill —</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {identityMatch ? (
        <p className="md:col-span-2 text-sm text-teal-700">
          Đã khớp hoá chất <strong>{identityMatch.code}</strong> — mã được gán tự động theo tên, hãng, CAS và Product
          Code.
        </p>
      ) : null}

      {conflictingLot ? (
        <p className="md:col-span-2 text-sm text-amber-700">
          Lot <strong>{conflictingLot.lot}</strong> đã tồn tại với đơn vị <strong>{conflictingLot.unit}</strong> — không
          thể nhập <strong>{form.unit}</strong>. Đổi Lot Number hoặc đơn vị cho khớp.
        </p>
      ) : null}

      {isExistingMaster ? (
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Mã hoá chất</span>
          <input
            readOnly
            value={resolvedCode}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
          />
        </label>
      ) : (
        <CodeSequenceInput
          prefix="CHEM"
          sequence={form.sequenceNumber}
          onSequenceChange={(sequence) =>
            onChange({
              ...form,
              sequenceNumber: sequence,
              code: formatStockInCodeFromSequence("CHEM", sequence),
            })
          }
          mode="create"
          label="Mã hoá chất"
        />
      )}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tên hoá chất</span>
        <input
          value={form.name}
          onChange={(e) => handleIdentityFieldChange("name", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Hãng sản xuất</span>
        <input
          value={form.manufacturer}
          onChange={(e) => handleIdentityFieldChange("manufacturer", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">CAS Number</span>
        <input
          value={form.casNumber}
          onChange={(e) => handleIdentityFieldChange("casNumber", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Product Code</span>
        <input
          value={form.productCode}
          onChange={(e) => handleIdentityFieldChange("productCode", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      {[
        { key: "lot", label: "Lot Number" },
        { key: "purity", label: "Purity" },
        { key: "uncertainty", label: "Uncertainty" },
        { key: "unit", label: "Đơn vị" },
        { key: "quantityIn", label: "Số lượng nhập", type: "number" },
        { key: "expiryDate", label: "Hạn dùng", type: "date" },
        { key: "storageLocation", label: "Vị trí lưu" },
      ].map((field) => (
        <label key={field.key} className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{field.label}</span>
          <input
            type={field.type ?? "text"}
            value={form[field.key as keyof ChemicalStockInFormState] as string}
            onChange={(e) => set({ [field.key]: e.target.value } as Partial<ChemicalStockInFormState>)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
      ))}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Nhóm hoá chất</span>
        <input
          list="stock-in-chemical-group-options"
          value={form.chemicalGroup}
          onChange={(e) => set({ chemicalGroup: e.target.value })}
          placeholder="Dung môi, Acid, Base hoặc nhóm mới"
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
        <datalist id="stock-in-chemical-group-options">
          {groupOptions.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Trạng thái</span>
        <input
          readOnly
          value={previewStatus(form.expiryDate)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
        />
      </label>

      <label className="md:col-span-2 space-y-1">
        <span className="text-sm font-medium text-slate-700">Điều kiện bảo quản</span>
        <input
          value={form.storageCondition}
          onChange={(e) => set({ storageCondition: e.target.value })}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="md:col-span-2 space-y-1">
        <span className="text-sm font-medium text-slate-700">COA</span>
        <input type="file" name="coa" accept=".pdf,.png,.jpg,.jpeg" className="block w-full text-sm" />
      </label>

      <label className="md:col-span-2 space-y-1">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
