"use client";

import { Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { MappingSelectedPanel } from "@/components/admin/MappingSelectedPanel";
import { fetchMatrixMappingEditorAction, saveMatrixMappingsAction } from "@/lib/actions/catalog";
import type { SampleMatrixView, TestMethodView } from "@/types/catalog";

export function CatalogMappingsClient({
  matrices,
  initialMatrixId,
  mappedIds,
  availableTests,
}: {
  matrices: SampleMatrixView[];
  initialMatrixId: string;
  mappedIds: string[];
  availableTests: TestMethodView[];
}) {
  const [matrixId, setMatrixId] = useState(initialMatrixId);
  const [tests, setTests] = useState(availableTests);
  const [selected, setSelected] = useState<string[]>(mappedIds);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matrixName = matrices.find((m) => m.id === matrixId)?.name ?? "";

  const categoryFilterOptions = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const test of tests) {
      const existing = counts.get(test.categoryId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(test.categoryId, { id: test.categoryId, name: test.categoryName, count: 1 });
      }
    }
    return [
      { value: "all", label: `Tất cả nhóm (${tests.length})` },
      ...[...counts.values()]
        .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        .map((c) => ({ value: c.id, label: `${c.name} (${c.count})` })),
    ];
  }, [tests]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleTests = useMemo(() => {
    return tests
      .filter((test) => categoryFilter === "all" || test.categoryId === categoryFilter)
      .filter((test) => {
        if (!normalizedSearch) return true;
        return (
          test.code.toLowerCase().includes(normalizedSearch) ||
          test.name.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          a.categoryName.localeCompare(b.categoryName, "vi") || a.name.localeCompare(b.name, "vi"),
      );
  }, [tests, categoryFilter, normalizedSearch]);

  const selectedTests = useMemo(() => {
    const set = new Set(selected);
    return tests
      .filter((t) => set.has(t.id))
      .sort(
        (a, b) =>
          a.categoryName.localeCompare(b.categoryName, "vi") || a.name.localeCompare(b.name, "vi"),
      );
  }, [tests, selected]);

  const visibleIds = useMemo(() => visibleTests.map((t) => t.id), [visibleTests]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someVisibleSelected =
    visibleIds.some((id) => selected.includes(id)) && !allVisibleSelected;

  function loadMatrix(id: string) {
    setMatrixId(id);
    setCategoryFilter("all");
    setSearchQuery("");
    setSaveMessage(null);
    startTransition(async () => {
      const { tests: allTests, mappedIds: ids } = await fetchMatrixMappingEditorAction(id);
      setTests(allTests);
      setSelected(ids);
    });
  }

  function toggleTest(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id),
    );
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return [...next];
    });
  }

  function handleSave() {
    setSaveMessage(null);
    startTransition(async () => {
      await saveMatrixMappingsAction(matrixId, selected);
      setSaveMessage(
        `Đã lưu mapping cho "${matrixName}" (${selected.length} chỉ tiêu).`,
      );
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mapping nền mẫu – chỉ tiêu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Chọn nền mẫu, tick chỉ tiêu áp dụng, rồi lưu. Chỉ tiêu chỉ hiện trên phiếu YC sau khi được
          gán tại đây.
        </p>
      </div>

      {saveMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {saveMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-72">
          <label className="mb-1 block text-xs text-slate-500">Nền mẫu</label>
          <select
            value={matrixId}
            onChange={(e) => loadMatrix(e.target.value)}
            disabled={pending}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
          >
            {matrices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-56">
          <label className="mb-1 block text-xs text-slate-500">Nhóm chỉ tiêu</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={pending}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mã hoặc tên..."
              disabled={pending}
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-700">
              Danh sách chỉ tiêu
              {visibleTests.length !== tests.length ? (
                <span className="ml-2 text-slate-500">(hiển thị {visibleTests.length})</span>
              ) : null}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected;
                }}
                disabled={pending || visibleTests.length === 0}
                onChange={(e) => toggleAllVisible(e.target.checked)}
              />
              Chọn tất cả đang hiển thị
            </label>
          </div>

          <div
            className="table-scroll-viewport max-h-[560px] overflow-auto p-4"
            style={{ ["--table-max-height" as string]: "560px" }}
          >
            {pending && tests.length === 0 ? (
              <p className="text-sm text-slate-500">Đang tải chỉ tiêu...</p>
            ) : visibleTests.length === 0 ? (
              <p className="text-sm text-slate-500">Không tìm thấy chỉ tiêu phù hợp.</p>
            ) : (
              <div className="space-y-1">
                {visibleTests.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      disabled={pending}
                      onChange={(e) => toggleTest(t.id, e.target.checked)}
                    />
                    <span className="font-mono text-xs text-slate-400">{t.code}</span>
                    <span className="text-slate-500">{t.categoryName}</span>
                    <span className="text-slate-400">—</span>
                    <span className="font-medium text-slate-900">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <MappingSelectedPanel
          matrixName={matrixName}
          selectedTests={selectedTests}
          totalCount={tests.length}
          onRemove={(id) => toggleTest(id, false)}
          disabled={pending}
        />
      </div>

      <button
        type="button"
        disabled={pending || !matrixId}
        onClick={handleSave}
        className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : "Lưu mapping"}
      </button>
    </div>
  );
}
