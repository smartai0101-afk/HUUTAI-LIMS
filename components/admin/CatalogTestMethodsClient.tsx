"use client";



import Link from "next/link";

import { Search } from "lucide-react";

import { useMemo, useRef, useState, useTransition } from "react";

import { ListPaginationBar } from "@/components/ListPaginationBar";

import { SortableTableHeader } from "@/components/SortableTableHeader";

import { BulkUpdateTestMethodsModal } from "@/components/admin/BulkUpdateTestMethodsModal";
import { TestMethodMethodLinksEditor } from "@/components/admin/TestMethodMethodLinksEditor";
import { TestMethodMethodsListCell } from "@/components/admin/TestMethodMethodsListCell";
import { TestUnitInput } from "@/components/admin/TestUnitInput";
import {
  bulkHardDeleteTestMethodsAction,
  bulkHideTestMethodsAction,
  bulkUpdateTestMethodsAction,
  deleteTestMethodAction,
  hardDeleteTestMethodAction,
  importTestMethodsCatalogAction,
  saveTestMethodAction,
} from "@/lib/actions/catalog";
import type { TestMethodBulkPatch } from "@/lib/services/catalog/test-methods";

import { mergeTestUnitSuggestions } from "@/lib/catalog/common-test-units";

import {

  buildTestMethodExportRows,

  TEST_METHOD_EXCEL_COLUMNS,

  TEST_METHOD_TEMPLATE_ROW,

} from "@/lib/catalog/test-method-excel";

import { exportToXlsx } from "@/lib/excel";

import type { SortOrder } from "@/lib/list-query";

import type { TestMethodRow } from "@/lib/services/catalog/test-methods";

import type { TestCategoryView, TestMethodMethodLink } from "@/types/catalog";



const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm w-full";

const headerCellClass = "sticky top-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2";



type SortKey = "code" | "name" | "categoryName";



type AnalyticalMethodOption = {

  id: string;

  methodCode: string;

  methodName: string;

};



type EditDraft = {
  code: string;
  name: string;
  categoryId: string;
  methodLinks: TestMethodMethodLink[];
  defaultUnit: string;
  lod: string;
};



type Props = {

  initial: TestMethodRow[];

  categories: TestCategoryView[];

  analyticalMethods: AnalyticalMethodOption[];

};



function compareRows(a: TestMethodRow, b: TestMethodRow, sortBy: SortKey, sortOrder: SortOrder) {

  const dir = sortOrder === "asc" ? 1 : -1;

  let cmp = 0;

  if (sortBy === "code") {

    cmp = a.code.localeCompare(b.code, "vi");

  } else if (sortBy === "name") {

    cmp = a.name.localeCompare(b.name, "vi");

  } else {

    cmp = a.categoryName.localeCompare(b.categoryName, "vi") || a.name.localeCompare(b.name, "vi");

  }

  return cmp * dir;

}



