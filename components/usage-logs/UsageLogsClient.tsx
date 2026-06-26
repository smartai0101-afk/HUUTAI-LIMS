"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UsageSourceType } from "@prisma/client";
import { Download, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ModalShell } from "@/components/ModalShell";
import { StatusBadge } from "@/components/StatusBadge";
import { UsageStatsPanel } from "@/components/usage-logs/UsageStatsPanel";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { StockLotPicker } from "@/components/StockLotPicker";
import { createUsageLog, deleteUsageLog } from "@/lib/actions/usage-logs";
import {
  emptyStockLotSelection,
  pickDefaultStockLot,
  requiresLotSelection,
  type StockLotSelection,
} from "@/lib/stock-lot-selection";
import type { UsageLogItemOption } from "@/lib/services/usage-log-options";
import type {
  UsageEmployeeStatRow,
  UsageItemStatRow,
  UsagePeriodStatRow,
  UsagePurposeStatRow,
} from "@/lib/services/usage-log-stats";
import type { StaffView } from "@/lib/services/staff";
import {
  USAGE_LOG_TYPE_LABELS,
  USAGE_PURPOSE_SUGGESTIONS,
  type UsageStatsPeriodPreset,
} from "@/lib/usage-log-fields";
import { downloadCsv } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { UsageLogView } from "@/types";

const transactionTypes = ["All", "IN", "OUT", "USE", "DISPOSE"];
const sourceTypeFilters: Array<{ value: "all" | UsageSourceType; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "Chemical", label: "Hoá chất gốc" },
  { value: "Standard", label: "Chất chuẩn gốc" },
  { value: "MicrobialStrain", label: "Chủng gốc vi sinh" },
];

type FormState = {
  date: string;
  type: string;
  sourceType: UsageSourceType;
  sourceId: string;
  quantity: number;
  unit: string;
  staffMode: "list" | "custom";
  performedByStaffId: string;
  performedByCustom: string;
  purpose: string;
  purposeCustom: string;
  notes: string;
  referenceCode: string;
  stockLot: StockLotSelection;
};

function buildInitialForm(defaultPerformer: string): FormState {
  return {
    date: new Date().toISOString().slice(0, 10),
    type: "USE",
    sourceType: "Chemical",
    sourceId: "",
    quantity: 0,
    unit: "L",
    staffMode: "list",
    performedByStaffId: "",
    performedByCustom: defaultPerformer,
    purpose: USAGE_PURPOSE_SUGGESTIONS[0],
    purposeCustom: "",
    notes: "",
    referenceCode: "",
    stockLot: emptyStockLotSelection(),
  };
}

