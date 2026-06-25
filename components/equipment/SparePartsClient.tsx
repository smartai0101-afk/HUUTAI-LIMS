"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Link2, PackageMinus, Trash2, Unlink, X } from "lucide-react";
import { EquipmentAppShell } from "@/components/equipment/EquipmentAppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createSparePart,
  deleteSparePart,
  linkSparePartToEquipment,
  recordSparePartUsage,
  unlinkSparePartFromEquipment,
  updateSparePart,
} from "@/lib/actions/equipment-spare-parts";
import { EQUIPMENT_NAV, EQUIPMENT_SUBTITLE, SPARE_PART } from "@/lib/equipment-labels";
import { exportToXlsx } from "@/lib/excel";
import type { SparePartView } from "@/types";

const exportColumns = [
  { key: "code", header: SPARE_PART.code },
  { key: "name", header: SPARE_PART.name },
  { key: "manufacturer", header: SPARE_PART.manufacturer },
  { key: "productCode", header: SPARE_PART.productCode },
  { key: "lotNumber", header: SPARE_PART.lotNumber },
  { key: "stockQty", header: SPARE_PART.stockQty },
  { key: "minQty", header: SPARE_PART.minQty },
  { key: "unit", header: SPARE_PART.unit },
  { key: "notes", header: SPARE_PART.notes },
];

const formFields = [
  { key: "code", label: SPARE_PART.code },
  { key: "name", label: SPARE_PART.name },
  { key: "manufacturer", label: SPARE_PART.manufacturer },
  { key: "productCode", label: SPARE_PART.productCode },
  { key: "lotNumber", label: SPARE_PART.lotNumber },
  { key: "stockQty", label: SPARE_PART.stockQty },
  { key: "minQty", label: SPARE_PART.minQty },
  { key: "unit", label: SPARE_PART.unit },
] as const;

type SparePartFormKey = (typeof formFields)[number]["key"];

const initialForm: Record<SparePartFormKey | "notes", string> = {
  code: "",
  name: "",
  manufacturer: "",
  productCode: "",
  lotNumber: "",
  stockQty: "0",
  minQty: "0",
  unit: "",
  notes: "",
};

