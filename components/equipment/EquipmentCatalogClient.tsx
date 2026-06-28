"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { FilterChipBar } from "@/components/FilterChipBar";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { EquipmentLabelPreviewModal } from "@/components/equipment/EquipmentLabelPreviewModal";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentStatusBadge } from "@/components/equipment/EquipmentStatusBadge";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createEquipment,
  deleteEquipment,
  importEquipmentBulk,
  updateEquipment,
} from "@/lib/actions/equipment-catalog";
import {
  EQUIPMENT_CATALOG_COLUMNS,
  EQUIPMENT_IMPORT_COLUMN_MAP,
  EQUIPMENT_STATUS_FILTERS,
} from "@/lib/equipment-fields";
import { EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { EquipmentListParams } from "@/lib/services/equipment-list";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { EquipmentView } from "@/types";

const initialForm = {
  code: "",
  name: "",
  model: "",
  serialNumber: "",
  specifications: "",
  manufacturer: "",
  countryOfOrigin: "",
  manufacturingYear: "",
  purchaseDate: "",
  commissioningDate: "",
  calibrator: "",
  department: "",
  location: "",
  manager: "",
  status: "Đang dùng",
  installDate: "",
  iqOqPqNotes: "",
};

type FormState = typeof initialForm;

const formFields: { key: keyof FormState; label: string; type?: "text" | "date" | "number" | "textarea" }[] = [
  { key: "code", label: "Mã thiết bị" },
  { key: "name", label: "Tên thiết bị" },
  { key: "model", label: "Model" },
  { key: "serialNumber", label: "Số serial" },
  { key: "manufacturer", label: "Hãng SX" },
  { key: "specifications", label: "Thông số kỹ thuật", type: "textarea" },
  { key: "countryOfOrigin", label: "Xuất xứ" },
  { key: "manufacturingYear", label: "Năm SX", type: "number" },
  { key: "purchaseDate", label: "Ngày mua", type: "date" },
  { key: "commissioningDate", label: "Ngày đưa vào sử dụng", type: "date" },
  { key: "installDate", label: "Ngày lắp đặt", type: "date" },
  { key: "department", label: "Bộ phận" },
  { key: "location", label: "Vị trí" },
  { key: "manager", label: "Người quản lý" },
  { key: "calibrator", label: EQUIPMENT_COLUMN.calibrationVendor },
  { key: "iqOqPqNotes", label: "Ghi chú IQ/OQ/PQ", type: "textarea" },
];

function itemToForm(item: EquipmentView): FormState {
  return {
    code: item.code,
    name: item.name,
    model: item.model,
    serialNumber: item.serialNumber,
    specifications: item.specifications,
    manufacturer: item.manufacturer,
    countryOfOrigin: item.countryOfOrigin,
    manufacturingYear: item.manufacturingYear != null ? String(item.manufacturingYear) : "",
    purchaseDate: item.purchaseDate,
    commissioningDate: item.commissioningDate,
    calibrator: item.calibrator,
    department: item.department,
    location: item.location,
    manager: item.manager,
    status: item.status,
    installDate: item.installDate,
    iqOqPqNotes: item.iqOqPqNotes,
  };
}

export function EquipmentCatalogClient({
  result,
  departments,
  managers,
  listQuery,
}: {
  result: PaginatedResult<EquipmentView>;
  departments: string[];
  managers: string[];
  listQuery: EquipmentListParams;
}) {
  const router = useRouter();
  const { setQuery, setFilter, toggleSort } = useListQueryState();
  const [selected, setSelected] = useState<EquipmentView | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentView | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const rows = result.items;

  const selectedRows = useMemo(
    () => rows.filter((item) => selectedRowIds.has(item.id)),
    [rows, selectedRowIds],
  );

  const submitFormData = () => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (manualFile) fd.set("userManual", manualFile);
    if (isEditing && editingId) fd.set("id", editingId);
    return fd;
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setManualFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: EquipmentView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm(itemToForm(item));
    setManualFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast("Mã và tên thiết bị là bắt buộc", "error");
      return;
    }
    startTransition(async () => {
      const result = isEditing ? await updateEquipment(submitFormData()) : await createEquipment(submitFormData());
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật thiết bị" : "Đã thêm thiết bị mới", "success");
      setIsFormOpen(false);
      setManualFile(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteEquipment(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa thiết bị", "success");
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    exportToXlsx(
      "danh-muc-thiet-bi",
      rows.map((item) => ({ ...item })),
      EQUIPMENT_CATALOG_COLUMNS.map((c) => ({ key: c.key, header: c.header })),
    );
    addToast("Đã export Excel", "success");
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("rows", JSON.stringify(rows));
    return importEquipmentBulk(fd);
  };

  return (
    <>
      <EquipmentModuleShell
        title="Danh mục thiết bị"
        subtitle={EQUIPMENT_SUBTITLE}
        query={listQuery.q}
        onQueryChange={setQuery}
        searchPlaceholder="Tìm theo mã, tên, model, serial..."
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
        onPrintLabels={() => setPrintPreviewOpen(true)}
        printLabelsDisabled={selectedRowIds.size === 0}
        onCreate={openCreate}
        createLabel="Thêm thiết bị"
        canEdit={canEdit}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs text-slate-500">Bộ phận</label>
              <select
                value={listQuery.department}
                onChange={(e) => setFilter("department", e.target.value === "All" ? null : e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="All">Tất cả</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs text-slate-500">Người quản lý</label>
              <select
                value={listQuery.manager}
                onChange={(e) => setFilter("manager", e.target.value === "All" ? null : e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="All">Tất cả</option>
                {managers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs text-slate-500">{EQUIPMENT_COLUMN.calibrationExpiry}</label>
              <select
                value={listQuery.calExpiry}
                onChange={(e) => {
                  const v = e.target.value as EquipmentListParams["calExpiry"];
                  setFilter("calExpiry", v === "All" ? null : v);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="All">Tất cả</option>
                <option value="Overdue">Quá hạn</option>
                <option value="Soon">Sắp hết hạn (≤30 ngày)</option>
                <option value="Valid">Còn hạn</option>
              </select>
            </div>
            <FilterChipBar
              className="sm:items-end"
              options={EQUIPMENT_STATUS_FILTERS.map((s) => ({
                value: s,
                label: s === "All" ? "Tất cả TT" : s,
              }))}
              value={listQuery.status === "All" ? "All" : listQuery.status}
              onChange={(v) => setFilter("status", v === "All" ? null : v)}
            />
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "code", header: "Mã thiết bị", sortable: true, sortKey: "code" },
            { key: "name", header: "Tên thiết bị", sortable: true, sortKey: "name" },
            { key: "model", header: "Model", sortable: true, sortKey: "model" },
            { key: "serialNumber", header: "Số serial", sortable: true, sortKey: "serialNumber" },
            { key: "manufacturer", header: "Hãng SX", sortable: true, sortKey: "manufacturer" },
            {
              key: "specifications",
              header: "Thông số kỹ thuật",
              minWidth: 250,
              render: (v) => (
                <span className="block max-w-[280px] whitespace-normal break-words text-slate-700">
                  {String(v ?? "").trim() || "-"}
                </span>
              ),
            },
            { key: "department", header: "Bộ phận", sortable: true, sortKey: "department" },
            { key: "manager", header: "Người quản lý", sortable: true, sortKey: "manager" },
            {
              key: "status",
              header: "Tình trạng",
              sortable: true,
              sortKey: "status",
              render: (v) => <EquipmentStatusBadge status={String(v)} />,
            },
            {
              key: "lastCalibrationDate",
              header: EQUIPMENT_COLUMN.latestCalibration,
              sortable: true,
              sortKey: "lastCalibrationDate",
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
            {
              key: "calibrationExpiryDate",
              header: EQUIPMENT_COLUMN.calibrationExpiry,
              sortable: true,
              sortKey: "calibrationExpiryDate",
              render: (v) => (v ? formatDate(String(v)) : "-"),
            },
            { key: "location", header: "Vị trí", sortable: true, sortKey: "location" },
          ]}
          rows={rows}
          sort={{
            sortBy: listQuery.sortBy,
            sortOrder: listQuery.sortOrder,
            sortActive: listQuery.sortActive,
            onSort: toggleSort,
          }}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
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
      </EquipmentModuleShell>

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.code}
        tabs={["Thông tin chung"]}
        activeTab="Thông tin chung"
        onTabChange={() => undefined}
        layout="stacked"
        maxWidth="5xl"
        actions={
          selected ? (
            <>
              {canEdit ? (
                <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <Edit className="h-4 w-4" />Sửa
                </button>
              ) : null}
              {canManage ? (
                <button type="button" onClick={() => setDeleteTarget(selected)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700">
                  <Trash2 className="h-4 w-4" />Xóa
                </button>
              ) : null}
            </>
          ) : undefined
        }
        tabContent={
          selected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["code", "Mã thiết bị"],
                ["name", "Tên thiết bị"],
                ["model", "Model"],
                ["serialNumber", "Số serial"],
                ["manufacturer", "Hãng SX"],
                ["specifications", "Thông số kỹ thuật"],
                ["department", "Bộ phận"],
                ["location", "Vị trí"],
                ["manager", "Người quản lý"],
                ["status", "Tình trạng"],
                ["lastCalibrationDate", EQUIPMENT_COLUMN.latestCalibration],
                ["calibrationExpiryDate", EQUIPMENT_COLUMN.calibrationExpiry],
                ["calibrator", EQUIPMENT_COLUMN.calibrationVendor],
                ["iqOqPqNotes", "IQ/OQ/PQ"],
              ].map(([key, label]) => (
                <div key={key} className={key === "specifications" || key === "iqOqPqNotes" ? "sm:col-span-2" : ""}>
                  <p className="text-xs text-slate-500">{label}</p>
                  {key === "status" ? (
                    <EquipmentStatusBadge status={selected.status} />
                  ) : key.includes("Date") && selected[key as keyof EquipmentView] ? (
                    <p className="font-medium">{formatDate(String(selected[key as keyof EquipmentView]))}</p>
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{String(selected[key as keyof EquipmentView] ?? "-")}</p>
                  )}
                </div>
              ))}
              {selected.userManualPath ? (
                <div>
                  <p className="text-xs text-slate-500">Hướng dẫn sử dụng</p>
                  <a href={selected.userManualPath} target="_blank" rel="noreferrer" className="text-sm text-cyan-700 underline">
                    Tải xuống
                  </a>
                </div>
              ) : null}
            </div>
          ) : null
        }
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? "Sửa thiết bị" : "Thêm thiết bị"}</h2>
          <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Tình trạng</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              {EQUIPMENT_STATUS_FILTERS.filter((s) => s !== "All").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Bộ phận</label>
            <input
              list="equipment-dept-options"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <datalist id="equipment-dept-options">
              {departments.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          {formFields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
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
          <div className="sm:col-span-2">
            <EquipmentFileUpload
              label="Hướng dẫn sử dụng (PDF/DOC)"
              onChange={setManualFile}
              currentPath={isEditing && selected?.userManualPath ? selected.userManualPath : undefined}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Huỷ</button>
          <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </ModalShell>

      <ExcelImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import danh mục thiết bị"
        columnMap={EQUIPMENT_IMPORT_COLUMN_MAP}
        onImport={handleImport}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa thiết bị"
        message={`Bạn có chắc muốn xóa thiết bị ${deleteTarget?.name} (${deleteTarget?.code})?`}
        cancelLabel="Hủy"
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <EquipmentLabelPreviewModal
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        items={selectedRows}
      />
    </>
  );
}