export function UsageLogsClient({
  items,
  itemOptions,
  staff,
  employeeStats,
  itemStats,
  periodStatsByDay,
  periodStatsByWeek,
  periodStatsByMonth,
  purposeStats,
  employeeNames,
  statsPeriod,
}: {
  items: UsageLogView[];
  itemOptions: UsageLogItemOption[];
  staff: StaffView[];
  employeeStats: UsageEmployeeStatRow[];
  itemStats: UsageItemStatRow[];
  periodStatsByDay: UsagePeriodStatRow[];
  periodStatsByWeek: UsagePeriodStatRow[];
  periodStatsByMonth: UsagePeriodStatRow[];
  purposeStats: UsagePurposeStatRow[];
  employeeNames: string[];
  statsPeriod: UsageStatsPeriodPreset;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"journal" | "stats">(
    searchParams.get("tab") === "stats" ? "stats" : "journal",
  );
  const [selectedType, setSelectedType] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceTypeFilters)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get("openForm") === "1");
  const [form, setForm] = useState<FormState>(() => buildInitialForm(USER_DISPLAY_NAME));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const defaultStaffName = useMemo(() => {
    const match = staff.find((member) => member.name === USER_DISPLAY_NAME);
    return match?.name ?? staff[0]?.name ?? USER_DISPLAY_NAME;
  }, [staff]);

  useEffect(() => {
    const defaultStaff = staff.find((member) => member.name === USER_DISPLAY_NAME) ?? staff[0];
    if (!defaultStaff) return;
    setForm((prev) => ({
      ...prev,
      performedByStaffId: prev.performedByStaffId || defaultStaff.id,
      performedByCustom: prev.performedByCustom || defaultStaff.name,
    }));
  }, [staff]);

  useEffect(() => {
    const sourceType = searchParams.get("sourceType") as UsageSourceType | null;
    const code = searchParams.get("code");
    if (!sourceType || !code) return;
    const option = itemOptions.find((item) => item.sourceType === sourceType && item.code === code);
    if (!option) return;
    setForm((prev) => ({
      ...prev,
      sourceType: option.sourceType,
      sourceId: option.id,
      unit: option.unit || prev.unit,
      stockLot: pickDefaultStockLot(option.stockLots) ?? emptyStockLotSelection(),
    }));
    setIsFormOpen(true);
    setActiveTab("journal");
  }, [itemOptions, searchParams]);

  const filteredItemOptions = useMemo(
    () => itemOptions.filter((item) => item.sourceType === form.sourceType),
    [form.sourceType, itemOptions],
  );

  const selectedItem = useMemo(
    () => itemOptions.find((item) => item.id === form.sourceId) ?? null,
    [form.sourceId, itemOptions],
  );

  const rows = useMemo(() => {
    return items.filter((row) => {
      const matchType = selectedType === "All" || row.type === selectedType;
      const matchSource = sourceFilter === "all" || row.sourceType === sourceFilter;
      const matchQuery = [row.itemCode, row.itemName, row.performedBy, row.purpose, row.sourceLabel, row.notes].some(
        (value) => value.toLowerCase().includes(query.toLowerCase()),
      );
      return matchType && matchSource && matchQuery;
    });
  }, [items, query, selectedType, sourceFilter]);

  const handleSourceTypeChange = (sourceType: UsageSourceType) => {
    setForm((prev) => ({
      ...prev,
      sourceType,
      sourceId: "",
      unit: "L",
      stockLot: emptyStockLotSelection(),
    }));
  };

  const handleItemChange = (sourceId: string) => {
    const item = itemOptions.find((option) => option.id === sourceId);
    setForm((prev) => ({
      ...prev,
      sourceId,
      unit: item?.unit ?? prev.unit,
      stockLot: item ? pickDefaultStockLot(item.stockLots) ?? emptyStockLotSelection() : emptyStockLotSelection(),
    }));
  };

  const resolvePerformedBy = () => {
    if (form.staffMode === "custom") return form.performedByCustom.trim();
    const member = staff.find((row) => row.id === form.performedByStaffId);
    return member?.name ?? form.performedByCustom.trim();
  };

  const resolvePurpose = () => {
    if (form.purpose === "Khác") return form.purposeCustom.trim();
    return form.purpose.trim();
  };

  const handleSubmit = () => {
    const performedBy = resolvePerformedBy();
    const purpose = resolvePurpose();

    if (!form.sourceId || !form.date || form.quantity <= 0 || !form.unit || !performedBy || !purpose) {
      addToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    if (form.type !== "IN" && selectedItem && form.quantity > selectedItem.quantity) {
      addToast("Số lượng vượt quá tồn kho hiện có", "error");
      return;
    }

    if (selectedItem && requiresLotSelection(selectedItem.stockLots) && !form.stockLot.stockLotId) {
      addToast("Vui lòng chọn lot khi vật tư có nhiều lot", "error");
      return;
    }

    const fd = new FormData();
    fd.set("user", role);
    fd.set("sourceType", form.sourceType);
    fd.set("sourceId", form.sourceId);
    fd.set("type", form.type);
    fd.set("date", form.date);
    fd.set("quantity", String(form.quantity));
    fd.set("unit", form.unit);
    fd.set("performedBy", performedBy);
    if (form.staffMode === "list" && form.performedByStaffId) {
      fd.set("performedByStaffId", form.performedByStaffId);
    }
    fd.set("purpose", purpose);
    fd.set("notes", form.notes);
    fd.set("referenceCode", form.referenceCode);
    if (form.stockLot.stockLotId) {
      fd.set("stockLotId", form.stockLot.stockLotId);
    }

    startTransition(async () => {
      const result = await createUsageLog(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã tạo nhật ký sử dụng", "success");
      setForm(buildInitialForm(defaultStaffName));
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const fd = new FormData();
    fd.set("user", role);
    fd.set("id", deleteId);
    startTransition(async () => {
      const result = await deleteUsageLog(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xoá nhật ký", "success");
      setDeleteId(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    downloadCsv(
      "usage-logs-export",
      rows.map((item) => ({
        date: item.date,
        type: item.type,
        sourceType: item.sourceLabel,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        performedBy: item.performedBy,
        purpose: item.purpose,
        referenceCode: item.referenceCode,
        notes: item.notes,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  const openCreateForm = () => {
    const initial = buildInitialForm(defaultStaffName);
    const defaultStaff = staff.find((member) => member.name === defaultStaffName);
    setForm({
      ...initial,
      performedByStaffId: defaultStaff?.id ?? "",
      performedByCustom: defaultStaffName,
    });
    setIsFormOpen(true);
  };

  const changeStatsPeriod = (period: UsageStatsPeriodPreset) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.set("tab", "stats");
    router.push(`/usage-logs?${params.toString()}`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Operation</p>
            <h1 className="text-2xl font-semibold text-slate-900">Nhật ký sử dụng</h1>
          </div>
          <div className="flex gap-2">
            {activeTab === "journal" ? (
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            ) : null}
            {canEdit && activeTab === "journal" ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Tạo nhật ký
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "journal", label: "Nhật ký" },
            { id: "stats", label: "Thống kê" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as "journal" | "stats");
                const params = new URLSearchParams(searchParams.toString());
                params.set("tab", tab.id);
                router.push(`/usage-logs?${params.toString()}`);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === tab.id ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "journal" ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm mã, tên, nhân viên, mục đích..."
                    className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourceTypeFilters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSourceFilter(filter.value)}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        sourceFilter === filter.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {transactionTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        selectedType === type ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {type === "All" ? "Tất cả loại GD" : (USAGE_LOG_TYPE_LABELS[type] ?? type)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "date", header: "Ngày", render: (v) => formatDate(String(v)) },
                { key: "type", header: "Loại", render: (v) => <StatusBadge status={String(v)} /> },
                { key: "sourceLabel", header: "Loại vật tư" },
                { key: "itemCode", header: "Mã" },
                { key: "itemName", header: "Tên" },
                { key: "quantity", header: "Số lượng", render: (_, row) => `${row.quantity} ${row.unit}` },
                { key: "performedBy", header: "Người thực hiện" },
                { key: "purpose", header: "Mục đích" },
                { key: "notes", header: "Ghi chú" },
                {
                  key: "id",
                  header: "",
                  render: (_v, row) =>
                    canManage ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(row.id);
                        }}
                        className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null,
                },
              ]}
              rows={rows}
            />
          </>
        ) : (
          <UsageStatsPanel
            employeeStats={employeeStats}
            itemStats={itemStats}
            periodStatsByDay={periodStatsByDay}
            periodStatsByWeek={periodStatsByWeek}
            periodStatsByMonth={periodStatsByMonth}
            purposeStats={purposeStats}
            employeeNames={employeeNames}
            statsPeriod={statsPeriod}
            onPeriodChange={changeStatsPeriod}
          />
        )}

        <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Tạo nhật ký sử dụng</h2>
            <button type="button" onClick={() => setIsFormOpen(false)}>
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {sourceTypeFilters
                .filter((filter) => filter.value !== "all")
                .map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleSourceTypeChange(filter.value as UsageSourceType)}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      form.sourceType === filter.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">Vật tư</label>
                <select
                  value={form.sourceId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  <option value="">Chọn vật tư...</option>
                  {filteredItemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              {selectedItem && selectedItem.stockLots.length > 0 ? (
                <div className="sm:col-span-2">
                  <StockLotPicker
                    stockLots={selectedItem.stockLots}
                    value={form.stockLot}
                    onChange={(stockLot) => setForm((prev) => ({ ...prev, stockLot }))}
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm text-slate-600">Loại giao dịch</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {(["USE", "OUT", "IN", "DISPOSE"] as const).map((type) => (
                    <option key={type} value={type}>
                      {USAGE_LOG_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Ngày</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Số lượng</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Đơn vị</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Người thực hiện</label>
                <select
                  value={form.staffMode === "custom" ? "custom" : form.performedByStaffId}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setForm((prev) => ({ ...prev, staffMode: "custom" }));
                      return;
                    }
                    const member = staff.find((row) => row.id === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      staffMode: "list",
                      performedByStaffId: e.target.value,
                      performedByCustom: member?.name ?? prev.performedByCustom,
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.department ? ` (${member.department})` : ""}
                    </option>
                  ))}
                  <option value="custom">Khác (nhập tay)</option>
                </select>
              </div>
              {form.staffMode === "custom" ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Tên người thực hiện</label>
                  <input
                    value={form.performedByCustom}
                    onChange={(e) => setForm((prev) => ({ ...prev, performedByCustom: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm text-slate-600">Mục đích</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {USAGE_PURPOSE_SUGGESTIONS.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                  <option value="Khác">Khác</option>
                </select>
              </div>
              {form.purpose === "Khác" ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Mục đích (nhập tay)</label>
                  <input
                    value={form.purposeCustom}
                    onChange={(e) => setForm((prev) => ({ ...prev, purposeCustom: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm text-slate-600">Mã tham chiếu</label>
                <input
                  value={form.referenceCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, referenceCode: e.target.value }))}
                  placeholder="Mẫu thí nghiệm, phiếu pha chế..."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              Huỷ
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {pending ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </ModalShell>

        <ConfirmDialog
          open={!!deleteId}
          title="Xoá nhật ký?"
          message="Tồn kho vật tư gốc sẽ được hoàn tác theo loại giao dịch."
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </AppShell>
  );
}
