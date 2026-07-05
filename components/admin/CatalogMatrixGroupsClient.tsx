"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteSampleMatrixGroupAction,
  hardDeleteSampleMatrixGroupAction,
  reindexMatrixGroupsAction,
  saveSampleMatrixGroupAction,
} from "@/lib/actions/catalog";
import type { SampleMatrixGroupRow } from "@/lib/services/catalog/sample-matrix-groups";

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm w-full";

type EditDraft = {
  code: string;
  name: string;
  sortOrder: string;
};

export function CatalogMatrixGroupsClient({ initial }: { initial: SampleMatrixGroupRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ code: "", name: "", sortOrder: "" });

  function startEdit(row: SampleMatrixGroupRow) {
    setEditingId(row.id);
    setEditDraft({
      code: row.code,
      name: row.name,
      sortOrder: String(row.sortOrder),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({ code: "", name: "", sortOrder: "" });
  }

  function saveEdit(id: string) {
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("code", editDraft.code);
    fd.set("name", editDraft.name);
    fd.set("sortOrder", editDraft.sortOrder);
    fd.set("active", "true");
    startTransition(async () => {
      try {
        await saveSampleMatrixGroupAction(fd);
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi lưu nhóm");
      }
    });
  }

  function saveSortOrder(row: SampleMatrixGroupRow, sortOrder: string) {
    const next = Number(sortOrder);
    if (!Number.isFinite(next) || next <= 0 || next === row.sortOrder) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", row.id);
    fd.set("code", row.code);
    fd.set("name", row.name);
    fd.set("sortOrder", String(next));
    fd.set("active", row.active ? "true" : "false");
    startTransition(async () => {
      try {
        await saveSampleMatrixGroupAction(fd);
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi cập nhật thứ tự");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nhóm nền mẫu</h1>
          <p className="text-sm text-slate-500">
            Thứ tự hiển thị trong dropdown &quot;Loại mẫu mặc định&quot; — mỗi số chỉ dùng một lần.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await reindexMatrixGroupsAction();
                  window.location.reload();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Lỗi chuẩn hóa thứ tự");
                }
              });
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Chuẩn hóa thứ tự (1, 2, 3…)
          </button>
          <Link href="/admin/catalog/matrices" className="rounded-lg border px-3 py-2 text-sm">
            Quản lý nền mẫu →
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await saveSampleMatrixGroupAction(fd);
              window.location.reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Lỗi lưu nhóm");
            }
          });
        }}
      >
        <input name="code" placeholder="Mã nhóm *" required className={inputClass} />
        <input name="name" placeholder="Tên nhóm *" required className={inputClass} />
        <input
          name="sortOrder"
          type="number"
          min={1}
          placeholder="Thứ tự (để trống = tự gán)"
          className={inputClass}
        />
        <input type="hidden" name="active" value="true" />
        <button type="submit" disabled={pending} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white">
          {pending ? "Đang lưu..." : "Thêm nhóm"}
        </button>
      </form>

      <table className="min-w-full rounded-2xl border bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Mã</th>
            <th className="px-3 py-2">Tên nhóm</th>
            <th className="w-28 px-3 py-2">Thứ tự</th>
            <th className="px-3 py-2">Nền mẫu</th>
            <th className="px-3 py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isEditing = editingId === r.id;
            const canHardDelete = r.matrixCount === 0;
            return (
              <tr key={r.id} className={`border-t ${!r.active ? "bg-slate-50 text-slate-400" : ""}`}>
                <td className="px-3 py-2 font-mono text-xs">
                  {isEditing ? (
                    <input
                      className={inputClass}
                      value={editDraft.code}
                      disabled={r.matrixCount > 0}
                      title={r.matrixCount > 0 ? "Không đổi mã khi đã có nền mẫu" : undefined}
                      onChange={(e) => setEditDraft((d) => ({ ...d, code: e.target.value }))}
                    />
                  ) : (
                    r.code
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      className={inputClass}
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  ) : (
                    r.name
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={editDraft.sortOrder}
                      onChange={(e) => setEditDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                    />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      defaultValue={r.sortOrder}
                      disabled={pending || !r.active}
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                      onBlur={(e) => saveSortOrder(r, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-slate-500">{r.matrixCount}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs text-cyan-700"
                          onClick={() => saveEdit(r.id)}
                        >
                          Lưu
                        </button>
                        <button type="button" className="text-xs text-slate-500" onClick={cancelEdit}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        {r.active ? (
                          <button
                            type="button"
                            className="text-xs text-cyan-700"
                            onClick={() => startEdit(r)}
                          >
                            Sửa
                          </button>
                        ) : null}
                        {r.active ? (
                          <button
                            type="button"
                            className="text-xs text-amber-700"
                            disabled={pending || r.matrixCount > 0}
                            title={
                              r.matrixCount > 0
                                ? "Chỉ ẩn được khi không còn nền mẫu thuộc nhóm"
                                : "Ẩn khỏi dropdown, giữ trong DB"
                            }
                            onClick={() => {
                              setError(null);
                              startTransition(async () => {
                                try {
                                  await deleteSampleMatrixGroupAction(r.id);
                                  setRows((prev) => prev.filter((x) => x.id !== r.id));
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Không thể ẩn nhóm");
                                }
                              });
                            }}
                          >
                            Ẩn
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={pending || !canHardDelete}
                          title={
                            canHardDelete
                              ? "Xóa vĩnh viễn (chỉ khi chưa có nền mẫu)"
                              : "Không xóa được khi còn nền mẫu — hãy ẩn hoặc chuyển nền trước"
                          }
                          onClick={() => {
                            if (!confirm(`Xóa vĩnh viễn nhóm "${r.name}"?`)) return;
                            setError(null);
                            startTransition(async () => {
                              try {
                                await hardDeleteSampleMatrixGroupAction(r.id);
                                setRows((prev) => prev.filter((x) => x.id !== r.id));
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Không thể xóa nhóm");
                              }
                            });
                          }}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
