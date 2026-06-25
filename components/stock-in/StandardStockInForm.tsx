"use client";

import { useMemo } from "react";
import { DEFAULT_STANDARD_GROUPS } from "@/lib/standards-fields";
import { computeStandardStatus, standardStatusLabel } from "@/lib/standard-status";
import type { StockInMasterOption } from "@/lib/services/stock-in-options";
import { findStandardOptionByIdentity } from "@/lib/stock-in-form-helpers";

export type StandardStockInFormState = {
  existingMasterId: string;
  code: string;
  name: string;
  standardGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  unit: string;
  quantityIn: string;
  expiryDate: string;
  afterOpenExpiry: string;
  storageCondition: string;
  storageLocation: string;
  notes: string;
  coaPath: string;
};

type Props = {
  form: StandardStockInFormState;
  options: StockInMasterOption[];
  onChange: (next: StandardStockInFormState) => void;
};

function previewStatus(expiryDate: string) {
  if (!expiryDate) return "Ready";
  const date = new Date(`${expiryDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Ready";
  return standardStatusLabel(computeStandardStatus(date));
}

export function StandardStockInForm({ form, options, onChange }: Props) {
  const identityInput = useMemo(
    () => ({
      name: form.name,
      manufacturer: form.manufacturer,
      productCode: form.productCode,
    }),
    [form.name, form.manufacturer, form.productCode],
  );

  const identityMatch = useMemo(
    () => findStandardOptionByIdentity(options, identityInput),
    [options, identityInput],
  );

  const codeLocked = identityMatch !== null;

  const set = (patch: Partial<StandardStockInFormState>) => onChange({ ...form, ...patch });

  const applyIdentityResolution = (next: StandardStockInFormState) => {
    const match = findStandardOptionByIdentity(options, {
      name: next.name,
      manufacturer: next.manufacturer,
      productCode: next.productCode,
    });
    if (match) {
      onChange({
        ...next,
        existingMasterId: match.id,
        code: match.code,
        standardGroup: match.standardGroup ?? next.standardGroup,
        manufacturer: match.manufacturer,
        casNumber: match.casNumber ?? next.casNumber,
        productCode: match.productCode ?? "",
        purity: next.purity || match.purity || next.purity,
        uncertainty: next.uncertainty || match.uncertainty || next.uncertainty,
        storageCondition: next.storageCondition || match.storageCondition || next.storageCondition,
      });
      return;
    }
    onChange({ ...next, existingMasterId: "" });
  };

  const handleIdentityFieldChange = (
    key: "name" | "manufacturer" | "productCode",
    value: string,
  ) => {
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
      name: selected.name,
      standardGroup: selected.standardGroup ?? form.standardGroup,
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
        <span className="text-sm font-medium text-slate-700">Chọn chất chuẩn có sẵn</span>
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
          Đã khớp chuẩn <strong>{identityMatch.code}</strong> — mã được gán tự động theo tên, hãng và Product Code.
        </p>
      ) : null}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Mã chuẩn</span>
        <input
          readOnly={codeLocked}
          value={form.code}
          onChange={(e) => set({ code: e.target.value })}
          className={`h-10 w-full rounded-xl border border-slate-200 px-3 text-sm ${codeLocked ? "bg-slate-50 text-slate-600" : ""}`}
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tên chuẩn</span>
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
        <span className="text-sm font-medium text-slate-700">CAS</span>
        <input
          value={form.casNumber}
          onChange={(e) => set({ casNumber: e.target.value })}
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
        { key: "expiryDate", label: "Hạn chứng chỉ", type: "date" },
        { key: "afterOpenExpiry", label: "Hạn sau mở nắp", type: "date" },
        { key: "storageLocation", label: "Vị trí lưu" },
      ].map((field) => (
        <label key={field.key} className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{field.label}</span>
          <input
            type={field.type ?? "text"}
            value={form[field.key as keyof StandardStockInFormState] as string}
            onChange={(e) => set({ [field.key]: e.target.value } as Partial<StandardStockInFormState>)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
      ))}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Nhóm chuẩn</span>
        <select
          value={form.standardGroup}
          onChange={(e) => set({ standardGroup: e.target.value })}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        >
          {DEFAULT_STANDARD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
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
