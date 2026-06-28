"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Download, Plus, Printer, Search, Trash2, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { CodeSequenceInput } from "@/components/shared/CodeSequenceInput";
import { PrintLabelButton } from "@/components/PrintLabelButton";
import { PrintLabelsDialog } from "@/components/PrintLabelsDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createPreparedChemical,
  deletePreparedChemical,
  previewNextPreparedChemicalBatchCode,
  updatePreparedChemical,
} from "@/lib/actions/prepared-chemicals";
import { groupedPreparedCell, type PreparedBatchRowMeta } from "@/lib/prepared-batch-rows";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { PreparedListParams } from "@/lib/services/prepared-list";
import { bulkImportPreparedChemicals } from "@/lib/actions/prepared-import";
import { formatCasProductSnapshot } from "@/lib/chemicals-fields";
import { PREPARED_CHEMICAL_FORM_FIELD_KEYS, buildPreparedChemicalExportRows } from "@/lib/prepared-chemicals-fields";
import { formatStockQty } from "@/lib/prepared-chemicals-stock";
import { PREPARED_CHEMICAL_STATUS_FILTERS } from "@/lib/prepared-chemical-status";
import {
  POPUP_BLOCKED_MESSAGE,
  getPreparedChemicalDefaultLabelCount,
  preparedChemicalToLabelData,
  printPreparedLabelsBulk,
} from "@/lib/print-label";
import { exportToXlsx } from "@/lib/excel";
import {
  PREPARED_CHEMICAL_EXCEL_COLUMNS,
  PREPARED_CHEMICAL_IMPORT_COLUMN_MAP,
} from "@/lib/prepared-excel";
import { formatDate } from "@/lib/utils";
import { StockLotPicker, applyDefaultLotIfSingle } from "@/components/StockLotPicker";
import { LOT_SELECTION_REQUIRED_MESSAGE } from "@/lib/inventory-lot-policy";
import { emptyStockLotSelection, requiresLotSelection } from "@/lib/stock-lot-selection";
import { InventoryItemPanel } from "@/components/inventory/InventoryItemPanel";
import { PreparationHistoryTimeline } from "@/components/preparation/PreparationHistoryTimeline";
import { PreparationTraceTree } from "@/components/preparation/PreparationTraceTree";
import { PreparationWorkflowPanel } from "@/components/preparation/PreparationWorkflowPanel";
import { AmendmentReasonDialog } from "@/components/preparation/AmendmentReasonDialog";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";
import {
  PREPARATION_WORKFLOW_FILTERS,
  PREPARATION_WORKFLOW_STATUS_LABELS,
} from "@/lib/preparation-workflow-labels";
import { PreparationIsoFormFields } from "@/components/preparation/PreparationIsoFormFields";
import { ConcentrationPairFields } from "@/components/preparation/ConcentrationPairFields";
import type { StaffView } from "@/lib/services/staff";
import type { ChemicalView, EnvironmentalLogView, PreparedChemicalView } from "@/types";

type IngredientFormRow = {
  key: string;
  chemicalId: string;
  chemicalName: string;
  casProductCode: string;
  stockLotId: string;
  lotNumber: string;
  quantityUsed: string;
  unit: string;
};

const initialForm = {
  parentCode: "",
  sequenceNumber: "",
  code: "",
  name: "",
  concentration: "",
  concentrationUnit: "",
  preparedQuantity: "",
  unit: "mL",
  preparedDate: "",
  expiryDate: "",
  preparedBy: "",
  storageLocation: "",
  storageCondition: "",
  formula: "",
  originalConcentration: "",
  finalConcentration: "",
  equipmentUsed: "",
  preparationCondition: "",
  equipmentId: "",
  attachmentUrl: "",
  notes: "",
};

type FormState = typeof initialForm;

function isoFieldsFromItem(item: PreparedChemicalView): Pick<
  FormState,
  | "formula"
  | "originalConcentration"
  | "finalConcentration"
  | "equipmentUsed"
  | "preparationCondition"
  | "equipmentId"
  | "attachmentUrl"
> {
  return {
    formula: item.formula,
    originalConcentration: item.originalConcentration,
    finalConcentration: item.finalConcentration,
    equipmentUsed: item.equipmentUsed,
    preparationCondition: item.preparationCondition,
    equipmentId: item.equipmentId ?? "",
    attachmentUrl: item.attachmentUrl,
  };
}

