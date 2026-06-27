"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Edit, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { FilterChipBar } from "@/components/FilterChipBar";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import type { StockLotView } from "@/types";
import type { FieldDef, ModuleRow } from "@/lib/modules/shared";
import { emptyStockLotSelection } from "@/lib/stock-lot-selection";
import { StockLotPicker, applyDefaultLotIfSingle } from "@/components/StockLotPicker";
import { missingFieldsMessage, STATUS_FILTERS } from "@/lib/modules/shared";
import { exportToXlsx, type ExcelColumn } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import { InventoryItemPanel } from "@/components/inventory/InventoryItemPanel";
import { PreparationDrawerTabContent } from "@/components/preparation/PreparationDrawerTabContent";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";
import { AmendmentReasonDialog } from "@/components/preparation/AmendmentReasonDialog";
import {
  PREPARATION_WORKFLOW_FILTERS,
  PREPARATION_WORKFLOW_STATUS_LABELS,
} from "@/lib/preparation-workflow-labels";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import type { StaffView } from "@/lib/services/staff";
import {
  previewNextPreparedStrainBatchCode,
} from "@/lib/actions/modules";

type Props = {
  title: string;
  subtitle: string;
  exportName: string;
  items: ModuleRow[];
  fields: FieldDef[];
  tableKeys: { key: string; header: string; isDate?: boolean; isStatus?: boolean }[];
  searchKeys: string[];
  extraFilters?: { key: string; label: string; options: string[] }[];
  createAction: (fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  updateAction: (fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction: (fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  stockLotMasters?: Array<{ id: string; stockLots: StockLotView[] }>;
  importColumnMap?: Record<string, string>;
  importTitle?: string;
  onImport?: (rows: Record<string, string>[]) => Promise<{ error?: string; success?: boolean; count?: number; errors?: string[] }>;
  exportRowsBuilder?: (items: ModuleRow[]) => Array<Record<string, string | number>>;
  exportColumns?: ExcelColumn[];
  preparationType?: PreparationRecordType;
  staff?: StaffView[];
};

export function ModuleCrudClient(props: Props) {
  const {
    title,
    subtitle,
    exportName,
    items,
    fields,
    tableKeys,
    searchKeys,
    extraFilters,
    createAction,
    updateAction,
    deleteAction,
    stockLotMasters = [],
    importColumnMap,
    importTitle,
    onImport,
    exportRowsBuilder,
    exportColumns,
    preparationType,
    staff = [],
  } = props;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [workflowFilter, setWorkflowFilter] = useState<(typeof PREPARATION_WORKFLOW_FILTERS)[number]>("All");
  const [drawerTab, setDrawerTab] = useState("Chi tiết");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<ModuleRow | null>(null);
  const [form, setForm] = useState<ModuleRow>({});
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [amendmentOpen, setAmendmentOpen] = useState(false);
  const [pendingAmendmentReason, setPendingAmendmentReason] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pending, start] = useTransition();
  const [previewBatchCode, setPreviewBatchCode] = useState("");
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const filtered = useMemo(() => items.filter((row) => {
    const q = query.toLowerCase();
    const matchQ = !q || searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q));
    const matchS = status === "All" || row.status === status;
    const matchWorkflow =
      !preparationType || workflowFilter === "All" || row.workflowStatus === workflowFilter;
    const matchExtra = !extraFilters?.length || extraFilters.every((f) => !extra[f.key] || extra[f.key] === "All" || row[f.key] === extra[f.key]);
    return matchQ && matchS && matchWorkflow && matchExtra;
  }), [items, query, status, workflowFilter, extra, searchKeys, extraFilters, preparationType]);

  useEffect(() => {
    if (!preparationType || edit || !open) return;
    const parentCode = String(form.parentCode ?? "").trim();
    if (!parentCode) {
      setPreviewBatchCode("");
      setForm((p) => ({ ...p, code: "" }));
      return;
    }
    const fd = new FormData();
    fd.set("parentCode", parentCode);
    const previewAction =
      preparationType === "STRAIN" ? previewNextPreparedStrainBatchCode : null;
    if (!previewAction) return;
    void previewAction(fd).then((result) => {
      if ("success" in result && result.success && result.code) {
        setPreviewBatchCode(result.code);
        setForm((p) => ({ ...p, code: result.code }));
      }
    });
  }, [form.parentCode, edit, open, preparationType]);

  const openCreate = () => {
    setEdit(false);
    setForm(Object.fromEntries(fields.map((f) => {
      if (f.type === "number") return [f.key, 0];
      if (f.type === "select" && f.options?.length) return [f.key, f.options[0].value];
      return [f.key, ""];
    })));
    setOpen(true);
  };

  const openReprepare = (row: ModuleRow) => {
    if (!preparationType) return;
    setEdit(false);
    const parentCode = String(row.parentCode ?? row.code ?? "").replace(/-\d{3}$/, "");
    setForm({
      ...Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""])),
      parentCode,
      code: "",
      preparedDate: "",
      expiryDate: "",
    });
    setOpen(true);
  };

  const openEdit = (row: ModuleRow) => {
    if (preparationType) {
      const ws = String(row.workflowStatus ?? "");
      if (ws === "Prepared" || ws === "Checked") {
        addToast("Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước", "error");
        return;
      }
      if (ws === "Approved") {
        setEdit(true);
        setForm({ ...row });
        setAmendmentOpen(true);
        return;
      }
    }
    setEdit(true);
    setForm({ ...row });
    setOpen(true);
  };

  const submit = () => {
    const missing = fields.filter((f) => {
      if (f.readOnly) return false;
      if (!edit && f.key === "code") return false;
      return f.required && !String(form[f.key] ?? "").trim();
    });
    if (missing.length) {
      addToast(missingFieldsMessage(missing.map((f) => f.label)), "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", role);
    fields.forEach((f) => {
      if (f.readOnly) return;
      if (!edit && f.key === "code") return;
      fd.set(f.key, String(form[f.key] ?? ""));
    });
    if (edit) fd.set("id", String(form.id ?? ""));
    if (pendingAmendmentReason) fd.set("amendmentReason", pendingAmendmentReason);
    start(async () => {
      const res = edit ? await updateAction(fd) : await createAction(fd);
      if (res.error) { addToast(res.error, "error"); return; }
      addToast(edit ? "Đã cập nhật" : preparationType ? "Đã tạo nháp" : "Đã thêm mới", "success");
      setOpen(false);
      setPendingAmendmentReason("");
      router.refresh();
    });
  };

  const remove = () => {
    if (!selected) return;
    const fd = new FormData();
    fd.set("user", role);
    fd.set("id", String(selected.id));
    start(async () => {
      const res = await deleteAction(fd);
      if (res.error) { addToast(res.error, "error"); return; }
      addToast("Đã xoá", "success");
      setSelected(null);
      setConfirm(false);
      router.refresh();
    });
  };

  const columns = [
    ...tableKeys.map((c) => ({
      key: c.key as keyof ModuleRow,
      header: c.header,
      render: c.isStatus
        ? (v: unknown) => <StatusBadge status={String(v)} />
        : c.isDate
          ? (v: unknown) => formatDate(String(v))
          : undefined,
    })),
    ...(preparationType
      ? [{
          key: "workflowStatus" as keyof ModuleRow,
          header: "Quy trình",
          render: (_v: unknown, row: ModuleRow) => (
            <WorkflowStatusBadge status={String(row.workflowStatus ?? "Approved")} />
          ),
        }]
      : []),
  ];

  const handleExport = () => {
    if (exportRowsBuilder && exportColumns) {
      exportToXlsx(exportName, exportRowsBuilder(filtered), exportColumns);
    } else {
      exportToXlsx(
        exportName,
        filtered as Array<Record<string, unknown>>,
        tableKeys.map((c) => ({ key: c.key, header: c.header })),
      );
    }
    addToast("Đã export Excel", "success");
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    if (!onImport) return { error: "Import chưa được cấu hình" };
    const result = await onImport(rows);
    if (!("error" in result)) router.refresh();
    return result;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm text-slate-500">{subtitle}</p><h1 className="text-2xl font-semibold">{title}</h1></div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"><Download className="h-4 w-4" />Export Excel</button>
            {canEdit && onImport && importColumnMap ? (
              <button type="button" onClick={() => setIsImportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"><Upload className="h-4 w-4" />Import Excel</button>
            ) : null}
            {canEdit ? <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm text-white"><Plus className="h-4 w-4" />Thêm mới</button> : null}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm..." className="h-10 w-full rounded-xl border pl-10 pr-3 text-sm" /></div>
          <FilterChipBar
            options={STATUS_FILTERS.map((s) => ({ value: s, label: s }))}
            value={status}
            onChange={setStatus}
            activeClassName="bg-slate-900 text-white"
            inactiveClassName="bg-slate-100 text-slate-700"
          />
          {extraFilters?.map((f) => (
            <FilterChipBar
              key={f.key}
              options={["All", ...f.options].map((o) => ({ value: o, label: o }))}
              value={extra[f.key] ?? "All"}
              onChange={(value) => setExtra((p) => ({ ...p, [f.key]: value }))}
            />
          ))}
          {preparationType ? (
            <FilterChipBar
              options={PREPARATION_WORKFLOW_FILTERS.map((s) => ({
                value: s,
                label:
                  s === "All"
                    ? "Tất cả quy trình"
                    : PREPARATION_WORKFLOW_STATUS_LABELS[s as keyof typeof PREPARATION_WORKFLOW_STATUS_LABELS],
              }))}
              value={workflowFilter}
              onChange={setWorkflowFilter}
            />
          ) : null}
        </div>
        <DataTable columns={columns} rows={filtered} onRowClick={(row) => { setSelected(row); setDrawerTab("Chi tiết"); }} />
        <DetailDrawer open={!!selected} onClose={() => setSelected(null)} title={String(selected?.name ?? "")} subtitle={String(selected?.code ?? "")}
          tabs={preparationType ? ["Chi tiết", "Tồn kho", "Lịch sử", "Truy xuất"] : ["Chi tiết"]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          layout="stacked" maxWidth="5xl"
          actions={selected ? <>{canEdit && preparationType && String(selected.workflowStatus ?? "") === "Rejected" ? <button type="button" onClick={() => { openReprepare(selected); setSelected(null); }} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 px-3 py-2 text-sm text-cyan-800"><Plus className="h-4 w-4" />Pha lại</button> : null}{canEdit ? <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button> : null}{canManage ? <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"><Trash2 className="h-4 w-4" />Xoá</button> : null}</> : undefined}
          tabContent={selected ? (
            preparationType ? (
              drawerTab === "Tồn kho" ? (
                <InventoryItemPanel
                  sourceType="PreparedStrain"
                  sourceId={String(selected.id)}
                  sourceCode={String(selected.code ?? "")}
                  unit={String(selected.unit ?? "")}
                  inventoryStatus={String(selected.inventoryStatus ?? "Active")}
                  canEdit={canEdit}
                  canManage={canManage}
                  onSuccess={(msg: string) => addToast(msg, "success")}
                  onError={(msg: string) => addToast(msg, "error")}
                />
              ) : (
              <PreparationDrawerTabContent
                tab={drawerTab}
                preparationType={preparationType}
                record={{
                  id: String(selected.id),
                  workflowStatus: String(selected.workflowStatus ?? "Approved"),
                  version: Number(selected.version ?? 1),
                }}
                staff={staff}
                canEdit={canEdit}
                role={role}
                onRefresh={() => router.refresh()}
                onError={(msg: string) => addToast(msg, "error")}
                onSuccess={(msg: string) => addToast(msg, "success")}
                detail={
                  <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key}>
                        <p className="text-xs text-slate-500">{f.label}</p>
                        <p className="font-medium">{String(selected[f.key] ?? "-")}</p>
                      </div>
                    ))}
                  </div>
                }
              />
              )
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{fields.map((f) => <div key={f.key}><p className="text-xs text-slate-500">{f.label}</p><p className="font-medium">{String(selected[f.key] ?? "-")}</p></div>)}</div>
            )
          ) : null}
        />
        <ModalShell open={open} onClose={() => setOpen(false)} className="max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{edit ? "Sửa" : "Thêm mới"}</h2><button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.map((f) => (
                <div key={f.key} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                  {f.type !== "stockLot" ? (
                    <label className="mb-1 block text-sm text-slate-600">{f.label}</label>
                  ) : null}
                  {f.type === "select" ? (
                    <select
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((p) => {
                          const next = { ...p, [f.key]: value };
                          const lotField = fields.find(
                            (field) => field.type === "stockLot" && field.masterFieldKey === f.key,
                          );
                          if (lotField) {
                            const master = stockLotMasters.find((m) => m.id === value);
                            const lotPick = master
                              ? applyDefaultLotIfSingle(master.stockLots, emptyStockLotSelection())
                              : emptyStockLotSelection();
                            next[lotField.key] = lotPick.stockLotId;
                            if (lotField.lotNumberField) {
                              next[lotField.lotNumberField] = lotPick.lotNumber;
                            }
                          }
                          return next;
                        });
                      }}
                      className="h-11 w-full rounded-xl border px-3 text-sm"
                    >
                      {!f.options?.length ? <option value="">Không có lựa chọn</option> : null}
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "stockLot" ? (
                    <StockLotPicker
                      label={f.label}
                      stockLots={
                        stockLotMasters.find((m) => m.id === String(form[f.masterFieldKey ?? ""]))?.stockLots ?? []
                      }
                      value={{
                        stockLotId: String(form[f.key] ?? ""),
                        lotNumber: String(form[f.lotNumberField ?? ""] ?? ""),
                      }}
                      onChange={(lot) =>
                        setForm((p) => ({
                          ...p,
                          [f.key]: lot.stockLotId,
                          ...(f.lotNumberField ? { [f.lotNumberField]: lot.lotNumber } : {}),
                        }))
                      }
                    />
                  ) : f.type === "textarea" ? (
                    <textarea value={String(form[f.key] ?? "")} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} className="min-h-20 w-full rounded-xl border px-3 py-2 text-sm" />
                  ) : f.readOnly || (f.key === "code" && preparationType) || (f.key === "parentCode" && edit && preparationType) ? (
                    <input
                      readOnly
                      value={
                        f.key === "code" && !edit
                          ? previewBatchCode
                          : String(form[f.key] ?? "")
                      }
                      placeholder={f.key === "code" && !edit ? "Nhập mã nhóm để xem mã lô" : ""}
                      className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm"
                    />
                  ) : (
                    <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={String(form[f.key] ?? "")} onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} className="h-11 w-full rounded-xl border px-3 text-sm" />
                  )}
                </div>
              ))}</div>
              <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Huỷ</button><button type="button" disabled={pending} onClick={submit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">{pending ? "..." : "Lưu"}</button></div>
        </ModalShell>
        <ConfirmDialog open={confirm} title="Xoá?" message={`Xoá mềm ${selected?.code}? Tồn kho sẽ được hoàn lại nếu đã trừ.`} onCancel={() => setConfirm(false)} onConfirm={remove} />
        <AmendmentReasonDialog
          open={amendmentOpen}
          onCancel={() => setAmendmentOpen(false)}
          onConfirm={(reason) => {
            setPendingAmendmentReason(reason);
            setAmendmentOpen(false);
            setOpen(true);
          }}
        />
        {importColumnMap && onImport ? (
          <ExcelImportDialog
            open={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            title={importTitle ?? "Import Excel"}
            columnMap={importColumnMap}
            onImport={handleImport}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
