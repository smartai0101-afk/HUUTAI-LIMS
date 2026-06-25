"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { transactions as defaultTransactions } from "@/lib/data";
import { downloadCsv, readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { Transaction } from "@/types";

const transactionTypes = ["All", "IN", "OUT", "USE", "DISPOSE"];
const initialForm = {
  date: "",
  type: "IN" as Transaction["type"],
  itemCode: "",
  itemName: "",
  quantity: 0,
  unit: "L",
  performedBy: "",
  purpose: "",
};

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>(defaultTransactions);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const { canEdit } = useRole();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStorage<Transaction[]>(STORAGE_KEYS.transactions, defaultTransactions);
      setItems(stored);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) writeStorage(STORAGE_KEYS.transactions, items);
  }, [items, loading]);

  const rows = useMemo(() => {
    return items.filter((row) => {
      const matchType = selectedType === "All" || row.type === selectedType;
      const matchQuery = [row.itemCode, row.itemName, row.performedBy].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      return matchType && matchQuery;
    });
  }, [items, query, selectedType]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof initialForm, string>> = {};
    if (!form.date) nextErrors.date = "Bắt buộc nhập ngày";
    if (!form.itemCode.trim()) nextErrors.itemCode = "Bắt buộc nhập mã item";
    if (!form.itemName.trim()) nextErrors.itemName = "Bắt buộc nhập tên item";
    if (!form.performedBy.trim()) nextErrors.performedBy = "Bắt buộc nhập người thực hiện";
    if (form.quantity <= 0) nextErrors.quantity = "Số lượng phải lớn hơn 0";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      addToast("Vui lòng kiểm tra lại các trường bắt buộc", "error");
      return;
    }
    const newItem: Transaction = {
      id: `TRX-${Date.now()}`,
      date: form.date,
      type: form.type,
      itemCode: form.itemCode.trim(),
      itemName: form.itemName.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      performedBy: form.performedBy.trim(),
      purpose: form.purpose.trim(),
    };
    setItems((prev) => [newItem, ...prev]);
    setForm(initialForm);
    setIsFormOpen(false);
    setErrors({});
    addToast("Đã tạo giao dịch thành công", "success");
  };

  const handleExport = () => {
    downloadCsv(
      "transactions-export",
      items.map((item) => ({
        date: item.date,
        type: item.type,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        performedBy: item.performedBy,
        purpose: item.purpose,
      })),
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Operation</p>
            <h1 className="text-2xl font-semibold text-slate-900">Nhập/Xuất</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"><Download className="h-4 w-4" />Export CSV</button>
            {canEdit ? (
              <button type="button" onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"><Plus className="h-4 w-4" />Tạo giao dịch</button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm giao dịch..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300" />
            </div>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => <button key={type} onClick={() => setSelectedType(type)} className={`rounded-xl px-3 py-2 text-sm ${selectedType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{type}</button>)}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-3 space-y-2">{Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><p className="font-medium text-slate-900">Không có dữ liệu</p></div>
        ) : (
          <DataTable columns={[
            { key: "date", header: "Ngày", render: (value) => formatDate(String(value)) },
            { key: "type", header: "Loại", render: (value) => <StatusBadge status={String(value)} /> },
            { key: "itemCode", header: "Mã item" },
            { key: "itemName", header: "Tên item" },
            { key: "quantity", header: "Số lượng" },
            { key: "performedBy", header: "Người thực hiện" },
            { key: "purpose", header: "Mục đích" },
          ]} rows={rows} />
        )}

        {isFormOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-900">Tạo giao dịch</h2><button onClick={() => setIsFormOpen(false)}><X className="h-5 w-5 text-slate-500" /></button></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Loại giao dịch</label>
                  <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as Transaction["type"] }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                    <option>IN</option><option>OUT</option><option>USE</option><option>DISPOSE</option>
                  </select>
                </div>
                <div><label className="mb-1 block text-sm text-slate-600">Ngày</label><input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.date ? <p className="mt-1 text-xs text-rose-600">{errors.date}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Mã item</label><input value={form.itemCode} onChange={(e) => setForm((prev) => ({ ...prev, itemCode: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.itemCode ? <p className="mt-1 text-xs text-rose-600">{errors.itemCode}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Tên item</label><input value={form.itemName} onChange={(e) => setForm((prev) => ({ ...prev, itemName: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.itemName ? <p className="mt-1 text-xs text-rose-600">{errors.itemName}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Số lượng</label><input type="number" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.quantity ? <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Đơn vị</label><select value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option>L</option><option>mL</option><option>kg</option><option>g</option></select></div>
                <div><label className="mb-1 block text-sm text-slate-600">Người thực hiện</label><input value={form.performedBy} onChange={(e) => setForm((prev) => ({ ...prev, performedBy: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />{errors.performedBy ? <p className="mt-1 text-xs text-rose-600">{errors.performedBy}</p> : null}</div>
                <div><label className="mb-1 block text-sm text-slate-600">Mục đích</label><input value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
              </div>
              <div className="mt-4 flex justify-end gap-2"><button onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Huỷ</button><button onClick={handleSubmit} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white">Lưu</button></div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
