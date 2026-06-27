"use client";

import { useEffect, useState, useTransition } from "react";
import type { InventorySourceType, InventoryTransactionType } from "@prisma/client";
import { ModalShell } from "@/components/ModalShell";
import {
  adjustInventoryItem,
  discardInventoryItem,
  expireInventoryItem,
  fetchInventorySummary,
  fetchInventoryTransactions,
} from "@/lib/actions/inventory-transactions";
import { INVENTORY_LIFECYCLE_LABELS } from "@/lib/services/inventory-transaction-types";
import { INVENTORY_TRANSACTION_TYPE_LABELS } from "@/lib/services/inventory-transaction-types";
import type { InventorySummary } from "@/lib/services/inventory-transaction-summary";

type Props = {
  sourceType: InventorySourceType;
  sourceId: string;
  sourceCode: string;
  unit: string;
  stockLotId?: string | null;
  inventoryStatus?: string;
  canEdit: boolean;
  canManage: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

export function InventoryItemPanel({
  sourceType,
  sourceId,
  sourceCode,
  unit,
  stockLotId = null,
  inventoryStatus = "Active",
  canEdit,
  canManage,
  onSuccess,
  onError,
}: Props) {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [txRows, setTxRows] = useState<
    Array<{
      id: string;
      transactionType: InventoryTransactionType | null;
      quantityUsed: number;
      unit: string;
      quantityBefore: number;
      quantityAfter: number;
      ledgerAfter: number | null;
      reason: string;
      module: string;
    }>
  >([]);
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"discard" | "adjust" | "expire" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"in" | "out">("out");

  const appendItemRef = (fd: FormData) => {
    fd.set("sourceType", sourceType);
    fd.set("sourceId", sourceId);
    if (stockLotId) fd.set("stockLotId", stockLotId);
  };

  const reload = () => {
    const fd = new FormData();
    appendItemRef(fd);
    startTransition(async () => {
      const s = await fetchInventorySummary(fd);
      if (s.success && s.summary) setSummary(s.summary);
      const t = await fetchInventoryTransactions(fd);
      if (t.success && t.rows) setTxRows(t.rows);
    });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, sourceId, stockLotId]);

  const submitDiscard = () => {
    const fd = new FormData();
    appendItemRef(fd);
    fd.set("quantity", quantity);
    fd.set("unit", unit);
    fd.set("reason", reason);
    startTransition(async () => {
      const result = await discardInventoryItem(fd);
      if (result.error) {
        onError(result.error);
        return;
      }
      onSuccess("Đã ghi nhận loại bỏ tồn kho");
      setDialog(null);
      setQuantity("");
      setReason("");
      reload();
    });
  };

  const submitAdjust = () => {
    const fd = new FormData();
    appendItemRef(fd);
    fd.set("quantity", quantity);
    fd.set("unit", unit);
    fd.set("direction", adjustDirection);
    fd.set("reason", reason);
    startTransition(async () => {
      const result = await adjustInventoryItem(fd);
      if (result.error) {
        onError(result.error);
        return;
      }
      onSuccess("Đã điều chỉnh tồn kho");
      setDialog(null);
      setQuantity("");
      setReason("");
      reload();
    });
  };

  const submitExpire = () => {
    const fd = new FormData();
    fd.set("sourceType", sourceType);
    fd.set("sourceId", sourceId);
    fd.set("reason", reason);
    startTransition(async () => {
      const result = await expireInventoryItem(fd);
      if (result.error) {
        onError(result.error);
        return;
      }
      onSuccess("Đã ghi nhận hết hạn");
      setDialog(null);
      setReason("");
      reload();
    });
  };

  const statusLabel =
    INVENTORY_LIFECYCLE_LABELS[inventoryStatus as keyof typeof INVENTORY_LIFECYCLE_LABELS] ??
    inventoryStatus;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Tồn kho · {sourceCode}</p>
          <p className="text-sm font-medium">Trạng thái: {statusLabel}</p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setDialog("discard")}
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700"
            >
              Loại bỏ
            </button>
            {canManage ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDialog("adjust")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                >
                  Điều chỉnh
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDialog("expire")}
                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs text-amber-800"
                >
                  Hết hạn
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Khả dụng</p>
            <p className="font-semibold">
              {summary.available} {unit}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Đã dùng</p>
            <p>{summary.consumed}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Loại bỏ</p>
            <p>{summary.discarded}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-xs text-slate-500">Nhập/ĐC+</p>
            <p>{summary.created + summary.adjustmentIn}</p>
          </div>
        </div>
      ) : null}

      {txRows.length > 0 ? (
        <div className="max-h-48 overflow-auto text-xs">
          <p className="mb-2 text-slate-500">
            Trước→Sau là snapshot cache tại thời điểm ghi; Tồn ledger là số dư tính từ sổ cái.
          </p>
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Loại</th>
                <th>SL</th>
                <th>Trước→Sau</th>
                <th>Tồn ledger</th>
                <th>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {txRows.slice(0, 10).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-1">
                    {row.transactionType
                      ? INVENTORY_TRANSACTION_TYPE_LABELS[row.transactionType]
                      : "—"}
                  </td>
                  <td>
                    {row.quantityUsed} {row.unit}
                  </td>
                  <td>
                    {row.quantityBefore}→{row.quantityAfter}
                  </td>
                  <td>
                    {row.ledgerAfter != null ? `${row.ledgerAfter} ${unit}` : "—"}
                  </td>
                  <td className="truncate max-w-[120px]">{row.reason || row.module}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ModalShell open={dialog === "discard"} onClose={() => setDialog(null)} className="max-w-md rounded-2xl bg-white p-6">
        <h3 className="font-semibold">Loại bỏ tồn kho</h3>
        <input
          type="number"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={`Số lượng (${unit})`}
          className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Lý do bắt buộc..."
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setDialog(null)} className="rounded-xl border px-4 py-2 text-sm">
            Hủy
          </button>
          <button
            type="button"
            disabled={pending || !reason.trim() || !quantity}
            onClick={submitDiscard}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Xác nhận
          </button>
        </div>
      </ModalShell>

      <ModalShell open={dialog === "adjust"} onClose={() => setDialog(null)} className="max-w-md rounded-2xl bg-white p-6">
        <h3 className="font-semibold">Điều chỉnh tồn kho (QA/Admin)</h3>
        <select
          value={adjustDirection}
          onChange={(e) => setAdjustDirection(e.target.value as "in" | "out")}
          className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
        >
          <option value="out">Giảm tồn</option>
          <option value="in">Tăng tồn</option>
        </select>
        <input
          type="number"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={`Số lượng (${unit})`}
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Lý do bắt buộc..."
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setDialog(null)} className="rounded-xl border px-4 py-2 text-sm">
            Hủy
          </button>
          <button
            type="button"
            disabled={pending || !reason.trim() || !quantity}
            onClick={submitAdjust}
            className="rounded-xl bg-cyan-700 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Xác nhận
          </button>
        </div>
      </ModalShell>

      <ModalShell open={dialog === "expire"} onClose={() => setDialog(null)} className="max-w-md rounded-2xl bg-white p-6">
        <h3 className="font-semibold">Ghi nhận hết hạn</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Lý do bắt buộc..."
          className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setDialog(null)} className="rounded-xl border px-4 py-2 text-sm">
            Hủy
          </button>
          <button
            type="button"
            disabled={pending || !reason.trim()}
            onClick={submitExpire}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Xác nhận
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
