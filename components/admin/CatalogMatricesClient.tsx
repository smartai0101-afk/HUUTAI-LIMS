"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteSampleMatrixAction,
  hardDeleteSampleMatrixAction,
  importMatrixCatalogAction,
  saveSampleMatrixAction,
} from "@/lib/actions/catalog";
import type { SampleMatrixRow } from "@/lib/services/catalog/sample-matrices";
import type { SampleMatrixGroupView } from "@/types/catalog";

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm w-full";

type EditDraft = {
  code: string;
  name: string;
  groupId: string;
  sortOrder: string;
};

type Props = {
  initial: SampleMatrixRow[];
  groups: SampleMatrixGroupView[];
};

export function CatalogMatricesClient({ initial, groups }: Props) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    code: "",
    name: "",
    groupId: "",
    sortOrder: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  function startEdit(row: SampleMatrixRow) {
    setEditingId(row.id);
    setEditDraft({
      code: row.code,
      name: row.name,
      groupId: row.groupId ?? "",
      sortOrder: String(row.sortOrder),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({ code: "", name: "", groupId: "", sortOrder: "" });
  }

  function saveEdit(id: string) {
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("code", editDraft.code);
    fd.set("name", editDraft.name);
    fd.set("groupId", editDraft.groupId);
    fd.set("sortOrder", editDraft.sortOrder);
    fd.set("active", "true");
    startTransition(async () => {
      try {
        await saveSampleMatrixAction(fd);
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi lưu nền mẫu");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Danh mục nền mẫu</h1>
          <p className="text-sm text-slate-500">
            Nền mẫu chi tiết thuộc từng nhóm. Sau khi thêm, gán chỉ tiêu tại Mapping nền–chỉ tiêu.
          </p>
        </div>
        <Link href="/admin/catalog/matrix-groups" className="rounded-lg border px-3 py-2 text-sm">
          ← Nhóm nền mẫu
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {importResult ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {importResult}
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await saveSampleMatrixAction(fd);
              window.location.reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Lỗi lưu nền mẫu");
            }
          });
        }}
      >
        <input name="code" placeholder="Mã nền *" required className={inputClass} />
        <input name="name" placeholder="Tên nền mẫu *" required className={inputClass} />
        <select name="groupId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Chọn nhóm *
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <input name="sortOrder" type="number" placeholder="Thứ tự" defaultValue={0} className={inputClass} />
        <input type="hidden" name="active" value="true" />
        <button type="submit" disabled={pending} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white">
          Thêm nền
        </button>
      </form>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Import Excel / CSV</h2>
        <p className="mb-3 text-xs text-slate-500">
          Cột: groupCode, groupName, matrixCode, matrixName, sortOrder (tùy chọn)
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          action={(fd) => {
            setError(null);
            setImportResult(null);
            startTransition(async () => {
              const res = await importMatrixCatalogAction(fd);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              const r = res.result;
              setImportResult(
                `Import xong: +${r.groupsCreated} nhóm, cập nhật ${r.groupsUpdated} nhóm; +${r.matricesCreated} nền, cập nhật ${r.matricesUpdated} nền` +
                  (r.errors.length ? `; ${r.errors.length} lỗi` : ""),
              );
              if (r.errors.length) {
                setError(r.errors.map((e) => `Dòng ${e.row}: ${e.message}`).join("; "));
              }
              if (fileRef.current) fileRef.current.value = "";
              window.location.reload();
            });
          }}
        >
          <input ref={fileRef} type="file" name="file" accept=".xlsx,.xls,.csv" className="text-sm" />
          <button type="submit" disabled={pending} className="rounded-lg border px-3 py-2 text-sm">
            {pending ? "Đang import..." : "Import"}
          </button>
        </form>
      </div>

      <table className="min-w-full rounded-2xl border bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Mã</th>
            <th className="px-3 py-2">Tên</th>
            <th className="px-3 py-2">Nhóm</th>
            <th className="w-24 px-3 py-2">TT</th>
            <th className="px-3 py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isEditing = editingId === r.id;
            const canHardDelete = r.usageCount === 0;
            return (
              <tr key={r.id} className={`border-t ${!r.active ? "bg-slate-50 text-slate-400" : ""}`}>
                <td className="px-3 py-2 font-mono text-xs">
                  {isEditing ? (
                    <input
                      className={inputClass}
                      value={editDraft.code}
                      disabled={r.usageCount > 0}
                      title={r.usageCount > 0 ? "Không đổi mã khi đã có phiếu/mẫu dùng nền này" : undefined}
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
                    <select
                      className={inputClass}
                      value={editDraft.groupId}
                      onChange={(e) => setEditDraft((d) => ({ ...d, groupId: e.target.value }))}
                    >
                      <option value="" disabled>
                        Chọn nhóm
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    r.groupName || "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      className={inputClass}
                      value={editDraft.sortOrder}
                      onChange={(e) => setEditDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                    />
                  ) : (
                    r.sortOrder
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
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
                        <Link
                          href={`/admin/catalog/mappings?matrixId=${r.id}`}
                          className="text-xs text-cyan-700"
                        >
                          Chỉ tiêu
                        </Link>
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
                            disabled={pending}
                            title="Ẩn khỏi dropdown, giữ trong DB"
                            onClick={() => {
                              setError(null);
                              startTransition(async () => {
                                try {
                                  await deleteSampleMatrixAction(r.id);
                                  setRows((prev) => prev.filter((x) => x.id !== r.id));
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Không thể ẩn nền mẫu");
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
                              ? "Xóa vĩnh viễn (chỉ khi chưa dùng trong phiếu YC/mẫu)"
                              : `Không xóa được — đang dùng ở ${r.usageCount} phiếu/mẫu. Hãy ẩn thay vì xóa.`
                          }
                          onClick={() => {
                            if (!confirm(`Xóa vĩnh viễn nền mẫu "${r.name}"? Mapping chỉ tiêu cũng sẽ bị xóa.`)) {
                              return;
                            }
                            setError(null);
                            startTransition(async () => {
                              try {
                                await hardDeleteSampleMatrixAction(r.id);
                                setRows((prev) => prev.filter((x) => x.id !== r.id));
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Không thể xóa nền mẫu");
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