function emptyIngredient(): IngredientFormRow {
  return {
    key: crypto.randomUUID(),
    chemicalId: "",
    chemicalName: "",
    casProductCode: "",
    stockLotId: "",
    lotNumber: "",
    quantityUsed: "",
    unit: "",
  };
}

type PreparedChemicalBatchRow = PreparedChemicalView & PreparedBatchRowMeta & { stt: number };

export function PreparedChemicalsClient({
  result,
  listQuery,
  chemicals,
  staff,
  environmentalLogs = [],
}: {
  result: PaginatedResult<PreparedChemicalView & PreparedBatchRowMeta>;
  listQuery: PreparedListParams;
  chemicals: ChemicalView[];
  staff: StaffView[];
  environmentalLogs?: EnvironmentalLogView[];
}) {
  const router = useRouter();
  const { setQuery, setFilter, toggleSort } = useListQueryState();
  const [drawerTab, setDrawerTab] = useState("Chi tiết");
  const [selected, setSelected] = useState<PreparedChemicalView | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [previewBatchCode, setPreviewBatchCode] = useState("");
  const [ingredients, setIngredients] = useState<IngredientFormRow[]>([emptyIngredient()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreparedChemicalView | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [amendmentOpen, setAmendmentOpen] = useState(false);
  const [pendingAmendmentReason, setPendingAmendmentReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const chemicalOptions = useMemo(
    () => chemicals.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
    [chemicals],
  );

  useEffect(() => {
    if (isEditing || !isFormOpen) return;
    const fd = new FormData();
    const fixedParent = form.parentCode.trim();
    if (fixedParent) {
      fd.set("parentCode", fixedParent);
    } else {
      const seq = form.sequenceNumber.trim();
      if (!seq) {
        setPreviewBatchCode("");
        return;
      }
      fd.set("sequenceNumber", seq);
    }
    void previewNextPreparedChemicalBatchCode(fd).then((result) => {
      if ("success" in result && result.success && result.code) setPreviewBatchCode(result.code);
    });
  }, [form.parentCode, form.sequenceNumber, isEditing, isFormOpen]);

  const filtered = useMemo(
    () => result.items.map((item, index) => ({ ...item, stt: index + 1 })),
    [result.items],
  );

  const selectedRows = useMemo(
    () => result.items.filter((item) => selectedRowIds.has(item.id)),
    [result.items, selectedRowIds],
  );

  const bulkPrintItems = useMemo(
    () =>
      selectedRows.map((item) => ({
        data: preparedChemicalToLabelData(item),
        defaultQuantity: getPreparedChemicalDefaultLabelCount(item),
      })),
    [selectedRows],
  );

  const defaultBulkLabelTotal = useMemo(
    () => bulkPrintItems.reduce((sum, item) => sum + item.defaultQuantity, 0),
    [bulkPrintItems],
  );

  const handleBulkPrint = (options: { useDefaultQuantity: boolean; copiesPerSample: number }) => {
    const result = printPreparedLabelsBulk("prepared-chemical", bulkPrintItems, options);
    if (!result.ok) {
      if (result.reason === "popup-blocked") {
        addToast(POPUP_BLOCKED_MESSAGE, "error");
      } else if (result.reason === "empty") {
        addToast("Không có tem nhãn để in", "error");
      } else {
        addToast("Không thể tạo cửa sổ in tem nhãn", "error");
      }
      return;
    }
    addToast("Đã mở cửa sổ in tem nhãn", "success");
  };

  const openCreate = () => {
    setSelected(null);
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setAttachmentFile(null);
    setIngredients([emptyIngredient()]);
    setIsFormOpen(true);
  };

  const openReprepare = (item: PreparedChemicalView) => {
    setSelected(null);
    setIsEditing(false);
    setEditingId(null);
    setAttachmentFile(null);
    setForm({
      parentCode: item.parentCode || item.code.replace(/-\d{3}$/, ""),
      sequenceNumber: "",
      code: "",
      name: item.name,
      concentration: item.concentration,
      concentrationUnit: item.concentrationUnit,
      preparedQuantity: String(item.preparedQuantity),
      unit: item.unit,
      preparedDate: "",
      expiryDate: "",
      preparedBy: item.preparedBy,
      storageLocation: item.storageLocation,
      storageCondition: item.storageCondition,
      notes: item.notes,
      ...isoFieldsFromItem(item),
    });
    setIngredients(
      item.ingredients.length
        ? item.ingredients.map((ing) => ({
            key: crypto.randomUUID(),
            chemicalId: ing.chemicalId,
            chemicalName: ing.chemicalName,
            casProductCode: ing.casProductCode,
            stockLotId: ing.stockLotId ?? "",
            lotNumber: ing.lotNumber,
            quantityUsed: String(ing.quantityUsed),
            unit: ing.unit,
          }))
        : [emptyIngredient()],
    );
    setIsFormOpen(true);
  };

  const openEdit = (item: PreparedChemicalView) => {
    if (item.workflowStatus === "Prepared" || item.workflowStatus === "Checked") {
      addToast("Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước", "error");
      return;
    }
    if (item.workflowStatus === "Approved") {
      setSelected(null);
      setIsEditing(true);
      setEditingId(item.id);
      setAttachmentFile(null);
      setForm({
        parentCode: item.parentCode,
        sequenceNumber: "",
        code: item.code,
        name: item.name,
        concentration: item.concentration,
        concentrationUnit: item.concentrationUnit,
        preparedQuantity: String(item.preparedQuantity),
        unit: item.unit,
        preparedDate: item.preparedDate,
        expiryDate: item.expiryDate,
        preparedBy: item.preparedBy,
        storageLocation: item.storageLocation,
        storageCondition: item.storageCondition,
        notes: item.notes,
        ...isoFieldsFromItem(item),
      });
      setIngredients(
        item.ingredients.length
          ? item.ingredients.map((ing) => ({
              key: ing.id,
              chemicalId: ing.chemicalId,
              chemicalName: ing.chemicalName,
              casProductCode: ing.casProductCode,
              stockLotId: ing.stockLotId ?? "",
              lotNumber: ing.lotNumber,
              quantityUsed: String(ing.quantityUsed),
              unit: ing.unit,
            }))
          : [emptyIngredient()],
      );
      setAmendmentOpen(true);
      return;
    }
    setSelected(null);
    setIsEditing(true);
    setEditingId(item.id);
    setAttachmentFile(null);
    setForm({
      parentCode: item.parentCode,
      sequenceNumber: "",
      code: item.code,
      name: item.name,
      concentration: item.concentration,
      concentrationUnit: item.concentrationUnit,
      preparedQuantity: String(item.preparedQuantity),
      unit: item.unit,
      preparedDate: item.preparedDate,
      expiryDate: item.expiryDate,
      preparedBy: item.preparedBy,
      storageLocation: item.storageLocation,
      storageCondition: item.storageCondition,
      notes: item.notes,
      ...isoFieldsFromItem(item),
    });
    setIngredients(
      item.ingredients.length
        ? item.ingredients.map((ing) => ({
            key: ing.id,
            chemicalId: ing.chemicalId,
            chemicalName: ing.chemicalName,
            casProductCode: ing.casProductCode,
            stockLotId: ing.stockLotId ?? "",
            lotNumber: ing.lotNumber,
            quantityUsed: String(ing.quantityUsed),
            unit: ing.unit,
          }))
        : [emptyIngredient()],
    );
    setIsFormOpen(true);
  };

  const updateIngredient = (key: string, patch: Partial<IngredientFormRow>) => {
    setIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const selectChemical = (key: string, chemicalId: string) => {
    const chemical = chemicals.find((c) => c.id === chemicalId);
    if (!chemical) return;
    const lotPick = applyDefaultLotIfSingle(chemical.stockLots, emptyStockLotSelection());
    updateIngredient(key, {
      chemicalId,
      chemicalName: chemical.name,
      casProductCode: formatCasProductSnapshot(chemical.casNumber, chemical.productCode),
      stockLotId: lotPick.stockLotId,
      lotNumber: lotPick.lotNumber || chemical.lot,
      unit: chemical.unit,
    });
  };

  const submitForm = (amendmentReason = "") => {
    if ((!form.parentCode.trim() && !form.sequenceNumber.trim()) || !form.name.trim()) {
      addToast("Mã hóa chất pha và tên là bắt buộc", "error");
      return;
    }
    if (isEditing && !form.code.trim()) {
      addToast("Mã lô không hợp lệ", "error");
      return;
    }
    if (!form.preparedDate || !form.expiryDate) {
      addToast("Ngày pha chế và ngày hết hạn là bắt buộc", "error");
      return;
    }
    const validIngredients = ingredients.filter((row) => row.chemicalId && row.quantityUsed.trim());
    if (!validIngredients.length) {
      addToast("Cần ít nhất một hóa chất gốc", "error");
      return;
    }
    for (const row of validIngredients) {
      const qty = Number(row.quantityUsed);
      if (!Number.isFinite(qty) || qty <= 0) {
        addToast("Thể tích/khối lượng sử dụng không hợp lệ", "error");
        return;
      }
      const chemical = chemicals.find((c) => c.id === row.chemicalId);
      if (chemical && requiresLotSelection(chemical.stockLots) && !row.stockLotId) {
        addToast(`${LOT_SELECTION_REQUIRED_MESSAGE} (${chemical.name})`, "error");
        return;
      }
    }

    const fd = new FormData();
    fd.set("user", role);
    PREPARED_CHEMICAL_FORM_FIELD_KEYS.forEach((key) => fd.set(key, String(form[key] ?? "")));
    fd.set("attachmentUrl", form.attachmentUrl);
    if (attachmentFile) fd.set("attachment", attachmentFile);
    fd.set(
      "ingredients",
      JSON.stringify(
        validIngredients.map((row) => ({
          chemicalId: row.chemicalId,
          stockLotId: row.stockLotId || null,
          lotNumber: row.lotNumber,
          quantityUsed: Number(row.quantityUsed),
          unit: row.unit,
        })),
      ),
    );
    if (isEditing && editingId) fd.set("id", editingId);
    if (amendmentReason) fd.set("amendmentReason", amendmentReason);

    startTransition(async () => {
      const result = isEditing ? await updatePreparedChemical(fd) : await createPreparedChemical(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        isEditing
          ? "Đã cập nhật hóa chất pha chế"
          : "Đã tạo nháp — chuyển sang Đã pha chế để trừ tồn kho",
        "success",
      );
      setIsFormOpen(false);
      setAmendmentOpen(false);
      setPendingAmendmentReason("");
      setAttachmentFile(null);
      router.refresh();
    });
  };

  const handleSubmit = () => submitForm(pendingAmendmentReason);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const fd = new FormData();
    fd.set("user", role);
    fd.set("id", target.id);
    startTransition(async () => {
      const result = await deletePreparedChemical(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa hóa chất pha chế", "success");
      if (selected?.id === target.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    exportToXlsx(
      "hoa-chat-pha-che",
      buildPreparedChemicalExportRows(filtered),
      PREPARED_CHEMICAL_EXCEL_COLUMNS,
    );
    addToast("Đã export Excel", "success");
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("rows", JSON.stringify(rows));
    const result = await bulkImportPreparedChemicals(fd);
    return result;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Pha chế</p>
            <h1 className="text-2xl font-semibold text-slate-900">Hóa chất pha chế</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Thêm hóa chất pha
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={listQuery.q}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm hóa chất pha..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PREPARATION_WORKFLOW_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter("workflow", s === "All" ? null : s)}
                className={`rounded-xl px-3 py-2 text-sm ${listQuery.workflow === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {s === "All"
                  ? "Tất cả quy trình"
                  : PREPARATION_WORKFLOW_STATUS_LABELS[s as keyof typeof PREPARATION_WORKFLOW_STATUS_LABELS]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PREPARED_CHEMICAL_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter("status", s === "All" ? null : s)}
                className={`rounded-xl px-3 py-2 text-sm ${listQuery.status === s ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {s === "All" ? "Tất cả trạng thái" : s}
              </button>
            ))}
          </div>
        </div>

        {selectedRowIds.size > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-800">Đã chọn: {selectedRowIds.size} mục</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrintDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              >
                <Printer className="h-4 w-4" />
                In tem nhãn
              </button>
              <button
                type="button"
                onClick={() => setSelectedRowIds(new Set())}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        ) : null}

        <DataTable
          columns={[
            { key: "stt", header: "STT" },
            {
              key: "parentCode",
              header: "Mã nhóm",
              sortable: true,
              sortKey: "parentCode",
              render: (_v, row: PreparedChemicalBatchRow) =>
                groupedPreparedCell(row.showGroupFields, row.parentCode),
            },
            { key: "code", header: "Mã lô", sortable: true, sortKey: "code" },
            {
              key: "name",
              header: "Tên hóa chất pha",
              sortable: true,
              sortKey: "name",
              render: (_v, row: PreparedChemicalBatchRow) =>
                groupedPreparedCell(row.showGroupFields, row.name),
            },
            {
              key: "formula",
              header: "Công thức",
              render: (_v, row: PreparedChemicalBatchRow) =>
                groupedPreparedCell(row.showGroupFields, row.formula || "-"),
            },
            { key: "concentration", header: "Nồng độ lý thuyết" },
            { key: "concentrationUnit", header: "Đơn vị nồng độ" },
            {
              key: "finalConcentration",
              header: "Nồng độ thực tế",
              render: (_v, row: PreparedChemicalBatchRow) =>
                groupedPreparedCell(row.showGroupFields, row.finalConcentration || "-"),
            },
            {
              key: "preparedQuantity",
              header: "Thể tích/Khối lượng pha chế",
              render: (_v, row) => `${row.preparedQuantity} ${row.unit}`.trim(),
            },
            {
              key: "preparedDate",
              header: "Ngày pha chế",
              sortable: true,
              sortKey: "preparedDate",
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
            {
              key: "expiryDate",
              header: "Ngày hết hạn",
              sortable: true,
              sortKey: "expiryDate",
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
            { key: "preparedBy", header: "Người pha", sortable: true, sortKey: "preparedBy" },
            {
              key: "workflowStatus",
              header: "Quy trình",
              sortable: true,
              sortKey: "workflowStatus",
              render: (_v, row) => <WorkflowStatusBadge status={row.workflowStatus} />,
            },
            {
              key: "ingredientsSummary",
              header: "Hóa chất gốc sử dụng",
              render: (_v, row) => (
                <div className="space-y-1 text-xs leading-5">
                  {row.ingredients.map((ing) => (
                    <p key={ing.id}>{ing.displayLine}</p>
                  ))}
                </div>
              ),
            },
            {
              key: "status",
              header: "Trạng thái",
              sortable: true,
              sortKey: "status",
              render: (v) => <StatusBadge status={String(v)} />,
            },
            { key: "storageLocation", header: "Vị trí lưu" },
          ]}
          rows={filtered}
          sort={{
            sortBy: listQuery.sortBy,
            sortOrder: listQuery.sortOrder,
            sortActive: listQuery.sortActive,
            onSort: toggleSort,
          }}
          getRowKey={(row) => row.rowKey}
          onRowClick={(row) => {
            setSelected(row);
            setDrawerTab("Chi tiết");
          }}
          selection={{
            getRowId: (row) => row.id,
            selectedIds: selectedRowIds,
            onSelectedIdsChange: setSelectedRowIds,
          }}
          rowActionsHeader="Hành động"
          rowActions={
            canManage
              ? (row) => (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                )
              : undefined
          }
        />

        <DetailDrawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.name ?? ""}
          subtitle={selected?.code}
          tabs={["Chi tiết", "Tồn kho", "Lịch sử", "Truy xuất"]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          layout="stacked"
          maxWidth="5xl"
          actions={
            selected ? (
              <>
                <PrintLabelButton
                  template="prepared-chemical"
                  data={preparedChemicalToLabelData(selected)}
                />
                {canEdit && selected.workflowStatus === "Rejected" ? (
                  <button
                    type="button"
                    onClick={() => {
                      openReprepare(selected);
                      setSelected(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 px-3 py-2 text-sm text-cyan-800"
                  >
                    <Plus className="h-4 w-4" />
                    Pha lại
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Sửa
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                ) : null}
              </>
            ) : undefined
          }
          tabContent={
            selected ? (
              drawerTab === "Tồn kho" ? (
                <InventoryItemPanel
                  sourceType="PreparedChemical"
                  sourceId={selected.id}
                  sourceCode={selected.code}
                  unit={selected.unit}
                  inventoryStatus={selected.inventoryStatus}
                  canEdit={canEdit}
                  canManage={canManage}
                  onSuccess={(msg) => addToast(msg, "success")}
                  onError={(msg) => addToast(msg, "error")}
                />
              ) : drawerTab === "Lịch sử" ? (
                <PreparationHistoryTimeline
                  preparationType="CHEMICAL"
                  preparationId={selected.id}
                  role={role}
                />
              ) : drawerTab === "Truy xuất" ? (
                <PreparationTraceTree
                  preparationType="CHEMICAL"
                  preparationId={selected.id}
                />
              ) : (
              <div className="space-y-4">
                <PreparationWorkflowPanel
                  preparationType="CHEMICAL"
                  recordId={selected.id}
                  workflowStatus={selected.workflowStatus}
                  version={selected.version}
                  staff={staff}
                  canEdit={canEdit}
                  role={role}
                  onChanged={() => router.refresh()}
                  onError={(msg) => addToast(msg, "error")}
                  onSuccess={(msg) => addToast(msg, "success")}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Mã hóa chất pha</p>
                    <p className="font-medium">{selected.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tên hóa chất pha</p>
                    <p className="font-medium">{selected.name}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Công thức</p>
                    <p className="font-medium whitespace-pre-wrap">{selected.formula || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nồng độ lý thuyết</p>
                    <p className="font-medium">{selected.concentration || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Đơn vị nồng độ</p>
                    <p className="font-medium">{selected.concentrationUnit || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nồng độ thực tế</p>
                    <p className="font-medium">
                      {[selected.finalConcentration, selected.concentrationUnit].filter(Boolean).join(" ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Thể tích/Khối lượng pha chế</p>
                    <p className="font-medium">
                      {selected.preparedQuantity} {selected.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ngày pha chế</p>
                    <p className="font-medium">{formatDate(selected.preparedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ngày hết hạn</p>
                    <p className="font-medium">{formatDate(selected.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Người pha</p>
                    <p className="font-medium">{selected.preparedBy || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vị trí lưu</p>
                    <p className="font-medium">{selected.storageLocation || "-"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Điều kiện bảo quản</p>
                    <p className="font-medium whitespace-pre-wrap">{selected.storageCondition || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Ghi chú</p>
                    <p className="font-medium whitespace-pre-wrap">{selected.notes || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-slate-500">Hóa chất gốc sử dụng</p>
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    {selected.ingredients.map((ing) => (
                      <div key={ing.id} className="grid gap-2 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0 sm:grid-cols-5">
                        <p>{ing.chemicalName}</p>
                        <p className="text-slate-600">{ing.casProductCode || "/"}</p>
                        <p className="text-slate-600">{ing.lotNumber || "/"}</p>
                        <p>
                          {ing.quantityUsed} {ing.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )
            ) : null
          }
        />

        <ModalShell
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          className="max-w-4xl rounded-2xl bg-white p-6 shadow-2xl"
        >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {isEditing ? "Sửa hóa chất pha chế" : "Thêm hóa chất pha chế"}
                </h2>
                <button type="button" onClick={() => setIsFormOpen(false)}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {!isEditing && form.parentCode.trim() ? (
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">Mã master (pha lại)</label>
                    <input
                      readOnly
                      value={form.parentCode}
                      className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm"
                    />
                  </div>
                ) : (
                  <CodeSequenceInput
                    prefix="PCHEM"
                    sequence={form.sequenceNumber}
                    onSequenceChange={(value) => setForm((p) => ({ ...p, sequenceNumber: value, parentCode: "" }))}
                    mode={isEditing ? "edit" : "create"}
                    label="Mã hóa chất pha"
                    disabled={isEditing}
                  />
                )}
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Mã lô {isEditing ? "" : "(tự sinh)"}</label>
                  <input
                    readOnly
                    value={isEditing ? form.code : previewBatchCode}
                    placeholder={isEditing ? "" : "Nhập số thứ tự để xem mã lô"}
                    className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Tên hóa chất pha</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-slate-600">Công thức</label>
                  <input
                    value={form.formula}
                    onChange={(e) => setForm((p) => ({ ...p, formula: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <ConcentrationPairFields
                  concentration={form.concentration}
                  finalConcentration={form.finalConcentration}
                  concentrationUnit={form.concentrationUnit}
                  onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                  unitPlaceholder="vd: %, ppm, mg/L"
                />
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Thể tích/Khối lượng pha chế</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.preparedQuantity}
                    onChange={(e) => setForm((p) => ({ ...p, preparedQuantity: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">ĐVT</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Ngày pha chế</label>
                  <input
                    type="date"
                    value={form.preparedDate}
                    onChange={(e) => setForm((p) => ({ ...p, preparedDate: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Người pha</label>
                  <input
                    value={form.preparedBy}
                    onChange={(e) => setForm((p) => ({ ...p, preparedBy: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Vị trí lưu</label>
                  <input
                    value={form.storageLocation}
                    onChange={(e) => setForm((p) => ({ ...p, storageLocation: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-slate-600">Điều kiện bảo quản</label>
                  <input
                    value={form.storageCondition}
                    onChange={(e) => setForm((p) => ({ ...p, storageCondition: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <PreparationIsoFormFields
                  form={form}
                  onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                  environmentalLogs={environmentalLogs}
                  attachmentFile={attachmentFile}
                  onAttachmentChange={setAttachmentFile}
                />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Hóa chất gốc sử dụng</h3>
                    <p className="text-xs text-slate-500">
                      Có thể thêm không giới hạn dòng. Số lượng nhập theo ĐVT của từng hóa chất gốc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIngredients((rows) => [...rows, emptyIngredient()])}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm dòng
                  </button>
                </div>

                <div className="space-y-3">
                  {ingredients.map((row, index) => {
                    const stock = chemicals.find((c) => c.id === row.chemicalId);
                    return (
                    <div key={row.key} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 text-xs font-medium text-slate-500">STT {index + 1}</div>
                      <div className="grid gap-3 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-slate-600">Tên hóa chất gốc</label>
                          <select
                            value={row.chemicalId}
                            onChange={(e) => selectChemical(row.key, e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm"
                          >
                            <option value="">Chọn hóa chất gốc</option>
                            {chemicalOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {stock ? (
                            <p className="mt-1 text-xs text-cyan-700">
                              Tồn kho: {formatStockQty(stock.quantity)}
                              {stock.unit ? ` ${stock.unit}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">CAS / PRODUCT CODE</label>
                          <input
                            readOnly
                            value={row.casProductCode || "/"}
                            className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Lot Number</label>
                          <StockLotPicker
                            stockLots={stock?.stockLots ?? []}
                            value={{ stockLotId: row.stockLotId, lotNumber: row.lotNumber }}
                            onChange={(lot) =>
                              updateIngredient(row.key, {
                                stockLotId: lot.stockLotId,
                                lotNumber: lot.lotNumber,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Số lượng sử dụng</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.quantityUsed}
                            onChange={(e) => updateIngredient(row.key, { quantityUsed: e.target.value })}
                            className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-slate-600">ĐVT</label>
                            <input
                              readOnly
                              value={row.unit || "-"}
                              className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm text-slate-600"
                            />
                          </div>
                          {ingredients.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => setIngredients((rows) => rows.filter((r) => r.key !== row.key))}
                              className="mb-0.5 rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                              aria-label="Xóa dòng"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Đang lưu..." : isEditing ? "Cập nhật" : "Lưu"}
                </button>
              </div>
        </ModalShell>

        <PrintLabelsDialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          selectedCount={selectedRowIds.size}
          defaultLabelTotal={defaultBulkLabelTotal}
          onConfirm={handleBulkPrint}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Xóa hóa chất pha chế"
          message={`Xác nhận xóa mềm "${deleteTarget?.name}"? Tồn kho sẽ được hoàn lại nếu đã trừ.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <AmendmentReasonDialog
          open={amendmentOpen}
          onCancel={() => {
            setAmendmentOpen(false);
            setIsFormOpen(true);
          }}
          onConfirm={(reason) => {
            setPendingAmendmentReason(reason);
            setAmendmentOpen(false);
            setIsFormOpen(true);
          }}
        />

        <ExcelImportDialog
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            void router.refresh();
          }}
          title="Import hóa chất pha chế"
          columnMap={PREPARED_CHEMICAL_IMPORT_COLUMN_MAP}
          onImport={handleImport}
        />
      </div>
    </AppShell>
  );
}
