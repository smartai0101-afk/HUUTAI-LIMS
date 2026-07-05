"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  createSampleRequestAction,
  submitSampleRequestAction,
  updateSampleRequestAction,
} from "@/lib/actions/samples";
import {
  fetchTestMethodsAction,
  fetchTestPackagesAction,
} from "@/lib/actions/catalog";
import { upsertRequestSampleLinesAction, bulkApplyTestsAction } from "@/lib/actions/request-lines";
import { copyTestsFromSampleAction } from "@/lib/actions/request-lines";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import {
  BulkApplyTestsModal,
  applyTestsBulkLocal,
  parsePastedSampleLines,
  rowsToSampleLineDrafts,
  SAMPLE_LINE_IMPORT_COLUMNS,
} from "@/components/samples/request/BulkApplyTestsModal";
import { CopyTestsFromSampleModal } from "@/components/samples/request/CopyTestsFromSampleModal";
import { RequestFormLayout } from "@/components/samples/request/RequestFormLayout";
import { RequestHeaderSection } from "@/components/samples/request/RequestHeaderSection";
import { SampleDetailPanel } from "@/components/samples/request/SampleDetailPanel";
import { SampleGrid } from "@/components/samples/request/SampleGrid";
import { linesFromView, type SampleLineDraft } from "@/components/samples/request/SampleTable";
import type { MethodOption, SampleRequestDetailView } from "@/types/samples";
import type { RequestSampleLineView, SampleMatrixGroupView, SampleMatrixView, TestMethodView, TestPackageView } from "@/types/catalog";

type Props = {
  methodOptions: MethodOption[];
  matrices: SampleMatrixView[];
  matrixGroups: SampleMatrixGroupView[];
  initial?: SampleRequestDetailView | null;
  initialLines?: RequestSampleLineView[];
};

function resolveInitialGroupId(
  groups: SampleMatrixGroupView[],
  matrices: SampleMatrixView[],
  sampleType?: string,
): string {
  if (!sampleType) return groups[0]?.id ?? "";
  const byName = groups.find((g) => g.name === sampleType);
  if (byName) return byName.id;
  const matrix = matrices.find((m) => m.name === sampleType || m.groupName === sampleType);
  if (matrix?.groupId) return matrix.groupId;
  return groups[0]?.id ?? "";
}

function linesToInput(lines: SampleLineDraft[]) {
  return lines.map((l) => ({
    id: l.id,
    tempCode: l.tempCode,
    sampleName: l.sampleName,
    matrixId: l.matrixId,
    sampleType: l.sampleType,
    quantity: l.quantity ? Number(l.quantity) : null,
    unit: l.unit,
    conditionNote: l.conditionNote,
    testMethodIds: l.testMethodIds,
  }));
}

