"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Edit, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { FilterChipBar } from "@/components/FilterChipBar";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { StatusBadge } from "@/components/StatusBadge";
import { CoaLink } from "@/components/standards/CoaLink";
import { CatalogPreparedDerivatives } from "@/components/preparation/CatalogPreparedDerivatives";
import { CodeSequenceInput } from "@/components/shared/CodeSequenceInput";
import { parseMasterCode, formatSequenceDisplay } from "@/lib/code-prefixes";
import { InventoryItemPanel } from "@/components/inventory/InventoryItemPanel";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { bulkImportStandards, previewStandardsImport } from "@/lib/actions/catalog-import";
import { createStandard, deleteStandard, updateStandard } from "@/lib/actions/standards";
import { deleteStockLot } from "@/lib/actions/stock-lot";
import {
  STANDARD_FORM_FIELD_KEYS,
  STANDARD_GROUP_FILTER_ALL,
  buildStandardGroupFilterOptions,
  STANDARD_IMPORT_COLUMN_MAP,
} from "@/lib/standards-fields";
import { CATALOG_EXCEL, buildCatalogExportRows } from "@/lib/catalog-excel";
import { groupedCell, type CatalogLotRowMeta } from "@/lib/catalog-lot-rows";
import { exportToXlsx } from "@/lib/excel";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { CatalogListParams } from "@/lib/services/catalog-lot-list";
import { computeStandardStatus, STANDARD_STATUS_FILTERS, standardStatusLabel } from "@/lib/standard-status";
import { formatDate } from "@/lib/utils";
import type { StandardView } from "@/types";

type StandardLotRow = StandardView & CatalogLotRowMeta;

const initialForm = {
  code: "",
  sequenceNumber: "",
  name: "",
  standardGroup: "CRM",
  manufacturer: "",
  casNumber: "",
  productCode: "",
  lot: "",
  purity: "",
  uncertainty: "",
  unit: "",
  quantity: "",
  expiryDate: "",
  afterOpenExpiry: "",
  storageCondition: "",
  storageLocation: "",
  notes: "",
  coaPath: "",
};

type FormState = typeof initialForm;

const formFields: { key: keyof FormState; label: string; type?: "text" | "date" | "number" | "textarea"; colSpan?: boolean }[] = [
  { key: "name", label: "Tên chuẩn" },
  { key: "manufacturer", label: "Hãng sản xuất" },
  { key: "casNumber", label: "CAS" },
  { key: "productCode", label: "Product Code" },
  { key: "lot", label: "Lot Number" },
  { key: "purity", label: "Purity" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "unit", label: "Đơn vị" },
  { key: "quantity", label: "Số lượng tồn kho", type: "number" },
  { key: "expiryDate", label: "Hạn chứng chỉ", type: "date" },
  { key: "afterOpenExpiry", label: "Hạn sau mở nắp", type: "date" },
  { key: "storageCondition", label: "Điều kiện bảo quản", colSpan: true },
  { key: "storageLocation", label: "Vị trí lưu" },
  { key: "notes", label: "Ghi chú", type: "textarea", colSpan: true },
];

const detailFields: { key: keyof StandardView; label: string; multiline?: boolean; isDate?: boolean }[] = [
  { key: "code", label: "Mã chuẩn" },
  { key: "name", label: "Tên chuẩn" },
  { key: "standardGroup", label: "Nhóm chuẩn" },
  { key: "manufacturer", label: "Hãng sản xuất" },
  { key: "casNumber", label: "CAS" },
  { key: "productCode", label: "Product Code" },
  { key: "lot", label: "Lot Number" },
  { key: "purity", label: "Purity" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "unit", label: "Đơn vị" },
  { key: "quantity", label: "Số lượng tồn kho" },
  { key: "expiryDate", label: "Hạn chứng chỉ", isDate: true },
  { key: "afterOpenExpiry", label: "Hạn sau mở nắp", isDate: true },
  { key: "storageCondition", label: "Điều kiện bảo quản", multiline: true },
  { key: "status", label: "Trạng thái" },
  { key: "storageLocation", label: "Vị trí lưu" },
  { key: "notes", label: "Ghi chú", multiline: true },
];

