"use client";

import { useEffect, useMemo } from "react";
import { CodeSequenceInput } from "@/components/shared/CodeSequenceInput";
import { computeStandardStatus, standardStatusLabel } from "@/lib/standard-status";
import type { StockInMasterOption } from "@/lib/services/stock-in-options";
import { formatStockInCodeFromSequence } from "@/lib/stock-in-code";
import { findStrainOptionByIdentity } from "@/lib/stock-in-form-helpers";

export type StrainStockInFormState = {
  existingMasterId: string;
  code: string;
  sequenceNumber: string;
  name: string;
  strainGroup: string;
  manufacturer: string;
  atccProductCode: string;
  lot: string;
  unit: string;
  quantityIn: string;
  expiryDate: string;
  storageCondition: string;
  storageLocation: string;
  notes: string;
  coaPath: string;
};

type Props = {
  form: StrainStockInFormState;
  options: StockInMasterOption[];
  groupOptions: string[];
  onChange: (next: StrainStockInFormState) => void;
};

function previewStatus(expiryDate: string) {
  if (!expiryDate) return "Ready";
  const date = new Date(`${expiryDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Ready";
  return standardStatusLabel(computeStandardStatus(date));
}

export function StrainStockInForm({ form, options, groupOptions, onChange }: Props) {
  const identityInput = useMemo(
    () => ({
      name: form.name,
      atccProductCode: form.atccProductCode,
      manufacturer: form.manufacturer,
    }),
    [form.name, form.atccProductCode, form.manufacturer],
  );

  const identityMatch = useMemo(
    () => findStrainOptionByIdentity(options, identityInput),
    [options, identityInput],
  );

  const resolvedCode = identityMatch?.code ?? form.code;
  const isExistingMaster = Boolean(identityMatch?.code || (form.existingMasterId && resolvedCode));

  const set = (patch: Partial<StrainStockInFormState>) => onChange({ ...form, ...patch });

  const applyIdentityResolution = (next: StrainStockInFormState) => {
    const match = findStrainOptionByIdentity(options, {
      name: next.name,
      atccProductCode: next.atccProductCode,
      manufacturer: next.manufacturer,
    });
    if (match) {
      onChange({
        ...next,
        existingMasterId: match.id,
        code: match.code,
        sequenceNumber: "",
        strainGroup: match.strainGroup ?? next.strainGroup,
        manufacturer: match.manufacturer,
        atccProductCode: match.atccProductCode ?? "",
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

  const handleIdentityFieldChange = (
    key: "name" | "manufacturer" | "atccProductCode",
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
      sequenceNumber: "",
      name: selected.name,
      strainGroup: selected.strainGroup ?? form.strainGroup,
      manufacturer: selected.manufacturer,
      atccProductCode: selected.atccProductCode ?? "",
      storageCondition: selected.storageCondition ?? form.storageCondition,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="md:col-span-2 space-y-1">
        <span className="text-sm font-medium text-slate-700">Chọn chủng có sẵn</span>
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
          Đã khớp chủng <strong>{identityMatch.code}</strong> — mã được gán tự động theo tên, hãng và ATCC/Product Code.
        </p>
      ) : null}

      {isExistingMaster ? (
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Mã chủng</span>
          <input
            readOnly
            value={resolvedCode}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
          />
        </label>
      ) : (
        <CodeSequenceInput
          prefix="STR"
          sequence={form.sequenceNumber}
          onSequenceChange={(sequence) =>
            onChange({
              ...form,
              sequenceNumber: sequence,
              code: formatStockInCodeFromSequence("STR", sequence),
            })
          }
          mode="create"
          label="Mã chủng"
        />
      )}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tên chủng</span>
        <input
          value={form.name}
          onChange={(e) => handleIdentityFieldChange("name", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Hãng/Nguồn cung cấp</span>
        <input
          value={form.manufacturer}
          onChange={(e) => handleIdentityFieldChange("manufacturer", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Mã ATCC / Product Code</span>
        <input
          value={form.atccProductCode}
          onChange={(e) => handleIdentityFieldChange("atccProductCode", e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>

      {[
        { key: "lot", label: "Lot Number" },
        { key: "unit", label: "Đơn vị" },
        { key: "quantityIn", label: "Số lượng nhập", type: "number" },
        { key: "expiryDate", label: "Hạn dùng", type: "date" },
        { key: "storageLocation", label: "Vị trí lưu" },
      ].map((field) => (
        <label key={field.key} className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{field.label}</span>
          <input
            type={field.type ?? "text"}
            value={form[field.key as keyof StrainStockInFormState] as string}
            onChange={(e) => set({ [field.key]: e.target.value } as Partial<StrainStockInFormState>)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
      ))}

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Nhóm vi sinh</span>
        <input
          list="stock-in-strain-group-options"
          value={form.strainGroup}
          onChange={(e) => set({ strainGroup: e.target.value })}
          placeholder="Vi khuẩn, Nấm men hoặc nhóm mới"
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
        <datalist id="stock-in-strain-group-options">
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
