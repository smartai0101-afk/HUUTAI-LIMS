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
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { bulkImportChemicals, previewChemicalsImport } from "@/lib/actions/catalog-import";
import { createChemical, deleteChemical, updateChemical } from "@/lib/actions/chemicals";
import { deleteStockLot } from "@/lib/actions/stock-lot";
import {
  CHEMICAL_FORM_FIELD_KEYS,
  CHEMICAL_GROUP_FILTER_ALL,
  CHEMICAL_GROUP_FILTER_OPTIONS,
  CHEMICAL_IMPORT_COLUMN_MAP,
  type ChemicalGroupFilter,
} from "@/lib/chemicals-fields";
import { CATALOG_EXCEL, buildCatalogExportRows } from "@/lib/catalog-excel";
import { expandCatalogToLotRows, groupedCell, type CatalogLotRowMeta } from "@/lib/catalog-lot-rows";
import { exportToXlsx } from "@/lib/excel";
import { computeStandardStatus, STANDARD_STATUS_FILTERS, standardStatusLabel } from "@/lib/standard-status";
import { formatDate } from "@/lib/utils";
import type { ChemicalView } from "@/types";

type ChemicalLotRow = ChemicalView & CatalogLotRowMeta;

const initialForm = {
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
  quantity: "",
  expiryDate: "",
  storageCondition: "",
  storageLocation: "",
  notes: "",
  coaPath: "",
};

type FormState = typeof initialForm;

const formFields: { key: keyof FormState; label: string; type?: "text" | "date" | "number" | "textarea"; colSpan?: boolean }[] = [
  { key: "code", label: "Mã hóa chất" },
  { key: "name", label: "Tên hóa chất" },
  { key: "manufacturer", label: "Hãng sản xuất" },
  { key: "casNumber", label: "CAS Number" },
  { key: "productCode", label: "Product Code" },
  { key: "lot", label: "Lot Number" },
  { key: "purity", label: "Purity" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "unit", label: "Đơn vị" },
  { key: "quantity", label: "Số lượng tồn kho", type: "number" },
  { key: "expiryDate", label: "Hạn dùng", type: "date" },
  { key: "storageCondition", label: "Điều kiện bảo quản", colSpan: true },
  { key: "storageLocation", label: "Vị trí lưu" },
  { key: "notes", label: "Ghi chú", type: "textarea", colSpan: true },
];