function previewStatus(expiryDate: string) {
  if (!expiryDate) return "Ready";
  const date = new Date(`${expiryDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Ready";
  return standardStatusLabel(computeStandardStatus(date));
}

function itemToForm(item: StandardView): FormState {
  const parsed = parseMasterCode(item.code);
  return {
    code: item.code,
    sequenceNumber: parsed ? formatSequenceDisplay(parsed.sequenceNumber) : item.code.replace(/^STD-/i, ""),
    name: item.name,
    standardGroup: item.standardGroup,
    manufacturer: item.manufacturer,
    casNumber: item.casNumber,
    productCode: item.productCode,
    lot: item.lot,
    purity: item.purity,
    uncertainty: item.uncertainty,
    unit: item.unit,
    quantity: String(item.quantity),
    expiryDate: item.expiryDate,
    afterOpenExpiry: item.afterOpenExpiry,
    storageCondition: item.storageCondition,
    storageLocation: item.storageLocation,
    notes: item.notes,
    coaPath: item.coaPath,
  };
}

export function StandardsClient({
  result,
  groupOptions,
  listQuery,
}: {
  result: PaginatedResult<StandardLotRow>;
  groupOptions: string[];
  listQuery: CatalogListParams;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setQuery, setFilter, toggleSort } = useListQueryState();
  const [selected, setSelected] = useState<StandardLotRow | null>(() => {
    const code = searchParams.get("code");
    if (!code) return null;
    return (
      result.items.find((i) => i.code === code && i.showMasterFields) ??
      result.items.find((i) => i.code === code) ??
      null
    );
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StandardLotRow | null>(null);
  const [drawerTab, setDrawerTab] = useState<"Thông tin chung" | "Tồn kho">("Thông tin chung");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const groupFilterOptions = useMemo(
    () => buildStandardGroupFilterOptions(groupOptions),
    [groupOptions],
  );
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const filtered = result.items;

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setCoaFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: StandardView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm(itemToForm(item));
    setCoaFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if ((!isEditing && !form.sequenceNumber.trim()) || !form.name.trim()) {
      addToast("Mã và tên chất chuẩn là bắt buộc", "error");
      return;
    }
    if (!form.expiryDate.trim()) {
      addToast("Hạn chứng chỉ là bắt buộc", "error");
      return;
    }

    const fd = new FormData();
    fd.set("user", role);
    STANDARD_FORM_FIELD_KEYS.forEach((key) => fd.set(key, String(form[key] ?? "")));
    fd.set("sequenceNumber", form.sequenceNumber);
    if (isEditing) fd.set("code", form.code);
    if (coaFile) fd.set("coa", coaFile);
    if (isEditing && editingId) fd.set("id", editingId);

    startTransition(async () => {
      const result = isEditing ? await updateStandard(fd) : await createStandard(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật chất chuẩn" : "Đã thêm chất chuẩn mới", "success");
      setIsFormOpen(false);
      setCoaFile(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const fd = new FormData();
    fd.set("user", role);
    startTransition(async () => {
      let result;
      if (target.stockLotId) {
        fd.set("stockLotId", target.stockLotId);
        result = await deleteStockLot(fd);
      } else {
        fd.set("id", target.id);
        result = await deleteStandard(fd);
      }
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        target.stockLotId ? `Đã xóa lot ${target.lot}` : "Đã xóa chất chuẩn thành công",
        "success",
      );
      if (selected?.rowKey === target.rowKey) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    const cfg = CATALOG_EXCEL.standard;
    exportToXlsx(
      cfg.filename,
      buildCatalogExportRows(filtered, cfg.fieldKeys, cfg.masterKeys),
      [...cfg.columns],
    );
    addToast("Đã export Excel", "success");
  };

  const handlePreview = async (rows: Record<string, string>[]) => {
    const fd = new FormData();
    fd.set("rows", JSON.stringify(rows));
    return previewStandardsImport(fd);
  };

  const handleImport = async (
    rows: Record<string, string>[],
    options?: { mergeDuplicates?: boolean },
  ) => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("rows", JSON.stringify(rows));
    if (options?.mergeDuplicates) fd.set("mergeDuplicates", "true");
    const result = await bulkImportStandards(fd);
    return result;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Reference materials</p>
            <h1 className="text-2xl font-semibold text-slate-900">Chất chuẩn gốc</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
              <Download className="h-4 w-4" />
              Export Excel
            </button>
            {canEdit ? (
              <button type="button" onClick={() => setIsImportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                <Upload className="h-4 w-4" />
                Import Excel
              </button>
            ) : null}
            {canEdit ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
                <Plus className="h-4 w-4" />
                Thêm chất chuẩn
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={listQuery.q}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm chất chuẩn..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div className="w-full sm:w-64">
              <label className="mb-1 block text-xs text-slate-500">Nhóm chuẩn</label>
              <select
                value={listQuery.group}
                onChange={(e) =>
                  setFilter("group", e.target.value === STANDARD_GROUP_FILTER_ALL ? null : e.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                {groupFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FilterChipBar
            options={STANDARD_STATUS_FILTERS.map((s) => ({
              value: s,
              label: s === "All" ? "Tất cả trạng thái" : s,
            }))}
            value={listQuery.status === "All" ? "All" : listQuery.status}
            onChange={(value) => setFilter("status", value === "All" ? null : value)}
          />
        </div>

        <DataTable
          columns={[
            {
              key: "code",
              header: "Mã chuẩn",
              sortable: true,
              sortKey: "code",
              render: (v, row) => groupedCell(row.showMasterFields, v),
            },
            {
              key: "name",
              header: "Tên chuẩn",
              sortable: true,
              sortKey: "name",
              render: (v, row) => groupedCell(row.showMasterFields, v),
            },
            {
              key: "standardGroup",
              header: "Nhóm chuẩn",
              sortable: true,
              sortKey: "group",
              render: (v, row) => groupedCell(row.showMasterFields, v, (value) => <StatusBadge status={String(value)} />),
            },
            {
              key: "manufacturer",
              header: "Hãng sản xuất",
              sortable: true,
              sortKey: "manufacturer",
              render: (v, row) => groupedCell(row.showMasterFields, v),
            },
            {
              key: "casNumber",
              header: "CAS",
              sortable: true,
              sortKey: "casNumber",
              render: (v, row) => groupedCell(row.showMasterFields, v),
            },
            { key: "productCode", header: "Product Code", render: (v, row) => groupedCell(row.showMasterFields, v) },
            { key: "lot", header: "Lot Number", sortable: true, sortKey: "lot" },
            { key: "purity", header: "Purity" },
            { key: "uncertainty", header: "Uncertainty" },
            { key: "coaPath", header: "COA", render: (_v, row) => <CoaLink path={row.coaPath} /> },
            { key: "unit", header: "Đơn vị" },
            { key: "quantity", header: "Số lượng tồn kho", sortable: true, sortKey: "quantity" },
            {
              key: "expiryDate",
              header: "Hạn chứng chỉ",
              sortable: true,
              sortKey: "expiryDate",
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
            { key: "afterOpenExpiry", header: "Hạn sau mở nắp", render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "storageCondition", header: "Điều kiện bảo quản" },
            { key: "status", header: "Trạng thái", sortable: true, sortKey: "status", render: (v) => <StatusBadge status={String(v)} /> },
            { key: "notes", header: "Ghi chú" },
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
          onRowClick={setSelected}
          rowActionsHeader="Hành động"
          rowActions={
            canManage
              ? (row) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(row);
                    }}
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
          subtitle={selected ? (selected.stockLotId ? `${selected.code} · Lot ${selected.lot}` : selected.code) : undefined}
          tabs={["Thông tin chung", "Tồn kho"]}
          activeTab={drawerTab}
          onTabChange={(tab) => setDrawerTab(tab as "Thông tin chung" | "Tồn kho")}
          layout="stacked"
          maxWidth="5xl"
          actions={
            selected ? (
              <>
                {canEdit ? (
                  <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
                ) : null}
                {canManage ? (
                  <button type="button" onClick={() => setDeleteTarget(selected)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"><Trash2 className="h-4 w-4" />Xóa</button>
                ) : null}
              </>
            ) : undefined
          }
          tabContent={
            selected ? (
              drawerTab === "Tồn kho" ? (
                <InventoryItemPanel
                  sourceType="Standard"
                  sourceId={selected.id}
                  sourceCode={selected.code}
                  unit={selected.unit}
                  stockLotId={selected.stockLotId}
                  inventoryStatus={selected.inventoryStatus}
                  canEdit={canEdit}
                  canManage={canManage}
                  onSuccess={(msg) => addToast(msg, "success")}
                  onError={(msg) => addToast(msg, "error")}
                />
              ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {detailFields.map((f) => (
                  <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
                    <p className="text-xs text-slate-500">{f.label}</p>
                    {f.key === "status" ? (
                      <StatusBadge status={selected.status} />
                    ) : f.isDate ? (
                      <p className="font-medium">{selected[f.key] ? formatDate(String(selected[f.key])) : "-"}</p>
                    ) : (
                      <p className="font-medium whitespace-pre-wrap">{String(selected[f.key] ?? "-")}</p>
                    )}
                  </div>
                ))}
                <div>
                  <p className="text-xs text-slate-500">COA</p>
                  <CoaLink path={selected.coaPath} />
                </div>
                <CatalogPreparedDerivatives catalogKind="STANDARD" catalogId={selected.id} />
              </div>
              )
            ) : null
          }
        />

        <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isEditing ? "Sửa chất chuẩn" : "Thêm chất chuẩn"}</h2>
            <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Nhóm chuẩn</label>
              <input
                list="standard-group-options"
                value={form.standardGroup}
                onChange={(e) => setForm((p) => ({ ...p, standardGroup: e.target.value }))}
                placeholder="CRM, RM, Working hoặc nhóm mới"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <datalist id="standard-group-options">
                {groupOptions.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
            <CodeSequenceInput
              prefix="STD"
              sequence={form.sequenceNumber}
              onSequenceChange={(value) => setForm((p) => ({ ...p, sequenceNumber: value }))}
              mode={isEditing ? "edit" : "create"}
              label="Mã chuẩn"
            />
            {formFields.slice(0, 7).map((f) => (
              <div key={f.key} className={f.colSpan ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-sm text-slate-600">{f.label}</label>
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm text-slate-600">COA</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setCoaFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              {form.coaPath && !coaFile ? <p className="mt-1 text-xs text-slate-500">File hiện tại: <CoaLink path={form.coaPath} /></p> : null}
              {coaFile ? <p className="mt-1 text-xs text-slate-500">File mới: {coaFile.name}</p> : null}
            </div>
            {formFields.slice(7).map((f) => (
              <div key={f.key} className={f.colSpan ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-sm text-slate-600">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm text-slate-600">Trạng thái</label>
              <div className="flex h-11 items-center">
                <StatusBadge status={previewStatus(form.expiryDate)} />
                <span className="ml-2 text-xs text-slate-500">Tự động tính khi lưu</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Huỷ</button>
            <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </ModalShell>

        <ConfirmDialog
          open={!!deleteTarget}
          title={deleteTarget?.stockLotId ? "Xóa lot tồn kho" : "Xóa chất chuẩn"}
          message={
            deleteTarget?.stockLotId
              ? `Bạn có chắc muốn xóa lot "${deleteTarget.lot}" của ${deleteTarget.name} (${deleteTarget.code})? Chất chuẩn gốc và các lot khác vẫn được giữ.`
              : "Bạn có chắc muốn xóa chất chuẩn này không? Hành động này không thể hoàn tác."
          }
          cancelLabel="Hủy"
          confirmLabel="Xóa"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />

        <ExcelImportDialog
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            void router.refresh();
          }}
          title="Import chất chuẩn gốc"
          columnMap={STANDARD_IMPORT_COLUMN_MAP}
          onPreview={handlePreview}
          onImport={handleImport}
        />
      </div>
    </AppShell>
  );
}