export function SparePartsClient({
  items,
  equipmentOptions,
}: {
  items: SparePartView[];
  equipmentOptions: EquipmentOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [selected, setSelected] = useState<SparePartView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [linkEquipmentId, setLinkEquipmentId] = useState("");
  const [usageForm, setUsageForm] = useState({ equipmentId: "", quantity: "1", usedDate: "", notes: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SparePartView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchQuery =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.productCode.toLowerCase().includes(q) ||
        item.lotNumber.toLowerCase().includes(q);
      const matchLow = !lowOnly || item.isLowStock;
      return matchQuery && matchLow;
    });
  }, [items, query, lowOnly]);

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: SparePartView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      manufacturer: item.manufacturer,
      productCode: item.productCode,
      lotNumber: item.lotNumber,
      stockQty: String(item.stockQty),
      minQty: String(item.minQty),
      unit: item.unit,
      notes: item.notes,
    });
    setIsFormOpen(true);
  };

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast("Mã và tên phụ kiện là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateSparePart(fd) : await createSparePart(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(isEditing ? "Đã cập nhật phụ kiện" : "Đã thêm phụ kiện", "success");
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const submitLink = () => {
    if (!selected || !linkEquipmentId) {
      addToast("Chọn thiết bị để liên kết", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("sparePartId", selected.id);
    fd.set("equipmentId", linkEquipmentId);
    startTransition(async () => {
      const result = await linkSparePartToEquipment(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã liên kết phụ kiện với thiết bị", "success");
      setIsLinkOpen(false);
      router.refresh();
    });
  };

  const submitUsage = () => {
    if (!selected || !usageForm.equipmentId || !usageForm.usedDate) {
      addToast("Thiết bị và ngày sử dụng là bắt buộc", "error");
      return;
    }
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("sparePartId", selected.id);
    fd.set("equipmentId", usageForm.equipmentId);
    fd.set("quantity", usageForm.quantity);
    fd.set("usedDate", usageForm.usedDate);
    fd.set("notes", usageForm.notes);
    startTransition(async () => {
      const result = await recordSparePartUsage(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã ghi xuất phụ kiện", "success");
      setIsUsageOpen(false);
      router.refresh();
    });
  };

  const handleUnlink = (linkId: string) => {
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", linkId);
    startTransition(async () => {
      const result = await unlinkSparePartFromEquipment(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã gỡ liên kết", "success");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteSparePart(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa phụ kiện", "success");
      setDeleteTarget(null);
      setSelected(null);
      router.refresh();
    });
  };

  return (
    <EquipmentAppShell>
      <EquipmentModuleShell
        title="Quản lý phụ kiện"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        onCreate={openCreate}
        createLabel="Thêm phụ kiện"
        canEdit={canEdit}
        onExport={() => exportToXlsx("phu-kien", filtered, exportColumns)}
        filters={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Chỉ tồn thấp
          </label>
        }
      >
        <DataTable
          columns={[
            { key: "code", header: SPARE_PART.code },
            { key: "name", header: SPARE_PART.name },
            { key: "manufacturer", header: SPARE_PART.manufacturer },
            { key: "productCode", header: SPARE_PART.productCode },
            { key: "lotNumber", header: SPARE_PART.lotNumber },
            {
              key: "stockQty",
              header: SPARE_PART.stockQty,
              render: (_, row) => (
                <span className={row.isLowStock ? "font-medium text-rose-600" : ""}>
                  {row.stockQty} {row.unit}
                </span>
              ),
            },
            { key: "minQty", header: SPARE_PART.minQty },
            { key: "unit", header: SPARE_PART.unit },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
          onRowClick={setSelected}
          rowActions={
            canManage
              ? (row) => (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700">
                    <Trash2 className="inline h-3 w-3" />
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
        tabs={["Chi tiết"]}
        activeTab="Chi tiết"
        onTabChange={() => undefined}
        actions={
          selected && canEdit ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm"
                onClick={() => openEdit(selected)}
              >
                <Edit className="h-4 w-4" /> Sửa
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
                onClick={() => {
                  setLinkEquipmentId("");
                  setIsLinkOpen(true);
                }}
              >
                <Link2 className="h-4 w-4" /> Liên kết thiết bị
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm text-white"
                onClick={() => {
                  setUsageForm({ equipmentId: "", quantity: "1", usedDate: new Date().toISOString().slice(0, 10), notes: "" });
                  setIsUsageOpen(true);
                }}
              >
                <PackageMinus className="h-4 w-4" /> Ghi xuất
              </button>
            </div>
          ) : null
        }
        tabContent={
          selected ? (
            <div className="space-y-4 text-sm">
              {selected.isLowStock ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  Tồn kho thấp — cần bổ sung
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-slate-500">{SPARE_PART.manufacturer}</dt><dd>{selected.manufacturer || "-"}</dd></div>
                <div><dt className="text-slate-500">{SPARE_PART.productCode}</dt><dd>{selected.productCode || "-"}</dd></div>
                <div><dt className="text-slate-500">{SPARE_PART.lotNumber}</dt><dd>{selected.lotNumber || "-"}</dd></div>
                <div><dt className="text-slate-500">{SPARE_PART.stockQty}</dt><dd>{selected.stockQty} {selected.unit}</dd></div>
                <div><dt className="text-slate-500">{SPARE_PART.minQty}</dt><dd>{selected.minQty}</dd></div>
                <div><dt className="text-slate-500">{SPARE_PART.unit}</dt><dd>{selected.unit || "-"}</dd></div>
              </dl>
              {selected.notes ? (
                <div>
                  <p className="text-xs text-slate-500">{SPARE_PART.notes}</p>
                  <p className="text-slate-600">{selected.notes}</p>
                </div>
              ) : null}
              <div>
                <h4 className="font-medium text-slate-900">Thiết bị liên kết</h4>
                {selected.equipmentLinks.length ? (
                  <ul className="mt-2 space-y-1">
                    {selected.equipmentLinks.map((link) => (
                      <li key={link.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span>{link.equipmentCode} — {link.equipmentName}</span>
                        {canEdit ? (
                          <button
                            type="button"
                            className="text-slate-500 hover:text-rose-600"
                            onClick={() => handleUnlink(link.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-400">Chưa liên kết thiết bị</p>
                )}
              </div>
            </div>
          ) : null
        }
      />

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold">{isEditing ? "Sửa phụ kiện" : "Thêm phụ kiện"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {formFields.map(({ key, label }) => (
            <label key={key} className="block text-sm">
              <span className="text-slate-600">{label}</span>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={isEditing && key === "code"}
              />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">{SPARE_PART.notes}</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setIsFormOpen(false)}>
            <X className="inline h-4 w-4" /> Hủy
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={submit}
          >
            Lưu
          </button>
        </div>
      </ModalShell>

      <ModalShell open={isLinkOpen} onClose={() => setIsLinkOpen(false)} className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold">Liên kết thiết bị</h2>
        <EquipmentSelect value={linkEquipmentId} onChange={setLinkEquipmentId} options={equipmentOptions} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setIsLinkOpen(false)}>Hủy</button>
          <button type="button" disabled={pending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white" onClick={submitLink}>Liên kết</button>
        </div>
      </ModalShell>

      <ModalShell open={isUsageOpen} onClose={() => setIsUsageOpen(false)} className="max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold">Ghi xuất phụ kiện</h2>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-slate-600">Thiết bị</span>
            <EquipmentSelect value={usageForm.equipmentId} onChange={(v) => setUsageForm((f) => ({ ...f, equipmentId: v }))} options={equipmentOptions} className="mt-1" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Số lượng</span>
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" value={usageForm.quantity} onChange={(e) => setUsageForm((f) => ({ ...f, quantity: e.target.value }))} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Ngày sử dụng</span>
            <input type="date" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3" value={usageForm.usedDate} onChange={(e) => setUsageForm((f) => ({ ...f, usedDate: e.target.value }))} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setIsUsageOpen(false)}>Hủy</button>
          <button type="button" disabled={pending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white" onClick={submitUsage}>Ghi xuất</button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa phụ kiện"
        message={`Xóa ${deleteTarget?.code}?`}
        cancelLabel="Hủy"
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </EquipmentAppShell>
  );
}