export function SampleRequestFormClient({
  methodOptions,
  matrices,
  matrixGroups,
  initial,
  initialLines = [],
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const readOnly = Boolean(initial && initial.status !== "Draft");
  const [selectedGroupId, setSelectedGroupId] = useState(() =>
    resolveInitialGroupId(matrixGroups, matrices, initial?.sampleType),
  );
  const [showAllMatrices, setShowAllMatrices] = useState(false);
  const defaultSampleType =
    matrixGroups.find((g) => g.id === selectedGroupId)?.name ?? initial?.sampleType ?? "";

  const matricesForSelect = useMemo(() => {
    if (showAllMatrices || !selectedGroupId) return matrices;
    return matrices.filter((m) => m.groupId === selectedGroupId);
  }, [matrices, selectedGroupId, showAllMatrices]);

  const [lines, setLines] = useState<SampleLineDraft[]>(() =>
    initialLines.length > 0
      ? linesFromView(initialLines)
      : [
          {
            tempCode: "TMP-001",
            sampleName: "",
            matrixId: null,
            sampleType: defaultSampleType,
            quantity: "",
            unit: "",
            conditionNote: "",
            testMethodIds: [],
          },
        ],
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [testsText, setTestsText] = useState((initial?.requestedTests ?? []).join("\n"));
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    initial?.methods.map((m) => m.methodId) ?? [],
  );
  const [lineTestMethods, setLineTestMethods] = useState<TestMethodView[]>([]);
  const [packages, setPackages] = useState<TestPackageView[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const selectedLine = selectedIndex != null ? lines[selectedIndex] : null;

  useEffect(() => {
    if (!selectedLine?.matrixId) {
      setLineTestMethods([]);
      setPackages([]);
      return;
    }
    setTestsLoading(true);
    void Promise.all([
      fetchTestMethodsAction(selectedLine.matrixId),
      fetchTestPackagesAction(selectedLine.matrixId),
    ])
      .then(([methods, pkgs]) => {
        setLineTestMethods(methods);
        setPackages(pkgs);
      })
      .finally(() => setTestsLoading(false));
  }, [selectedLine?.matrixId]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (readOnly) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }
      const text = e.clipboardData?.getData("text");
      if (!text?.includes("\t") && !text?.includes(",")) return;
      const parsed = parsePastedSampleLines(
        text,
        (document.getElementById("request-form")?.querySelector('[name="sampleType"]') as HTMLInputElement | null)
          ?.value ?? initial?.sampleType ?? "",
      );
      if (parsed.length < 2) return;
      e.preventDefault();
      setLines((prev) => [...prev, ...parsed]);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [readOnly, initial?.sampleType, defaultSampleType]);

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId);
    const groupName = matrixGroups.find((g) => g.id === groupId)?.name ?? "";
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        sampleType: groupName,
        matrixId:
          l.matrixId && !showAllMatrices && matrices.find((m) => m.id === l.matrixId)?.groupId !== groupId
            ? null
            : l.matrixId,
        testMethodIds:
          l.matrixId && !showAllMatrices && matrices.find((m) => m.id === l.matrixId)?.groupId !== groupId
            ? []
            : l.testMethodIds,
      })),
    );
  }

  const receivedProgress = useMemo(() => {
    const received = initialLines.filter((l) => l.status === "received").length;
    return { received, total: initial?.sampleCount ?? lines.length };
  }, [initialLines, initial?.sampleCount, lines.length]);

  function buildFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("requestedTests", JSON.stringify(testsText.split("\n").map((s) => s.trim()).filter(Boolean)));
    fd.set("methodIds", JSON.stringify(selectedMethods));
    fd.set("sampleCount", String(lines.length));
    return fd;
  }

  function handleSave(form: HTMLFormElement, andSubmit = false) {
    setError("");
    startTransition(async () => {
      const fd = buildFormData(form);
      const result = initial
        ? await updateSampleRequestAction(initial.id, fd)
        : await createSampleRequestAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      const id =
        initial?.id ??
        ("id" in result && typeof result.id === "string" ? result.id : undefined);
      if (!id) {
        setError("Không lấy được mã phiếu");
        return;
      }

      const linesResult = await upsertRequestSampleLinesAction(id, linesToInput(lines));
      if (linesResult.error) {
        setError(linesResult.error);
        return;
      }

      if (andSubmit) {
        const submit = await submitSampleRequestAction(id);
        if (submit.error) {
          setError(submit.error);
          return;
        }
      }
      router.push(`/samples/requests/${id}`);
      router.refresh();
    });
  }

  function updateLineTests(testMethodIds: string[]) {
    if (selectedIndex == null) return;
    setLines((prev) =>
      prev.map((l, i) => (i === selectedIndex ? { ...l, testMethodIds } : l)),
    );
  }

  function applyPackage(testMethodIds: string[]) {
    if (selectedIndex == null) return;
    const merged = [...new Set([...lines[selectedIndex]!.testMethodIds, ...testMethodIds])];
    updateLineTests(merged);
  }

  const sourceTestIds = selectedLine?.testMethodIds ?? [];

  return (
    <>
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {readOnly ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Phiếu đã gửi — chỉ xem, không thể chỉnh sửa.
        </div>
      ) : null}

      <div className={readOnly ? "opacity-70" : undefined}>
        <form id="request-form">
          <RequestFormLayout
            toolbar={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    {initial ? `Phiếu ${initial.requestCode}` : "Tạo phiếu yêu cầu mới"}
                  </h1>
                  {initial ? (
                    <p className="text-xs text-slate-500">
                      Tiếp nhận: {receivedProgress.received}/{receivedProgress.total} mẫu
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {initial ? (
                    <>
                      <Link
                        href={`/samples/requests/${initial.id}/matrix`}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Ma trận
                      </Link>
                      {["Received", "Processing", "PartiallyCompleted"].includes(initial.status) ? (
                        <Link
                          href={`/samples/receive?requestId=${initial.id}`}
                          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800"
                        >
                          Tiếp nhận ({receivedProgress.received}/{receivedProgress.total})
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                  <Link href="/samples/requests" className="rounded-lg border px-3 py-1.5 text-sm">
                    Quay lại
                  </Link>
                  {!readOnly ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const form = document.getElementById("request-form") as HTMLFormElement;
                          handleSave(form, false);
                        }}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Lưu nháp
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const form = document.getElementById("request-form") as HTMLFormElement;
                          handleSave(form, true);
                        }}
                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white"
                      >
                        {pending ? "Đang lưu..." : "Lưu & gửi"}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            }
            header={
              <RequestHeaderSection
                initial={initial}
                lineCount={lines.length}
                matrixGroups={matrixGroups}
                selectedGroupId={selectedGroupId}
                onGroupChange={handleGroupChange}
                readOnly={readOnly}
              />
            }
            samples={
              <SampleGrid
                lines={lines}
                matrices={matricesForSelect}
                allMatrices={matrices}
                defaultSampleType={defaultSampleType}
                showAllMatrices={showAllMatrices}
                onToggleShowAllMatrices={() => setShowAllMatrices((v) => !v)}
                onChange={setLines}
                onSelectLine={setSelectedIndex}
                selectedIndex={selectedIndex}
                readOnly={readOnly}
                onImport={() => setImportOpen(true)}
                onCopyTests={() => setCopyOpen(true)}
                onBulkApply={() => setBulkOpen(true)}
                onDuplicate={(index) => {
                  const src = lines[index]!;
                  setLines([
                    ...lines,
                    {
                      ...src,
                      id: undefined,
                      tempCode: `${src.tempCode}-COPY`,
                      sampleName: `${src.sampleName} (bản sao)`,
                    },
                  ]);
                }}
                onRemove={(index) => {
                  setLines(lines.filter((_, i) => i !== index));
                  if (selectedIndex === index) setSelectedIndex(null);
                  else if (selectedIndex != null && selectedIndex > index) {
                    setSelectedIndex(selectedIndex - 1);
                  }
                }}
              />
            }
            detail={
              <SampleDetailPanel
                line={selectedLine}
                matrices={matrices}
                testMethods={lineTestMethods}
                packages={packages}
                onChangeTests={updateLineTests}
                onApplyPackage={applyPackage}
                readOnly={readOnly}
                loading={testsLoading}
              />
            }
            legacy={
              methodOptions.length > 0 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setLegacyOpen((o) => !o)}
                    className="flex w-full items-center justify-between text-sm font-medium text-slate-600"
                  >
                    Phương pháp đề xuất (tùy chọn)
                    {legacyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {legacyOpen ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {methodOptions.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 rounded-lg border bg-white p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMethods.includes(m.id)}
                            onChange={(e) => {
                              setSelectedMethods((prev) =>
                                e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                              );
                            }}
                          />
                          <span className="truncate">
                            {m.methodCode} — {m.methodName}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null
            }
          />
        </form>
      </div>

      <BulkApplyTestsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        matrices={matrices}
        sourceTestMethodIds={sourceTestIds}
        hasPersistedRequest={Boolean(initial?.id)}
        onApplyLocal={(filter) => {
          setLines((prev) => applyTestsBulkLocal(prev, sourceTestIds, selectedIndex, filter));
        }}
        onApplyServer={
          initial?.id
            ? (filter) => {
                void bulkApplyTestsAction(initial.id, sourceTestIds, filter).then(() =>
                  router.refresh(),
                );
              }
            : undefined
        }
      />

      <CopyTestsFromSampleModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        lines={
          initialLines.length > 0
            ? initialLines
            : lines
                .filter((l) => l.testMethodIds.length > 0)
                .map((l, i) => ({
                  id: l.id ?? `draft-${i}`,
                  lineNo: i + 1,
                  tempCode: l.tempCode,
                  sampleName: l.sampleName,
                  matrixId: l.matrixId,
                  matrixCode: null,
                  matrixName: null,
                  sampleType: l.sampleType,
                  quantity: l.quantity ? Number(l.quantity) : null,
                  unit: l.unit,
                  conditionNote: l.conditionNote,
                  status: "draft" as const,
                  sampleId: null,
                  tests: l.testMethodIds.map((tid, j) => ({
                    id: `draft-t-${i}-${j}`,
                    testMethodId: tid,
                    testMethodCode: "",
                    testMethodName: "",
                    categoryName: "",
                    defaultUnit: "",
                    methodId: null,
                    methodCode: null,
                    priority: "normal" as const,
                    note: "",
                  })),
                }))
        }
        currentLineId={selectedLine?.id ?? (selectedIndex != null ? `draft-${selectedIndex}` : undefined)}
        onCopy={(sourceId, targetIds) => {
          if (initial?.id && !sourceId.startsWith("draft-")) {
            void copyTestsFromSampleAction(sourceId, targetIds).then(() => router.refresh());
            return;
          }
          const sourceIdx = sourceId.startsWith("draft-")
            ? Number(sourceId.replace("draft-", ""))
            : lines.findIndex((l) => l.id === sourceId);
          const source = sourceIdx >= 0 ? lines[sourceIdx] : null;
          if (!source) return;
          const ids = source.testMethodIds;
          setLines((prev) =>
            prev.map((l, i) => {
              const lid = l.id ?? `draft-${i}`;
              if (!targetIds.includes(lid) && !targetIds.includes(l.id ?? "")) return l;
              return { ...l, testMethodIds: [...new Set([...l.testMethodIds, ...ids])] };
            }),
          );
        }}
      />

      <ExcelImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import danh sách mẫu từ Excel"
        columnMap={SAMPLE_LINE_IMPORT_COLUMNS}
        previewHeaders={[
          { key: "tempCode", label: "Mã tạm" },
          { key: "sampleName", label: "Tên mẫu" },
          { key: "sampleType", label: "Loại mẫu" },
          { key: "quantity", label: "SL" },
          { key: "unit", label: "ĐVT" },
          { key: "conditionNote", label: "Điều kiện" },
        ]}
        onImport={async (rows) => {
          const form = document.getElementById("request-form") as HTMLFormElement | null;
          const st =
            (form?.elements.namedItem("sampleType") as HTMLInputElement | null)?.value ??
            initial?.sampleType ??
            "";
          const imported = rowsToSampleLineDrafts(rows, st);
          if (imported.length === 0) return { error: "Không có dòng hợp lệ" };
          setLines((prev) => [...prev, ...imported]);
          return { success: true, count: imported.length };
        }}
        onImported={() => setImportOpen(false)}
      />
    </>
  );
}