export function CatalogTestMethodsClient({ initial, categories, analyticalMethods }: Props) {

  const [rows, setRows] = useState(initial);

  const [pending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);

  const [importResult, setImportResult] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editDraft, setEditDraft] = useState<EditDraft>({
    code: "",
    name: "",
    categoryId: "",
    methodLinks: [],
    defaultUnit: "",
    lod: "",
  });

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortKey>("categoryName");

  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const unitSuggestions = useMemo(

    () => mergeTestUnitSuggestions(rows.map((r) => r.defaultUnit)),

    [rows],

  );



  const countsByCategory = useMemo(() => {

    const counts = new Map<string, number>();

    for (const row of rows) {

      counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);

    }

    return counts;

  }, [rows]);



  const categoryFilterOptions = useMemo(

    () => [

      { value: "all", label: `Tất cả (${rows.length})` },

      ...categories.map((category) => ({

        value: category.id,

        label: `${category.name} (${countsByCategory.get(category.id) ?? 0})`,

      })),

    ],

    [categories, countsByCategory, rows.length],

  );



  const normalizedSearch = searchQuery.trim().toLowerCase();



  const visibleRows = useMemo(() => {

    return rows

      .filter((row) => categoryFilter === "all" || row.categoryId === categoryFilter)

      .filter((row) => {

        if (!normalizedSearch) return true;

        return (

          row.code.toLowerCase().includes(normalizedSearch) ||

          row.name.toLowerCase().includes(normalizedSearch)

        );

      })

      .sort((a, b) => compareRows(a, b, sortBy, sortOrder));

  }, [rows, categoryFilter, normalizedSearch, sortBy, sortOrder]);



  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));

  const safePage = Math.min(page, totalPages);



  const paginatedRows = useMemo(() => {

    const start = (safePage - 1) * pageSize;

    return visibleRows.slice(start, start + pageSize);

  }, [visibleRows, safePage, pageSize]);

  const paginatedIds = useMemo(() => paginatedRows.map((t) => t.id), [paginatedRows]);
  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds],
  );
  const deletableSelectedCount = selectedRows.filter((r) => r.usageCount === 0).length;
  const selectionDisabled = pending || editingId !== null;
  const allPageSelected =
    paginatedIds.length > 0 && paginatedIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    paginatedIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function toggleRowSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllPageSelected(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) paginatedIds.forEach((id) => next.add(id));
      else paginatedIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkHide() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`Ẩn ${ids.length} chỉ tiêu đã chọn khỏi danh mục?`)) return;
    setError(null);
    setBulkMessage(null);
    startTransition(async () => {
      try {
        const res = await bulkHideTestMethodsAction(ids);
        setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        clearSelection();
        setBulkMessage(`Đã ẩn ${res.hidden} chỉ tiêu.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể ẩn chỉ tiêu");
      }
    });
  }

  function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !confirm(
        `Xóa vĩnh viễn ${deletableSelectedCount} chỉ tiêu có thể xóa? Mapping nền–chỉ tiêu cũng sẽ bị xóa.`,
      )
    ) {
      return;
    }
    setError(null);
    setBulkMessage(null);
    startTransition(async () => {
      try {
        const res = await bulkHardDeleteTestMethodsAction(ids);
        const skippedIds = new Set(res.skipped.map((s) => s.id));
        setRows((prev) => prev.filter((r) => !ids.includes(r.id) || skippedIds.has(r.id)));
        clearSelection();
        let msg = `Đã xóa ${res.deleted} chỉ tiêu.`;
        if (res.skipped.length > 0) {
          msg += ` ${res.skipped.length} không xóa được (đang dùng trong phiếu YC).`;
        }
        setBulkMessage(msg);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể xóa chỉ tiêu");
      }
    });
  }

  function handleBulkUpdate(patch: TestMethodBulkPatch) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setError(null);
    setBulkMessage(null);
    startTransition(async () => {
      try {
        const res = await bulkUpdateTestMethodsAction(ids, patch);
        setBulkModalOpen(false);
        clearSelection();
        setBulkMessage(`Đã cập nhật ${res.updated} chỉ tiêu.`);
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể cập nhật chỉ tiêu");
      }
    });
  }

  function cancelEditIfNeeded() {

    if (editingId) {

      cancelEdit();

    }

  }



  function handleCategoryChange(value: string) {

    cancelEditIfNeeded();

    setCategoryFilter(value);

    setPage(1);

  }



  function handleSearchChange(value: string) {

    cancelEditIfNeeded();

    setSearchQuery(value);

    setPage(1);

  }



  function handleSort(nextSortKey: string) {

    cancelEditIfNeeded();

    const key = nextSortKey as SortKey;

    if (sortBy === key) {

      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));

    } else {

      setSortBy(key);

      setSortOrder("asc");

    }

    setPage(1);

  }



  function startEdit(row: TestMethodRow) {

    setEditingId(row.id);

    setEditDraft({
      code: row.code,
      name: row.name,
      categoryId: row.categoryId,
      methodLinks: row.methodLinks,
      defaultUnit: row.defaultUnit,
      lod: row.lod,
    });

    setError(null);

  }



  function cancelEdit() {

    setEditingId(null);

    setEditDraft({ code: "", name: "", categoryId: "", methodLinks: [], defaultUnit: "", lod: "" });

  }



  function saveEdit(id: string, resultType: TestMethodRow["resultType"]) {

    setError(null);

    const fd = new FormData();

    fd.set("id", id);

    fd.set("code", editDraft.code);

    fd.set("name", editDraft.name);

    fd.set("categoryId", editDraft.categoryId);

    fd.set("defaultUnit", editDraft.defaultUnit);

    fd.set("lod", editDraft.lod);
    fd.set("resultType", resultType);
    fd.set("methodLinks", JSON.stringify(
      editDraft.methodLinks.map((l, index) => ({
        methodId: l.methodId,
        unit: l.unit,
        lod: l.lod,
        loq: l.loq,
        isPrimary: l.isPrimary,
        sortOrder: index,
      })),
    ));

    startTransition(async () => {

      try {

        await saveTestMethodAction(fd);

        window.location.reload();

      } catch (e) {

        setError(e instanceof Error ? e.message : "Lỗi lưu chỉ tiêu");

      }

    });

  }



  function handleMethodLinksChange(inputs: import("@/lib/services/catalog/test-methods").TestMethodMethodLinkInput[]) {
    const methodLinks: TestMethodMethodLink[] = inputs.map((input, index) => {
      const m = analyticalMethods.find((x) => x.id === input.methodId);
      return {
        methodId: input.methodId,
        methodCode: m?.methodCode ?? "",
        methodName: m?.methodName ?? "",
        unit: input.unit ?? "",
        lod: input.lod ?? "",
        loq: input.loq ?? "",
        isPrimary: Boolean(input.isPrimary),
        sortOrder: input.sortOrder ?? index,
      };
    });
    setEditDraft((d) => ({ ...d, methodLinks }));
  }



  function renderRow(t: TestMethodRow) {

    const isEditing = editingId === t.id;

    const canHardDelete = t.usageCount === 0;



    return (

      <tr key={t.id} className={`border-t ${!t.active ? "bg-slate-50 text-slate-400" : ""}`}>

        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>

          <input

            type="checkbox"

            checked={selectedIds.has(t.id)}

            disabled={selectionDisabled}

            onChange={(e) => toggleRowSelection(t.id, e.target.checked)}

            aria-label={`Chọn ${t.code}`}

          />

        </td>

        <td className="px-3 py-2 font-mono text-xs">

          {isEditing ? (

            <input

              className={inputClass}

              value={editDraft.code}

              disabled={t.usageCount > 0}

              title={t.usageCount > 0 ? "Không đổi mã khi đã có phiếu YC dùng chỉ tiêu này" : undefined}

              onChange={(e) => setEditDraft((d) => ({ ...d, code: e.target.value }))}

            />

          ) : (

            t.code

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

            t.name

          )}

        </td>

        <td className="px-3 py-2">

          {isEditing ? (

            <select

              className={inputClass}

              value={editDraft.categoryId}

              onChange={(e) => setEditDraft((d) => ({ ...d, categoryId: e.target.value }))}

            >

              {categories.map((c) => (

                <option key={c.id} value={c.id}>

                  {c.name}

                </option>

              ))}

            </select>

          ) : (

            t.categoryName

          )}

        </td>

        {isEditing ? (
          <td colSpan={3} className="px-3 py-2 align-top">
            <div className="space-y-3">
              <TestMethodMethodLinksEditor
                key={`edit-links-${t.id}`}
                analyticalMethods={analyticalMethods}
                defaultLinks={editDraft.methodLinks}
                defaultUnit={editDraft.defaultUnit}
                defaultLod={editDraft.lod}
                unitSuggestions={unitSuggestions}
                disabled={pending}
                onChange={handleMethodLinksChange}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs text-slate-600">
                  ĐVT mặc định (khi thêm PP mới)
                  <TestUnitInput
                    listId={`test-unit-default-edit-${t.id}`}
                    suggestions={unitSuggestions}
                    value={editDraft.defaultUnit}
                    onChange={(v) => setEditDraft((d) => ({ ...d, defaultUnit: v }))}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  LOD mặc định
                  <input
                    className={`${inputClass} mt-1`}
                    value={editDraft.lod}
                    placeholder="LOD"
                    onChange={(e) => setEditDraft((d) => ({ ...d, lod: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          </td>
        ) : (
          <>
            <td className="px-3 py-2 align-top">
              <TestMethodMethodsListCell links={t.methodLinks} column="code" />
            </td>
            <td className="px-3 py-2 align-top">
              <TestMethodMethodsListCell links={t.methodLinks} column="unit" />
            </td>
            <td className="px-3 py-2 align-top">
              <TestMethodMethodsListCell links={t.methodLinks} column="lod" />
            </td>
          </>
        )}

        <td className="px-3 py-2">

          <div className="flex flex-wrap gap-2">

            {isEditing ? (

              <>

                <button

                  type="button"

                  disabled={pending}

                  className="text-xs text-cyan-700"

                  onClick={() => saveEdit(t.id, t.resultType)}

                >

                  Lưu

                </button>

                <button type="button" className="text-xs text-slate-500" onClick={cancelEdit}>

                  Hủy

                </button>

              </>

            ) : (

              <>

                {t.active ? (

                  <button type="button" className="text-xs text-cyan-700" onClick={() => startEdit(t)}>

                    Sửa

                  </button>

                ) : null}

                {t.active ? (

                  <button

                    type="button"

                    className="text-xs text-amber-700"

                    disabled={pending}

                    title="Ẩn khỏi danh mục và mapping, giữ trong DB"

                    onClick={() => {

                      setError(null);

                      startTransition(async () => {

                        try {

                          await deleteTestMethodAction(t.id);

                          setRows((prev) => prev.filter((x) => x.id !== t.id));

                        } catch (e) {

                          setError(e instanceof Error ? e.message : "Không thể ẩn chỉ tiêu");

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

                      ? "Xóa vĩnh viễn (chỉ khi chưa dùng trong phiếu YC)"

                      : `Không xóa được — đang dùng ở ${t.usageCount} dòng phiếu YC. Hãy ẩn thay vì xóa.`

                  }

                  onClick={() => {

                    if (!confirm(`Xóa vĩnh viễn chỉ tiêu "${t.name}"? Mapping nền–chỉ tiêu cũng sẽ bị xóa.`)) {

                      return;

                    }

                    setError(null);

                    startTransition(async () => {

                      try {

                        await hardDeleteTestMethodAction(t.id);

                        setRows((prev) => prev.filter((x) => x.id !== t.id));

                      } catch (e) {

                        setError(e instanceof Error ? e.message : "Không thể xóa chỉ tiêu");

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

  }



  return (

    <div className="space-y-4">

      <div>

        <h1 className="text-2xl font-semibold text-slate-900">Danh mục chỉ tiêu</h1>

        <p className="text-sm text-slate-500">

          {categories.length} nhóm · {rows.filter((r) => r.active).length} chỉ tiêu đang hoạt động

        </p>

      </div>



      {bulkMessage ? (

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

          {bulkMessage}

        </div>

      ) : null}



      {error ? (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>

      ) : null}

      {importResult ? (

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

          {importResult}

        </div>

      ) : null}



      <form
        className="space-y-3 rounded-2xl border bg-white p-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            try {
              await saveTestMethodAction(fd);
              window.location.reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Lỗi thêm chỉ tiêu");
            }
          });
        }}
      >
        <div className="grid gap-3 md:grid-cols-6">
          <input name="code" placeholder="Mã chỉ tiêu *" required className={inputClass} />
          <input name="name" placeholder="Tên chỉ tiêu *" required className={inputClass} />
          <select name="categoryId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Chọn nhóm *
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <TestUnitInput
            name="defaultUnit"
            listId="test-unit-add"
            suggestions={unitSuggestions}
            placeholder="ĐVT mặc định"
            className={inputClass}
          />
          <input name="lod" placeholder="LOD mặc định" className={inputClass} />
          <button type="submit" disabled={pending} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white">
            Thêm chỉ tiêu
          </button>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Phương pháp thử (tùy chọn)</p>
          <TestMethodMethodLinksEditor
            analyticalMethods={analyticalMethods}
            unitSuggestions={unitSuggestions}
            disabled={pending}
          />
        </div>
        <input type="hidden" name="resultType" value="numeric" />
      </form>



      <p className="text-xs text-slate-500">

        Sau khi thêm, gán chỉ tiêu cho từng nền mẫu tại{" "}

        <Link href="/admin/catalog/mappings" className="text-cyan-700 underline">

          Mapping nền–chỉ tiêu

        </Link>

        .

      </p>



      <div className="rounded-2xl border bg-white p-4">

        <h2 className="mb-2 text-sm font-semibold text-slate-800">Import / Export Excel</h2>

        <p className="mb-3 text-xs text-slate-500">

          Cột: code (Mã), name (Tên), categoryCode (Mã nhóm) hoặc categoryName (Nhóm), defaultMethodCode

          (Phương pháp thử), defaultUnit (ĐVT), lod (LOD). Import upsert theo mã — trùng mã sẽ cập nhật.

        </p>

        <div className="flex flex-wrap items-end gap-3">

          <form

            className="flex flex-wrap items-end gap-3"

            action={(fd) => {

              setError(null);

              setImportResult(null);

              startTransition(async () => {

                const res = await importTestMethodsCatalogAction(fd);

                if (!res.ok) {

                  setError(res.error);

                  return;

                }

                const r = res.result;

                setImportResult(

                  `Import xong: +${r.created} chỉ tiêu mới, cập nhật ${r.updated}` +

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

          <button

            type="button"

            disabled={pending}

            className="rounded-lg border px-3 py-2 text-sm"

            onClick={() =>

              exportToXlsx(

                "danh-muc-chi-tieu",

                buildTestMethodExportRows(rows),

                TEST_METHOD_EXCEL_COLUMNS,

              )

            }

          >

            Export Excel

          </button>

          <button

            type="button"

            disabled={pending}

            className="rounded-lg border px-3 py-2 text-sm"

            onClick={() =>

              exportToXlsx("mau-chi-tieu", [TEST_METHOD_TEMPLATE_ROW], TEST_METHOD_EXCEL_COLUMNS)

            }

          >

            Tải file mẫu

          </button>

        </div>

      </div>



      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-end">

          <p className="text-sm font-medium text-slate-800 sm:mr-auto">

            Danh sách chỉ tiêu

            {visibleRows.length !== rows.length ? (

              <span className="ml-2 font-normal text-slate-500">

                ({visibleRows.length}/{rows.length})

              </span>

            ) : null}

          </p>

          <div className="w-full sm:w-56">

            <label className="mb-1 block text-xs text-slate-500">Nhóm chỉ tiêu</label>

            <select

              value={categoryFilter}

              onChange={(e) => handleCategoryChange(e.target.value)}

              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"

            >

              {categoryFilterOptions.map((option) => (

                <option key={option.value} value={option.value}>

                  {option.label}

                </option>

              ))}

            </select>

          </div>

          <div className="w-full sm:w-64">

            <label className="mb-1 block text-xs text-slate-500">Tìm kiếm</label>

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input

                type="search"

                value={searchQuery}

                onChange={(e) => handleSearchChange(e.target.value)}

                placeholder="Mã hoặc tên..."

                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"

              />

            </div>

          </div>

        </div>



        {selectedIds.size > 0 && !selectionDisabled ? (

          <div className="flex flex-col gap-3 border-b border-cyan-100 bg-cyan-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm font-medium text-slate-800">Đã chọn: {selectedIds.size} chỉ tiêu</p>

            <div className="flex flex-wrap gap-2">

              <button

                type="button"

                onClick={() => setBulkModalOpen(true)}

                className="rounded-xl bg-cyan-600 px-3 py-2 text-sm text-white"

              >

                Sửa hàng loạt

              </button>

              <button

                type="button"

                onClick={handleBulkHide}

                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-800"

              >

                Ẩn ({selectedIds.size})

              </button>

              <button

                type="button"

                onClick={handleBulkDelete}

                disabled={deletableSelectedCount === 0}

                title={

                  deletableSelectedCount === 0

                    ? "Không có chỉ tiêu nào trong lựa chọn có thể xóa vĩnh viễn"

                    : undefined

                }

                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-600 disabled:opacity-40"

              >

                Xóa ({deletableSelectedCount})

              </button>

              <button

                type="button"

                onClick={clearSelection}

                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"

              >

                Bỏ chọn

              </button>

            </div>

          </div>

        ) : null}



        <div

          className="table-scroll-viewport max-h-[560px] overflow-auto"

          style={{ ["--table-max-height" as string]: "560px" }}

        >

          <table className="min-w-full border-separate border-spacing-0 text-sm">

            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">

              <tr>

                <th className={headerCellClass}>

                  <input

                    type="checkbox"

                    checked={allPageSelected}

                    ref={(el) => {

                      if (el) el.indeterminate = somePageSelected;

                    }}

                    disabled={selectionDisabled || paginatedIds.length === 0}

                    onChange={(e) => toggleAllPageSelected(e.target.checked)}

                    aria-label="Chọn tất cả trang hiện tại"

                  />

                </th>

                <th className={headerCellClass}>

                  <SortableTableHeader

                    label="Mã"

                    sortKey="code"

                    activeSortBy={sortBy}

                    activeSortOrder={sortOrder}

                    sortActive

                    onSort={handleSort}

                  />

                </th>

                <th className={headerCellClass}>

                  <SortableTableHeader

                    label="Tên"

                    sortKey="name"

                    activeSortBy={sortBy}

                    activeSortOrder={sortOrder}

                    sortActive

                    onSort={handleSort}

                  />

                </th>

                <th className={headerCellClass}>

                  <SortableTableHeader

                    label="Nhóm"

                    sortKey="categoryName"

                    activeSortBy={sortBy}

                    activeSortOrder={sortOrder}

                    sortActive

                    onSort={handleSort}

                  />

                </th>

                <th className={headerCellClass}>Phương pháp thử</th>

                <th className={headerCellClass}>ĐVT</th>

                <th className={headerCellClass}>LOD</th>

                <th className={headerCellClass}>Thao tác</th>

              </tr>

            </thead>

            <tbody>

              {paginatedRows.length === 0 ? (

                <tr>

                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">

                    Không tìm thấy chỉ tiêu phù hợp.

                  </td>

                </tr>

              ) : (

                paginatedRows.map((t) => renderRow(t))

              )}

            </tbody>

          </table>

        </div>



        {visibleRows.length > pageSize ? (

          <ListPaginationBar

            page={safePage}

            totalPages={totalPages}

            total={visibleRows.length}

            limit={pageSize}

            onPageChange={(nextPage) => {

              cancelEditIfNeeded();

              setPage(nextPage);

            }}

            onLimitChange={(nextLimit) => {

              cancelEditIfNeeded();

              setPageSize(nextLimit);

              setPage(1);

            }}

            limitOptions={[25, 50, 100]}

          />

        ) : null}

      </div>



      <BulkUpdateTestMethodsModal

        open={bulkModalOpen}

        selectedCount={selectedIds.size}

        categories={categories}

        analyticalMethods={analyticalMethods}

        unitSuggestions={unitSuggestions}

        pending={pending}

        onClose={() => setBulkModalOpen(false)}

        onApply={handleBulkUpdate}

      />

    </div>

  );

}


