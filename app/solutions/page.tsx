"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Edit, FileDown, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { LabelPreview } from "@/components/LabelPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { solutions as defaultSolutions } from "@/lib/data";
import { downloadCsv, readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { Solution } from "@/types";

const filterOptions = ["All", "New", "Pending Approval", "In Use", "Expired", "Cancelled"];
const tabs = ["Thông tin chung", "Tồn kho", "Tài liệu COA/SDS", "Audit trail", "Label/QR"];
const initialForm = {
  code: "",
  name: "",
  concentration: "",
  preparedFrom: "",
  preparedBy: "",
  preparedDate: "",
  expiryDate: "",
  status: "New" as Solution["status"],
};

export default function SolutionsPage() {
  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <SolutionsContent />
    </Suspense>
  );
}

function SolutionsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Solution[]>(defaultSolutions);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Solution | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState("Thông tin chung");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { canManage, canEdit, canViewAuditReports } = useRole();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStorage<Solution[]>(STORAGE_KEYS.solutions, defaultSolutions);
      setItems(stored);
      setLoading(false);
      const codeParam = searchParams.get("code");
      if (codeParam) {
        const match = stored.find((item) => item.code === codeParam);
        if (match) setSelected(match);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    if (!loading) writeStorage(STORAGE_KEYS.solutions, items);
  }, [items, loading]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.code.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === "All" || item.status === status;
      return matchQuery && matchStatus;
    });
  }, [items, query, status]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof initialForm, string>> = {};
    if (!form.code.trim()) nextErrors.code = "Bắt buộc nhập mã";
    if (!form.name.trim()) nextErrors.name = "Bắt buộc nhập tên";
    if (!form.concentration.trim()) nextErrors.concentration = "Bắt buộc nhập nồng độ";
    if (!form.expiryDate) nextErrors.expiryDate = "Bắt buộc nhập hạn dùng";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (item: Solution) => {
    setIsEditing(true);
    setForm({
      code: item.code,
      name: item.name,
      concentration: item.concentration,
      preparedFrom: item.preparedFrom,
      preparedBy: item.preparedBy,
      preparedDate: item.preparedDate,
      expiryDate: item.expiryDate,
      status: item.status,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!validate()) {
      addToast("Vui lòng kiểm tra lại các trường bắt buộc", "error");
      return;
    }
    const payload: Solution = {
      id: isEditing && selected ? selected.id : `SOL-${Date.now()}`,
      code: form.code.trim(),
      name: form.name.trim(),
      concentration: form.concentration.trim(),
      preparedFrom: form.preparedFrom.trim(),
      preparedBy: form.preparedBy.trim(),
      preparedDate: form.preparedDate,
      expiryDate: form.expiryDate,
      status: form.status,
    };
    if (isEditing && selected) {
      setItems((prev) => prev.map((item) => (item.id === selected.id ? payload : item)));
      setSelected(payload);
      addToast(`Đã cập nhật ${payload.name}`, "success");
    } else {
      setItems((prev) => [payload, ...prev]);
      addToast(`Đã thêm mới ${payload.name}`, "success");
    }
    setForm(initialForm);
    setIsEditing(false);
    setIsFormOpen(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (!selected) return;
    setItems((prev) => prev.filter((item) => item.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    addToast(`Đã xoá ${selected.name}`, "success");
  };

  const handleExport = () => {
    downloadCsv(
      "solutions-export",
      items.map((item) => ({
        code: item.code,
        name: item.name,
        concentration: item.concentration,
        preparedBy: item.preparedBy,
        preparedDate: item.preparedDate,
        expiryDate: item.expiryDate,
        status: item.status,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  const visibleTabs = canViewAuditReports ? tabs : tabs.filter((t) => t !== "Audit trail");

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Preparation</p>
            <h1 className="text-2xl font-semibold text-slate-900">Dung dịch chuẩn</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            {canEdit ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
                <Plus className="h-4 w-4" />
                Tạo dung dịch chuẩn
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm dung dịch..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button key={option} type="button" onClick={() => setStatus(option)} className={`rounded-xl px-3 py-2 text-sm ${status === option ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-3 space-y-2">{Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><p className="font-medium text-slate-900">Không có dữ liệu</p></div>
        ) : (
          <DataTable
            columns={[
              { key: "code", header: "Mã dung dịch" },
              { key: "name", header: "Tên" },
              { key: "concentration", header: "Nồng độ" },
              { key: "preparedFrom", header: "Pha từ chất chuẩn" },
              { key: "preparedBy", header: "Người pha" },
              { key: "preparedDate", header: "Ngày pha", render: (value) => formatDate(String(value)) },
              { key: "expiryDate", header: "Hạn dùng", render: (value) => formatDate(String(value)) },
              { key: "status", header: "Trạng thái duyệt", render: (value) => <StatusBadge status={String(value)} /> },
            ]}
            rows={filtered}
            onRowClick={(row) => {
              setSelected(row);
              setTab("Thông tin chung");
            }}
          />
        )}

        {isFormOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">{isEditing ? "Chỉnh sửa dung dịch" : "Tạo dung dịch chuẩn"}</h2>
                <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { key: "code", label: "Mã dung dịch" },
                  { key: "name", label: "Tên" },
                  { key: "concentration", label: "Nồng độ" },
                  { key: "preparedFrom", label: "Pha từ chất chuẩn" },
                  { key: "preparedBy", label: "Người pha" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-slate-600">{field.label}</label>
                    <input value={form[field.key as keyof typeof form] as string} onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300" />
                    {errors[field.key as keyof typeof errors] ? <p className="mt-1 text-xs text-rose-600">{errors[field.key as keyof typeof errors]}</p> : null}
                  </div>
                ))}
                <div><label className="mb-1 block text-sm text-slate-600">Ngày pha</label><input type="date" value={form.preparedDate} onChange={(e) => setForm((prev) => ({ ...prev, preparedDate: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Hạn dùng</label><input type="date" value={form.expiryDate} onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.expiryDate ? <p className="mt-1 text-xs text-rose-600">{errors.expiryDate}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Trạng thái</label><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Solution["status"] }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>New</option><option>Pending Approval</option><option>In Use</option><option>Expired</option><option>Cancelled</option></select></div>
              </div>
              <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Huỷ</button><button type="button" onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">Lưu</button></div>
            </div>
          </div>
        ) : null}

        <DetailDrawer
          open={!!selected}
          onClose={() => setSelected(null)}
          subtitle="Solution detail"
          title={selected?.name ?? ""}
          layout="stacked"
          maxWidth="5xl"
          tabs={visibleTabs}
          activeTab={tab}
          onTabChange={setTab}
          actions={
            <>
              {canEdit && selected ? (
                <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              ) : null}
              {canManage && selected ? (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
              {selected ? (
                <button type="button" onClick={() => downloadCsv("label-export", [{ code: selected.code, name: selected.name, expiry: selected.expiryDate }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <FileDown className="h-4 w-4" />
                  Export label
                </button>
              ) : null}
            </>
          }
          tabContent={
            selected ? (
              <>
                {tab === "Thông tin chung" && (
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Mã</p><p className="font-medium text-slate-900">{selected.code}</p></div>
                      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Nồng độ</p><p className="font-medium text-slate-900">{selected.concentration}</p></div>
                      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Pha từ</p><p className="font-medium text-slate-900">{selected.preparedFrom}</p></div>
                      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Người pha</p><p className="font-medium text-slate-900">{selected.preparedBy}</p></div>
                      <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2"><p className="text-xs text-slate-500">Workflow</p><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
                    </div>
                    <LabelPreview title={selected.name} code={selected.code} secondary={`Nồng độ: ${selected.concentration}`} expiry={formatDate(selected.expiryDate)} location="Prep room" />
                  </div>
                )}
                {tab === "Tồn kho" && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Ngày pha</p><p className="text-xl font-semibold text-slate-900">{formatDate(selected.preparedDate)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Hạn dùng</p><p className="text-xl font-semibold text-slate-900">{formatDate(selected.expiryDate)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Trạng thái</p><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
                  </div>
                )}
                {tab === "Tài liệu COA/SDS" && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">COA</p><p className="text-sm text-slate-500">Metadata cho {selected.code}</p></div>
                    <div className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">SDS</p><p className="text-sm text-slate-500">Đã được cập nhật cho dung dịch chuẩn này</p></div>
                  </div>
                )}
                {tab === "Audit trail" && <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Audit trail cho {selected.code}</p></div>}
                {tab === "Label/QR" && (
                  <div className="flex justify-center">
                    <LabelPreview title={selected.name} code={selected.code} secondary={`Nồng độ: ${selected.concentration}`} expiry={formatDate(selected.expiryDate)} location="Prep room" />
                  </div>
                )}
              </>
            ) : null
          }
        />

        <ConfirmDialog open={confirmDelete} title="Xác nhận xoá" message={`Bạn có chắc chắn muốn xoá ${selected?.name || "mục này"}?`} onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      </div>
    </AppShell>
  );
}
