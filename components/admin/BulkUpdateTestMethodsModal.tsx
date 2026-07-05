"use client";

import { useEffect, useState } from "react";
import { TestUnitInput } from "@/components/admin/TestUnitInput";
import type { TestMethodBulkPatch } from "@/lib/services/catalog/test-methods";
import type { TestCategoryView } from "@/types/catalog";

const UNCHANGED_METHOD = "__unchanged__";
const CLEAR_METHOD = "__clear__";

type AnalyticalMethodOption = {
  id: string;
  methodCode: string;
  methodName: string;
};

type Props = {
  open: boolean;
  selectedCount: number;
  categories: TestCategoryView[];
  analyticalMethods: AnalyticalMethodOption[];
  unitSuggestions: string[];
  pending?: boolean;
  onClose: () => void;
  onApply: (patch: TestMethodBulkPatch) => void;
};

export function BulkUpdateTestMethodsModal({
  open,
  selectedCount,
  categories,
  analyticalMethods,
  unitSuggestions,
  pending,
  onClose,
  onApply,
}: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [defaultMethodId, setDefaultMethodId] = useState(UNCHANGED_METHOD);
  const [defaultUnit, setDefaultUnit] = useState("");
  const [lod, setLod] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategoryId("");
    setDefaultMethodId(UNCHANGED_METHOD);
    setDefaultUnit("");
    setLod("");
  }, [open]);

  if (!open) return null;

  const hasChanges =
    categoryId !== "" ||
    defaultMethodId !== UNCHANGED_METHOD ||
    defaultUnit.trim() !== "" ||
    lod.trim() !== "";

  function handleApply() {
    if (!hasChanges) return;
    if (!confirm(`Cập nhật ${selectedCount} chỉ tiêu với các trường đã chọn?`)) {
      return;
    }
    const patch: TestMethodBulkPatch = {};
    if (categoryId) patch.categoryId = categoryId;
    if (defaultMethodId === CLEAR_METHOD) patch.defaultMethodId = null;
    else if (defaultMethodId !== UNCHANGED_METHOD) patch.defaultMethodId = defaultMethodId;
    if (defaultUnit.trim()) patch.defaultUnit = defaultUnit.trim();
    if (lod.trim()) patch.lod = lod.trim();
    onApply(patch);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Sửa hàng loạt</h3>
        <p className="mt-1 text-sm text-slate-500">
          Áp dụng cho {selectedCount} chỉ tiêu đã chọn. Mã và Tên không đổi. Để trống hoặc chọn
          &quot;Không thay đổi&quot; để giữ giá trị hiện tại.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nhóm chỉ tiêu</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={pending}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">— Không thay đổi —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phương pháp thử</span>
            <select
              value={defaultMethodId}
              onChange={(e) => setDefaultMethodId(e.target.value)}
              disabled={pending}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value={UNCHANGED_METHOD}>— Không thay đổi —</option>
              <option value={CLEAR_METHOD}>— Xóa phương pháp thử —</option>
              {analyticalMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.methodCode} — {m.methodName}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">ĐVT</span>
            <TestUnitInput
              listId="bulk-test-unit"
              suggestions={unitSuggestions}
              value={defaultUnit}
              onChange={setDefaultUnit}
              placeholder="— Không thay đổi —"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">LOD</span>
            <input
              type="text"
              value={lod}
              onChange={(e) => setLod(e.target.value)}
              placeholder="— Không thay đổi —"
              disabled={pending}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl px-4 py-2 text-sm text-slate-600"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={pending || !hasChanges}
            onClick={handleApply}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Đang lưu..." : "Áp dụng"}
          </button>
        </div>
      </div>
    </div>
  );
}