const detailFields: { key: keyof ChemicalView; label: string; multiline?: boolean }[] = [
  { key: "code", label: "Mã hóa chất" },
  { key: "name", label: "Tên hóa chất" },
  { key: "chemicalGroup", label: "Nhóm hóa chất" },
  { key: "manufacturer", label: "Hãng sản xuất" },
  { key: "casNumber", label: "CAS Number" },
  { key: "productCode", label: "Product Code" },
  { key: "lot", label: "Lot Number" },
  { key: "purity", label: "Purity" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "unit", label: "Đơn vị" },
  { key: "quantity", label: "Số lượng tồn kho" },
  { key: "expiryDate", label: "Hạn dùng" },
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

function itemToForm(item: ChemicalView): FormState {
  return {
    code: item.code,
    name: item.name,
    chemicalGroup: item.chemicalGroup,
    manufacturer: item.manufacturer,
    casNumber: item.casNumber,
    productCode: item.productCode,
    lot: item.lot,
    purity: item.purity,
    uncertainty: item.uncertainty,
    unit: item.unit,
    quantity: String(item.quantity),
    expiryDate: item.expiryDate,
    storageCondition: item.storageCondition,
    storageLocation: item.storageLocation,
    notes: item.notes,
    coaPath: item.coaPath,
  };
}

export function ChemicalsClient({ items, groupOptions }: { items: ChemicalView[]; groupOptions: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ChemicalGroupFilter>(CHEMICAL_GROUP_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<(typeof STANDARD_STATUS_FILTERS)[number]>("All");
  const [selected, setSelected] = useState<ChemicalLotRow | null>(() => {
    const code = searchParams.get("code");
    if (!code) return null;
    const rows = expandCatalogToLotRows(items);
    return rows.find((i) => i.code === code && i.showMasterFields) ?? rows.find((i) => i.code === code) ?? null;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChemicalLotRow | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const displayRows = useMemo(() => expandCatalogToLotRows(items), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return displayRows.filter((item) => {
      const matchQuery =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.chemicalGroup.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.casNumber.toLowerCase().includes(q) ||
        item.productCode.toLowerCase().includes(q) ||
        item.lot.toLowerCase().includes(q) ||
        item.storageLocation.toLowerCase().includes(q) ||
        item.storageCondition.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q);
      const matchGroup = group === CHEMICAL_GROUP_FILTER_ALL || item.chemicalGroup === group;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchQuery && matchGroup && matchStatus;
    });
  }, [displayRows, query, group, statusFilter]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setCoaFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: ChemicalView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm(itemToForm(item));
    setCoaFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast("Mã và tên hoá chất là bắt buộc", "error");
      return;
    }
    if (!form.expiryDate.trim()) {
      addToast("Hạn dùng là bắt buộc", "error");
      return;
    }

    const fd = new FormData();
    fd.set("user", role);
    CHEMICAL_FORM_FIELD_KEYS.forEach((key) => fd.set(key, String(form[key] ?? "")));
    if (coaFile) fd.set("coa", coaFile);
    if (isEditing && editingId) fd.set("id", editingId);

    startTransition(async () => {
      const result = isEditing ? await updateChemical(fd) : await createChemical(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật hoá chất" : "Đã thêm hoá chất mới", "success");
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
        result = await deleteChemical(fd);
      }
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        target.stockLotId ? `Đã xóa lot ${target.lot}` : "Đã xóa hoá chất thành công",
        "success",
      );
      if (selected?.rowKey === target.rowKey) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    const cfg = CATALOG_EXCEL.chemical;
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
    return previewChemicalsImport(fd);
  };

  const handleImport = async (
    rows: Record<string, string>[],
    options?: { mergeDuplicates?: boolean },
  ) => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("rows", JSON.stringify(rows));
    if (options?.mergeDuplicates) fd.set("mergeDuplicates", "true");
    const result = await bulkImportChemicals(fd);
    return result;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Inventory</p>
            <h1 className="text-2xl font-semibold text-slate-900">Hoá chất gốc</h1>
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
                Thêm hoá chất
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên, mã, lot, CAS..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300" />
            </div>
            <div className="w-full sm:w-64">
              <label className="mb-1 block text-xs text-slate-500">Nhóm hóa chất</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as ChemicalGroupFilter)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                {CHEMICAL_GROUP_FILTER_OPTIONS.map((option) => (
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
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
          />
        </div>

        <DataTable
          columns={[
            { key: "code", header: "Mã hóa chất", render: (v, row) => groupedCell(row.showMasterFields, v) },
            { key: "name", header: "Tên hóa chất", render: (v, row) => groupedCell(row.showMasterFields, v) },
            {
              key: "chemicalGroup",
              header: "Nhóm hóa chất",
              render: (v, row) => groupedCell(row.showMasterFields, v, (value) => <StatusBadge status={String(value)} />),
            },
            { key: "manufacturer", header: "Hãng sản xuất", render: (v, row) => groupedCell(row.showMasterFields, v) },
            { key: "casNumber", header: "CAS Number", render: (v, row) => groupedCell(row.showMasterFields, v) },
            { key: "productCode", header: "Product Code", render: (v, row) => groupedCell(row.showMasterFields, v) },
            { key: "lot", header: "Lot Number" },
            { key: "purity", header: "Purity" },
            { key: "uncertainty", header: "Uncertainty" },
            { key: "coaPath", header: "COA", render: (_v, row) => <CoaLink path={row.coaPath} /> },
            { key: "unit", header: "Đơn vị" },
            { key: "quantity", header: "Số lượng tồn kho" },
            { key: "expiryDate", header: "Hạn dùng", render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "storageCondition", header: "Điều kiện bảo quản" },
            { key: "status", header: "Trạng thái", render: (v) => <StatusBadge status={String(v)} /> },
            { key: "storageLocation", header: "Vị trí lưu" },
            { key: "notes", header: "Ghi chú" },
          ]}
          rows={filtered}
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
          tabs={["Thông tin chung"]}
          activeTab="Thông tin chung"
          onTabChange={() => undefined}
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
              <div className="grid gap-3 sm:grid-cols-2">
                {detailFields.map((f) => (
                  <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
                    <p className="text-xs text-slate-500">{f.label}</p>
                    {f.key === "status" ? (
                      <StatusBadge status={selected.status} />
                    ) : f.key === "expiryDate" ? (
                      <p className="font-medium">{selected.expiryDate ? formatDate(selected.expiryDate) : "-"}</p>
                    ) : (
                      <p className="font-medium whitespace-pre-wrap">{String(selected[f.key] ?? "-")}</p>
                    )}
                  </div>
                ))}
                <div>
                  <p className="text-xs text-slate-500">COA</p>
                  <CoaLink path={selected.coaPath} />
                </div>
              </div>
            ) : null
          }
        />

        <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isEditing ? "Sửa hoá chất" : "Thêm hoá chất"}</h2>
            <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Nhóm hóa chất</label>
              <input
                list="chemical-group-options"
                value={form.chemicalGroup}
                onChange={(e) => setForm((p) => ({ ...p, chemicalGroup: e.target.value }))}
                placeholder="Dung môi, Acid, Base hoặc nhóm mới"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <datalist id="chemical-group-options">
                {groupOptions.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
            {formFields.slice(0, 8).map((f) => (
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
            {formFields.slice(8).map((f) => (
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
          title={deleteTarget?.stockLotId ? "Xóa lot tồn kho" : "Xóa hoá chất"}
          message={
            deleteTarget?.stockLotId
              ? `Bạn có chắc muốn xóa lot "${deleteTarget.lot}" của ${deleteTarget.name} (${deleteTarget.code})? Hoá chất gốc và các lot khác vẫn được giữ.`
              : "Bạn có chắc muốn xóa hoá chất này không? Hành động này không thể hoàn tác."
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
          title="Import hoá chất gốc"
          columnMap={CHEMICAL_IMPORT_COLUMN_MAP}
          onPreview={handlePreview}
          onImport={handleImport}
        />
      </div>
    </AppShell>
  );
}
