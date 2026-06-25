"use client";

import { useMemo, useState, useTransition } from "react";
import type { StockInSourceType } from "@prisma/client";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ChemicalStockInForm,
  type ChemicalStockInFormState,
} from "@/components/stock-in/ChemicalStockInForm";
import {
  StandardStockInForm,
  type StandardStockInFormState,
} from "@/components/stock-in/StandardStockInForm";
import {
  StrainStockInForm,
  type StrainStockInFormState,
} from "@/components/stock-in/StrainStockInForm";
import { StockInHistoryTable } from "@/components/stock-in/StockInHistoryTable";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { createStockIn } from "@/lib/actions/stock-in";
import type { StockInMasterOption } from "@/lib/services/stock-in-options";
import { STOCK_IN_TYPE_OPTIONS } from "@/lib/stock-in-fields";
import type { StaffView } from "@/lib/services/staff";
import type { StockInLogView } from "@/types";

const initialChemicalForm: ChemicalStockInFormState = {
  existingMasterId: "",
  code: "",
  name: "",
  chemicalGroup: "Dung môi",
  manufacturer: "",
  casNumber: "",
  productCode: "",
  lot: "",
  purity: "",
  uncertainty: "",
  unit: "",
  quantityIn: "",
  expiryDate: "",
  storageCondition: "",
  storageLocation: "",
  notes: "",
  coaPath: "",
};

const initialStandardForm: StandardStockInFormState = {
  existingMasterId: "",
  code: "",
  name: "",
  standardGroup: "CRM",
  manufacturer: "",
  casNumber: "",
  productCode: "",
  lot: "",
  purity: "",
  uncertainty: "",
  unit: "",
  quantityIn: "",
  expiryDate: "",
  afterOpenExpiry: "",
  storageCondition: "",
  storageLocation: "",
  notes: "",
  coaPath: "",
};

const initialStrainForm: StrainStockInFormState = {
  existingMasterId: "",
  code: "",
  name: "",
  strainGroup: "Vi khuẩn",
  manufacturer: "",
  atccProductCode: "",
  lot: "",
  unit: "",
  quantityIn: "",
  expiryDate: "",
  storageCondition: "",
  storageLocation: "",
  notes: "",
  coaPath: "",
};

type Tab = "form" | "history";

export function StockInClient({
  masterOptions,
  history,
  staff,
}: {
  masterOptions: StockInMasterOption[];
  history: StockInLogView[];
  staff: StaffView[];
}) {
  const { canEdit, role } = useRole();
  const { addToast } = useToast();
  const [tab, setTab] = useState<Tab>("form");
  const [sourceType, setSourceType] = useState<StockInSourceType>("Chemical");
  const [historyFilter, setHistoryFilter] = useState<"all" | StockInSourceType>("all");
  const [performedByStaffId, setPerformedByStaffId] = useState("");
  const [performedByCustom, setPerformedByCustom] = useState(USER_DISPLAY_NAME);
  const [chemicalForm, setChemicalForm] = useState(initialChemicalForm);
  const [standardForm, setStandardForm] = useState(initialStandardForm);
  const [strainForm, setStrainForm] = useState(initialStrainForm);
  const [pending, startTransition] = useTransition();

  const filteredOptions = useMemo(
    () => masterOptions.filter((item) => item.sourceType === sourceType),
    [masterOptions, sourceType],
  );

  const resetForms = () => {
    setChemicalForm(initialChemicalForm);
    setStandardForm(initialStandardForm);
    setStrainForm(initialStrainForm);
  };

  const appendFormFields = (fd: FormData, entries: Record<string, string>) => {
    for (const [key, value] of Object.entries(entries)) {
      fd.set(key, value);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      addToast("Bạn không có quyền nhập kho", "error");
      return;
    }

    const fd = new FormData(event.currentTarget);
    fd.set("user", role);
    fd.set("sourceType", sourceType);
    fd.set(
      "performedBy",
      performedByStaffId
        ? staff.find((item) => item.id === performedByStaffId)?.name ?? performedByCustom
        : performedByCustom,
    );

    if (sourceType === "Chemical") {
      appendFormFields(fd, chemicalForm);
    } else if (sourceType === "Standard") {
      appendFormFields(fd, standardForm);
    } else {
      appendFormFields(fd, strainForm);
    }

    startTransition(async () => {
      const result = await createStockIn(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã lưu nhập kho thành công", "success");
      resetForms();
      setTab("history");
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Quản lý tồn kho vật tư gốc</p>
          <h1 className="text-2xl font-semibold text-slate-900">Nhập kho</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("form")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "form" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Nhập kho
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "history" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Lịch sử nhập kho
          </button>
        </div>

        {tab === "history" ? (
          <StockInHistoryTable items={history} filter={historyFilter} onFilterChange={setHistoryFilter} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Loại nhập kho</span>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as StockInSourceType)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {STOCK_IN_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Người nhập</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={performedByStaffId}
                    onChange={(e) => setPerformedByStaffId(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="">Khác / tự nhập</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={performedByCustom}
                    onChange={(e) => setPerformedByCustom(e.target.value)}
                    placeholder="Tên người nhập"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              </label>
            </div>

            {sourceType === "Chemical" ? (
              <ChemicalStockInForm form={chemicalForm} options={filteredOptions} onChange={setChemicalForm} />
            ) : null}
            {sourceType === "Standard" ? (
              <StandardStockInForm form={standardForm} options={filteredOptions} onChange={setStandardForm} />
            ) : null}
            {sourceType === "MicrobialStrain" ? (
              <StrainStockInForm form={strainForm} options={filteredOptions} onChange={setStrainForm} />
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canEdit || pending}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {pending ? "Đang lưu..." : "Lưu nhập kho"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
