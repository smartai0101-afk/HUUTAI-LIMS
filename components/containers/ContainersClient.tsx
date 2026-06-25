"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Edit, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { LabelPreview } from "@/components/LabelPreview";
import { ModalShell } from "@/components/ModalShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { createContainer, deleteContainer, updateContainer } from "@/lib/actions/containers";
import { downloadCsv } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { ContainerView, UsageLogView } from "@/types";

type ChemicalOption = { id: string; code: string; name: string; unit: string; reorderLevel: number };
type StandardOption = { id: string; code: string; name: string };

const statusFilters = ["All", "Available", "Low Stock", "Expired", "Pending Disposal"];
const tabs = ["Thông tin chung", "Nhật ký sử dụng", "Label/QR"];

const initialForm = {
  code: "",
  itemKind: "chemical" as "chemical" | "standard",
  chemicalId: "",
  standardId: "",
  lot: "",
  location: "",
  quantity: 0,
  unit: "L",
  expiryDate: "",
  afterOpenExpiry: "",
  pendingDisposal: false,
};

export function ContainersClient({
  items,
  chemicals,
  standards,
  usageLogsByContainer,
}: {
  items: ContainerView[];
  chemicals: ChemicalOption[];
  standards: StandardOption[];
  usageLogsByContainer: Record<string, UsageLogView[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<ContainerView | null>(() => {
    const code = searchParams.get("code");
    return code ? items.find((i) => i.code === code) ?? null : null;
  });
  const [tab, setTab] = useState("Thông tin chung");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.itemName.toLowerCase().includes(query.toLowerCase()) ||
        item.lot.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === "All" || item.status === status;
      return matchQuery && matchStatus;
    });
  }, [items, query, status]);

  const openCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: ContainerView) => {
    setIsEditing(true);
    setForm({
      code: item.code,
      itemKind: item.itemType,
      chemicalId: item.chemicalId ?? "",
      standardId: item.standardId ?? "",
      lot: item.lot,
      location: item.location,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      afterOpenExpiry: item.afterOpenExpiry ?? "",
      pendingDisposal: item.status === "Pending Disposal",
    });
    setIsFormOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("code", form.code);
    fd.set("lot", form.lot);
    fd.set("location", form.location);
    fd.set("quantity", String(form.quantity));
    fd.set("unit", form.unit);
    fd.set("expiryDate", form.expiryDate);
    fd.set("afterOpenExpiry", form.afterOpenExpiry);
    fd.set("pendingDisposal", String(form.pendingDisposal));
    if (form.itemKind === "chemical") {
      fd.set("chemicalId", form.chemicalId);
      fd.set("standardId", "");
    } else {
      fd.set("standardId", form.standardId);
      fd.set("chemicalId", "");
    }
    if (isEditing && selected) fd.set("id", selected.id);
    return fd;
  };

  const handleSubmit = () => {
    if (!form.code.trim() || !form.lot.trim() || !form.expiryDate) {
      addToast("Mã bình, lot và hạn dùng là bắt buộc", "error");
      return;
    }
    if (form.itemKind === "chemical" && !form.chemicalId) {
      addToast("Chọn hoá chất", "error");
      return;
    }
    if (form.itemKind === "standard" && !form.standardId) {
      addToast("Chọn chất chuẩn", "error");
      return;
    }

    startTransition(async () => {
      const fd = buildFormData();
      const result = isEditing ? await updateContainer(fd) : await createContainer(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật bình/lô" : "Đã thêm bình/lô mới", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    const fd = new FormData();
    fd.set("user", role);
    fd.set("id", selected.id);
    startTransition(async () => {
      const result = await deleteContainer(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(`Đã xoá ${selected.code}`, "success");
      setSelected(null);
      setConfirmDelete(false);
      router.refresh();
    });
  };

  const handleExport = () => {
    downloadCsv(
      "containers-export",
      items.map((item) => ({
        code: item.code,
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemName,
        lot: item.lot,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        status: item.status,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  const selectedLogs = selected ? usageLogsByContainer[selected.id] ?? [] : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Physical stock</p>
            <h1 className="text-2xl font-semibold text-slate-900">Bình / Lô</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            {canEdit ? (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
                <Plus className="h-4 w-4" />
                Thêm bình/lô
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bình/lô..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300" />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-xl px-3 py-2 text-sm ${status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            { key: "code", header: "Mã bình" },
            { key: "itemName", header: "Tên" },
            { key: "lot", header: "Lot" },
            { key: "location", header: "Vị trí" },
            { key: "quantity", header: "SL" },
            { key: "unit", header: "ĐVT" },
            { key: "expiryDate", header: "Hạn dùng", render: (v) => formatDate(String(v)) },
            { key: "status", header: "Trạng thái", render: (v) => <StatusBadge status={String(v)} /> },
          ]}
          rows={filtered}
          onRowClick={(row) => { setSelected(row); setTab("Thông tin chung"); }}
        />

        <DetailDrawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.itemName ?? ""}
          subtitle={selected?.code}
          tabs={tabs}
          activeTab={tab}
          onTabChange={setTab}
          layout="stacked"
          maxWidth="5xl"
          actions={
            selected ? (
              <>
                {canEdit ? (
                  <button type="button" onClick={() => openEdit(selected)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><Edit className="h-4 w-4" />Sửa</button>
                ) : null}
                {canManage ? (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"><Trash2 className="h-4 w-4" />Xoá</button>
                ) : null}
              </>
            ) : undefined
          }
          tabContent={
            selected && tab === "Thông tin chung" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs text-slate-500">Loại</p><p className="font-medium">{selected.itemType === "chemical" ? "Hoá chất" : "Chất chuẩn"}</p></div>
                <div><p className="text-xs text-slate-500">Mã catalog</p><p className="font-medium">{selected.itemCode}</p></div>
                <div><p className="text-xs text-slate-500">Lot</p><p className="font-medium">{selected.lot}</p></div>
                <div><p className="text-xs text-slate-500">Vị trí</p><p className="font-medium">{selected.location || "-"}</p></div>
                <div><p className="text-xs text-slate-500">Số lượng</p><p className="font-medium">{selected.quantity} {selected.unit}</p></div>
                <div><p className="text-xs text-slate-500">Trạng thái</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-xs text-slate-500">Hạn dùng</p><p className="font-medium">{formatDate(selected.expiryDate)}</p></div>
                {selected.afterOpenExpiry ? (
                  <div><p className="text-xs text-slate-500">Hạn sau mở</p><p className="font-medium">{formatDate(selected.afterOpenExpiry)}</p></div>
                ) : null}
              </div>
            ) : selected && tab === "Nhật ký sử dụng" ? (
              selectedLogs.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có nhật ký sử dụng</p>
              ) : (
                <div className="space-y-2">
                  {selectedLogs.map((log) => (
                    <div key={log.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={log.type} />
                        <span className="text-xs text-slate-500">{formatDate(log.date)}</span>
                      </div>
                      <p className="mt-1">{log.quantity} {log.unit} · {log.performedBy}</p>
                      <p className="text-xs text-slate-500">{log.purpose}</p>
                    </div>
                  ))}
                </div>
              )
            ) : selected && tab === "Label/QR" ? (
              <LabelPreview
                title={selected.itemName}
                code={selected.code}
                secondary={`Lot: ${selected.lot}`}
                expiry={formatDate(selected.expiryDate)}
                location={selected.location}
              />
            ) : null
          }
        />

        <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{isEditing ? "Sửa bình/lô" : "Thêm bình/lô"}</h2>
                <button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-sm text-slate-600">Mã bình</label><input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Loại</label><select value={form.itemKind} onChange={(e) => setForm((p) => ({ ...p, itemKind: e.target.value as "chemical" | "standard" }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="chemical">Hoá chất</option><option value="standard">Chất chuẩn</option></select></div>
                {form.itemKind === "chemical" ? (
                  <div className="sm:col-span-2"><label className="mb-1 block text-sm text-slate-600">Hoá chất</label><select value={form.chemicalId} onChange={(e) => { const c = chemicals.find((x) => x.id === e.target.value); setForm((p) => ({ ...p, chemicalId: e.target.value, unit: c?.unit ?? p.unit })); }} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Chọn...</option>{chemicals.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select></div>
                ) : (
                  <div className="sm:col-span-2"><label className="mb-1 block text-sm text-slate-600">Chất chuẩn</label><select value={form.standardId} onChange={(e) => setForm((p) => ({ ...p, standardId: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Chọn...</option>{standards.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}</select></div>
                )}
                <div><label className="mb-1 block text-sm text-slate-600">Lot</label><input value={form.lot} onChange={(e) => setForm((p) => ({ ...p, lot: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Vị trí</label><input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Số lượng</label><input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Đơn vị</label><select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>L</option><option>mL</option><option>kg</option><option>g</option></select></div>
                <div><label className="mb-1 block text-sm text-slate-600">Hạn dùng</label><input type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-sm text-slate-600">Hạn sau mở</label><input type="date" value={form.afterOpenExpiry} onChange={(e) => setForm((p) => ({ ...p, afterOpenExpiry: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.pendingDisposal} onChange={(e) => setForm((p) => ({ ...p, pendingDisposal: e.target.checked }))} />Chờ huỷ</label></div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Huỷ</button>
                <button type="button" disabled={pending} onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Đang lưu..." : "Lưu"}</button>
              </div>
        </ModalShell>

        <ConfirmDialog open={confirmDelete} title="Xoá bình/lô?" message={`Xoá ${selected?.code}?`} onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      </div>
    </AppShell>
  );
}
