"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PreparedStandardLevel } from "@prisma/client";
import { Download, Edit, Plus, Printer, Search, Trash2, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { PrintLabelButton } from "@/components/PrintLabelButton";
import { PrintLabelsDialog } from "@/components/PrintLabelsDialog";
import { SearchableSelect } from "@/components/SearchableSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createPreparedStandard,
  deletePreparedStandard,
  updatePreparedStandard,
} from "@/lib/actions/prepared-standards";
import { bulkImportPreparedStandards } from "@/lib/actions/prepared-import";
import {
  buildPreparedStandardExportRows,
  formatComponentDropdownLabel,
  getFixedParentSourceLevel,
  PARENT_LEVEL_REQUIRED_MESSAGE,
  PREPARED_STANDARD_FORM_FIELD_KEYS,
  PREPARED_STANDARD_LEVEL_FILTER_ALL,
  PREPARED_STANDARD_LEVEL_FILTER_OPTIONS,
  PREPARED_STANDARD_LEVEL_TABS,
  type PreparedStandardLevelFilter,
  usesMultiLevelSource,
  usesStandardCatalog,
  WORKING_SOURCE_LEVELS,
} from "@/lib/prepared-standards-fields";
import { PREPARED_STANDARD_STATUS_FILTERS } from "@/lib/prepared-standard-status";
import {
  POPUP_BLOCKED_MESSAGE,
  getPreparedStandardDefaultLabelCount,
  preparedStandardToLabelData,
  printPreparedLabelsBulk,
} from "@/lib/print-label";
import { exportToXlsx } from "@/lib/excel";
import {
  PREPARED_STANDARD_EXCEL_COLUMNS,
  PREPARED_STANDARD_IMPORT_COLUMN_MAP,
} from "@/lib/prepared-excel";
import { formatDate } from "@/lib/utils";
import { StockLotPicker, applyDefaultLotIfSingle } from "@/components/StockLotPicker";
import { LOT_SELECTION_REQUIRED_MESSAGE } from "@/lib/inventory-lot-policy";
import {
  emptyStockLotSelection,
  requiresLotSelection,
} from "@/lib/stock-lot-selection";
import type { PreparedStandardView, StockLotView } from "@/types";
import { PreparationDrawerTabContent } from "@/components/preparation/PreparationDrawerTabContent";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";
import { AmendmentReasonDialog } from "@/components/preparation/AmendmentReasonDialog";
import {
  PREPARATION_WORKFLOW_FILTERS,
  PREPARATION_WORKFLOW_STATUS_LABELS,
} from "@/lib/preparation-workflow-labels";
import type { StaffView } from "@/lib/services/staff";

type StandardCatalogItem = {
  id: string;
  code: string;
  name: string;
  manufacturer: string;
  productCode: string;
  lot: string;
  purity: string;
  unit: string;
  stockLots: StockLotView[];
  searchText: string;
};

type PreparedStandardCatalogItem = {
  id: string;
  code: string;
  name: string;
  level: PreparedStandardLevel;
  levelLabel: string;
  concentration: string;
  concentrationUnit: string;
  preparedDate: string;
  expiryDate: string;
  lot: string;
  unit: string;
  searchText: string;
};

type ChemicalCatalogItem = {
  id: string;
  code: string;
  name: string;
  casProductCode: string;
  lot: string;
  unit: string;
  quantity?: number;
  stockLots: StockLotView[];
  searchText: string;
};

type ComponentFormRow = {
  key: string;
  sourceType: "Standard" | "PreparedStandard";
  /** Cấp chuẩn nguồn — chỉ dùng khi form.level = WorkingPrepared. */
  sourceLevel: PreparedStandardLevel | "";
  standardId: string;
  sourcePreparedStandardId: string;
  standardCode: string;
  standardName: string;
  manufacturer: string;
  productCode: string;
  stockLotId: string;
  lotNumber: string;
  purity: string;
  concentration: string;
  concentrationUnit: string;
  levelLabel: string;
  preparedDate: string;
  expiryDate: string;
  quantityUsed: string;
  unit: string;
};

type SolventFormRow = {
  key: string;
  chemicalId: string;
  chemicalCode: string;
  chemicalName: string;
  casProductCode: string;
  stockLotId: string;
  lotNumber: string;
  quantityUsed: string;
  unit: string;
};

const initialForm = {
  code: "",
  name: "",
  concentration: "",
  concentrationUnit: "ppm",
  solventVolume: "",
  solventUnit: "mL",
  preparedDate: "",
  expiryDate: "",
  preparedBy: "",
  level: "RootPrepared" as PreparedStandardLevel,
  storageLocation: "",
  storageCondition: "",
  notes: "",
};

function emptyComponent(level: PreparedStandardLevel): ComponentFormRow {
  return {
    key: crypto.randomUUID(),
    sourceType: usesStandardCatalog(level) ? "Standard" : "PreparedStandard",
    sourceLevel: "",
    standardId: "",
    sourcePreparedStandardId: "",
    standardCode: "",
    standardName: "",
    manufacturer: "",
    productCode: "",
    stockLotId: "",
    lotNumber: "",
    purity: "",
    concentration: "",
    concentrationUnit: "",
    levelLabel: "",
    preparedDate: "",
    expiryDate: "",
    quantityUsed: "",
    unit: "",
  };
}

function emptySolvent(): SolventFormRow {
  return {
    key: crypto.randomUUID(),
    chemicalId: "",
    chemicalCode: "",
    chemicalName: "",
    casProductCode: "",
    stockLotId: "",
    lotNumber: "",
    quantityUsed: "",
    unit: "",
  };
}

const PREPARED_STANDARD_CODE_PATTERN = /^PSTD-/i;

function isPreparedStandardCode(value: string): boolean {
  return PREPARED_STANDARD_CODE_PATTERN.test(value.trim());
}

function resolvePreparedStandardSourceId(
  row: ComponentFormRow,
  catalog: PreparedStandardCatalogItem[],
): string | null {
  const raw = row.sourcePreparedStandardId.trim();
  if (!raw || isPreparedStandardCode(raw) || raw === row.key) return null;
  const match = catalog.find((p) => p.id === raw);
  return match?.id ?? raw;
}

function buildComponentSubmitRow(
  row: ComponentFormRow,
  fromCatalog: boolean,
  multiLevel: boolean,
  catalog: PreparedStandardCatalogItem[],
): Record<string, unknown> | null {
  if (fromCatalog) {
    const standardId = row.standardId.trim();
    if (!standardId || isPreparedStandardCode(standardId)) return null;
    return {
      sourceType: "Standard",
      standardId,
      stockLotId: row.stockLotId || null,
      lotNumber: row.lotNumber,
      quantityUsed: Number(row.quantityUsed),
      unit: row.unit,
    };
  }

  const sourcePreparedStandardId = resolvePreparedStandardSourceId(row, catalog);
  if (!sourcePreparedStandardId) return null;

  if (multiLevel) {
    if (!row.sourceLevel) return null;
    return {
      sourceType: "PreparedStandard",
      sourceLevel: row.sourceLevel,
      sourcePreparedStandardId,
      quantityUsed: Number(row.quantityUsed),
      unit: row.unit,
    };
  }

  return {
    sourceType: "PreparedStandard",
    sourcePreparedStandardId,
    quantityUsed: Number(row.quantityUsed),
    unit: row.unit,
  };
}

export function PreparedStandardsClient({
  items,
  standards,
  preparedStandards,
  levelCounts,
  chemicals,
  staff,
}: {
  items: PreparedStandardView[];
  standards: StandardCatalogItem[];
  preparedStandards: PreparedStandardCatalogItem[];
  levelCounts: Record<PreparedStandardLevel, number>;
  chemicals: ChemicalCatalogItem[];
  staff: StaffView[];
}) {
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<PreparedStandardLevelFilter>(
    PREPARED_STANDARD_LEVEL_FILTER_ALL,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof PREPARED_STANDARD_STATUS_FILTERS)[number]>("All");
  const [workflowFilter, setWorkflowFilter] = useState<(typeof PREPARATION_WORKFLOW_FILTERS)[number]>("All");
  const [drawerTab, setDrawerTab] = useState("Chi tiết");
  const [selected, setSelected] = useState<PreparedStandardView | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [components, setComponents] = useState<ComponentFormRow[]>([emptyComponent("RootPrepared")]);
  const [solvents, setSolvents] = useState<SolventFormRow[]>([emptySolvent()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreparedStandardView | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [amendmentOpen, setAmendmentOpen] = useState(false);
  const [pendingAmendmentReason, setPendingAmendmentReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const fromStandardCatalog = usesStandardCatalog(form.level);
  const multiLevelSource = usesMultiLevelSource(form.level);
  const fixedParentLevel = getFixedParentSourceLevel(form.level);
  const parentLevelMissing = multiLevelSource
    ? WORKING_SOURCE_LEVELS.every((l) => (levelCounts[l] ?? 0) === 0)
    : fixedParentLevel !== "Standard" &&
      fixedParentLevel !== null &&
      (levelCounts[fixedParentLevel] ?? 0) === 0;
  const parentLevelMessage = PARENT_LEVEL_REQUIRED_MESSAGE[form.level];

  const getPreparedSourceOptions = (sourceLevel: PreparedStandardLevel | "") => {
    if (!sourceLevel) return [];
    return preparedStandards
      .filter((p) => p.level === sourceLevel && p.id !== editingId)
      .map((p) => ({
        value: p.id,
        label: formatComponentDropdownLabel(
          p.code,
          p.name,
          p.concentration,
          p.concentrationUnit,
          p.lot,
        ),
        searchText: p.searchText,
      }));
  };

  const componentSourceOptions = useMemo(() => {
    if (fromStandardCatalog) {
      return standards.map((s) => ({
        value: s.id,
        label: formatComponentDropdownLabel(s.code, s.name, "", "", s.lot === "Nhiều lot" ? "nhiều lot" : s.lot),
        searchText: s.searchText,
      }));
    }
    if (multiLevelSource) return [];
    const sourceLevel = fixedParentLevel as PreparedStandardLevel;
    return preparedStandards
      .filter((p) => p.level === sourceLevel && p.id !== editingId)
      .map((p) => ({
        value: p.id,
        label: formatComponentDropdownLabel(
          p.code,
          p.name,
          p.concentration,
          p.concentrationUnit,
          p.lot,
        ),
        searchText: p.searchText,
      }));
  }, [
    fromStandardCatalog,
    multiLevelSource,
    standards,
    preparedStandards,
    fixedParentLevel,
    editingId,
  ]);

  const chemicalOptions = useMemo(
    () =>
      chemicals.map((c) => ({
        value: c.id,
        label: `${c.code} · ${c.name}`,
        searchText: c.searchText,
      })),
    [chemicals],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((item) => {
        const matchLevel = levelFilter === PREPARED_STANDARD_LEVEL_FILTER_ALL || item.level === levelFilter;
        const matchQuery =
          !q ||
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.concentration.toLowerCase().includes(q) ||
          item.componentsSummary.toLowerCase().includes(q) ||
          item.solventsSummary.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || item.status === statusFilter;
        const matchWorkflow =
          workflowFilter === "All" || item.workflowStatus === workflowFilter;
        return matchLevel && matchQuery && matchStatus && matchWorkflow;
      })
      .map((item, index) => ({ ...item, stt: index + 1 }));
  }, [items, query, statusFilter, levelFilter, workflowFilter]);

  const selectedRows = useMemo(
    () => items.filter((item) => selectedRowIds.has(item.id)),
    [items, selectedRowIds],
  );

  const bulkPrintItems = useMemo(
    () =>
      selectedRows.map((item) => ({
        data: preparedStandardToLabelData(item),
        defaultQuantity: getPreparedStandardDefaultLabelCount(item),
      })),
    [selectedRows],
  );

  const defaultBulkLabelTotal = useMemo(
    () => bulkPrintItems.reduce((sum, item) => sum + item.defaultQuantity, 0),
    [bulkPrintItems],
  );

  const handleBulkPrint = (options: { useDefaultQuantity: boolean; copiesPerSample: number }) => {
    const result = printPreparedLabelsBulk("prepared-standard", bulkPrintItems, options);
    if (!result.ok) {
      if (result.reason === "popup-blocked") {
        addToast(POPUP_BLOCKED_MESSAGE, "error");
      } else if (result.reason === "empty") {
        addToast("Không có tem nhãn để in", "error");
      } else {
        addToast("Không thể tạo cửa sổ in tem nhãn", "error");
      }
      return;
    }
    addToast("Đã mở cửa sổ in tem nhãn", "success");
  };

  const openCreate = () => {
    setSelected(null);
    setIsEditing(false);
    setEditingId(null);
    const defaultLevel =
      levelFilter === PREPARED_STANDARD_LEVEL_FILTER_ALL ? "RootPrepared" : levelFilter;
    setForm({ ...initialForm, level: defaultLevel });
    setComponents([emptyComponent(defaultLevel)]);
    setSolvents([emptySolvent()]);
    setIsFormOpen(true);
  };

  const openEdit = (item: PreparedStandardView) => {
    if (item.workflowStatus === "Prepared" || item.workflowStatus === "Checked") {
      addToast("Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước", "error");
      return;
    }
    setSelected(null);
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      concentration: item.concentration,
      concentrationUnit: item.concentrationUnit,
      solventVolume: String(item.solventVolume || ""),
      solventUnit: item.solventUnit,
      preparedDate: item.preparedDate,
      expiryDate: item.expiryDate,
      preparedBy: item.preparedBy,
      level: item.level as PreparedStandardLevel,
      storageLocation: item.storageLocation,
      storageCondition: item.storageCondition,
      notes: item.notes,
    });
    setComponents(
      item.components.length
        ? item.components.map((c) => ({
            key: crypto.randomUUID(),
            sourceType: c.sourceType,
            sourceLevel: (c.sourceLevel as PreparedStandardLevel) ?? "",
            standardId: c.standardId ?? "",
            sourcePreparedStandardId: c.sourcePreparedStandardId ?? "",
            standardCode: c.standardCode,
            standardName: c.standardName,
            manufacturer: c.manufacturer,
            productCode: c.productCode,
            lotNumber: c.lotNumber,
            stockLotId: c.stockLotId ?? "",
            purity: c.purity,
            concentration: c.concentration,
            concentrationUnit: c.concentrationUnit,
            levelLabel: c.levelLabel,
            preparedDate: c.preparedDate,
            expiryDate: c.expiryDate,
            quantityUsed: String(c.quantityUsed),
            unit: c.unit,
          }))
        : [emptyComponent(item.level as PreparedStandardLevel)],
    );
    setSolvents(
      item.solvents.length
        ? item.solvents.map((s) => ({
            key: s.id,
            chemicalId: s.chemicalId,
            chemicalCode: s.chemicalCode,
            chemicalName: s.chemicalName,
            casProductCode: s.casProductCode,
            lotNumber: s.lotNumber,
            stockLotId: s.stockLotId ?? "",
            quantityUsed: String(s.quantityUsed),
            unit: s.unit,
          }))
        : [emptySolvent()],
    );
    if (item.workflowStatus === "Approved") {
      setAmendmentOpen(true);
      return;
    }
    setIsFormOpen(true);
  };

  const selectComponentSourceLevel = (key: string, sourceLevel: PreparedStandardLevel | "") => {
    setComponents((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              sourceLevel,
              sourcePreparedStandardId: "",
              standardCode: "",
              standardName: "",
              manufacturer: "",
              productCode: "",
              lotNumber: "",
              stockLotId: "",
              purity: "",
              concentration: "",
              concentrationUnit: "",
              levelLabel: sourceLevel
                ? PREPARED_STANDARD_LEVEL_TABS.find((t) => t.value === sourceLevel)?.label ?? ""
                : "",
              preparedDate: "",
              expiryDate: "",
            }
          : row,
      ),
    );
  };

  const selectComponentSource = (key: string, sourceId: string) => {
    if (fromStandardCatalog) {
      const standard = standards.find((s) => s.id === sourceId);
      if (!standard) return;
      const lotPick = applyDefaultLotIfSingle(standard.stockLots, emptyStockLotSelection());
      setComponents((rows) =>
        rows.map((row) =>
          row.key === key
            ? {
                ...row,
                sourceType: "Standard" as const,
                standardId: standard.id,
                sourcePreparedStandardId: "",
                standardCode: standard.code,
                standardName: standard.name,
                manufacturer: standard.manufacturer,
                productCode: standard.productCode,
                stockLotId: lotPick.stockLotId,
                lotNumber: lotPick.lotNumber || standard.lot,
                purity: standard.purity,
                concentration: "",
                concentrationUnit: "",
                levelLabel: "",
                preparedDate: "",
                expiryDate: "",
                unit: row.unit || standard.unit,
              }
            : row,
        ),
      );
      return;
    }

    const source = preparedStandards.find((p) => p.id === sourceId);
    if (!source) return;
    setComponents((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              sourceType: "PreparedStandard" as const,
              standardId: "",
              sourcePreparedStandardId: source.id,
              standardCode: source.code,
              standardName: source.name,
              manufacturer: "",
              productCode: "",
              lotNumber: source.lot,
              purity: "",
              concentration: source.concentration,
              concentrationUnit: source.concentrationUnit,
              levelLabel: source.levelLabel,
              preparedDate: source.preparedDate,
              expiryDate: source.expiryDate,
              unit: row.unit || source.unit,
            }
          : row,
      ),
    );
  };

  const handleLevelChange = (level: PreparedStandardLevel) => {
    setForm((p) => ({ ...p, level }));
    setComponents([emptyComponent(level)]);
  };

  const selectChemical = (key: string, chemicalId: string) => {
    const chemical = chemicals.find((c) => c.id === chemicalId);
    if (!chemical) return;
    const lotPick = applyDefaultLotIfSingle(chemical.stockLots, emptyStockLotSelection());
    setSolvents((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              chemicalId,
              chemicalCode: chemical.code,
              chemicalName: chemical.name,
              casProductCode: chemical.casProductCode,
              stockLotId: lotPick.stockLotId,
              lotNumber: lotPick.lotNumber || chemical.lot,
              unit: row.unit || chemical.unit,
            }
          : row,
      ),
    );
  };

  const handleExport = () => {
    const exportItems = filtered.map(({ stt: _stt, ...item }) => item);
    const suffix =
      levelFilter === PREPARED_STANDARD_LEVEL_FILTER_ALL ? "all" : levelFilter.toLowerCase();
    const rows = buildPreparedStandardExportRows(exportItems);
    exportToXlsx(`chuan-pha-che-${suffix}`, rows, PREPARED_STANDARD_EXCEL_COLUMNS);
    addToast("Đã export Excel", "success");
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("rows", JSON.stringify(rows));
    const result = await bulkImportPreparedStandards(fd);
    return result;
  };

  const handleSubmit = () => {
    if (parentLevelMissing && parentLevelMessage) {
      addToast(parentLevelMessage, "error");
      return;
    }
    if (!form.code.trim() || !form.name.trim()) {
      addToast("Mã và tên chuẩn pha chế là bắt buộc", "error");
      return;
    }
    if (!form.concentration.trim()) {
      addToast("Nồng độ là bắt buộc", "error");
      return;
    }
    if (!form.preparedDate || !form.expiryDate) {
      addToast("Ngày pha chế và ngày hết hạn là bắt buộc", "error");
      return;
    }
    if (new Date(form.expiryDate) <= new Date(form.preparedDate)) {
      addToast("Ngày hết hạn phải sau ngày pha chế", "error");
      return;
    }

    const validComponents = components.filter((row) => {
      if (fromStandardCatalog) return row.standardId && row.quantityUsed.trim();
      if (multiLevelSource) {
        return row.sourceLevel && row.sourcePreparedStandardId && row.quantityUsed.trim();
      }
      return row.sourcePreparedStandardId && row.quantityUsed.trim();
    });
    const validSolvents = solvents.filter((row) => row.chemicalId && row.quantityUsed.trim());
    if (!validComponents.length) {
      addToast(
        multiLevelSource
          ? "Cần ít nhất một dòng chuẩn gốc sử dụng (chọn cấp và chuẩn nguồn)"
          : "Cần ít nhất một chuẩn gốc sử dụng",
        "error",
      );
      return;
    }
    if (!validSolvents.length) {
      addToast("Cần ít nhất một dung môi sử dụng", "error");
      return;
    }

    for (const row of validComponents) {
      if (!fromStandardCatalog) {
        if (isPreparedStandardCode(row.sourcePreparedStandardId)) {
          addToast(
            "Mã chuẩn pha chế nguồn không hợp lệ — vui lòng chọn lại từ dropdown (phải dùng ID, không phải mã).",
            "error",
          );
          return;
        }
        if (row.sourcePreparedStandardId === row.key) {
          addToast("ID nguồn không hợp lệ — vui lòng chọn lại chuẩn pha chế nguồn từ dropdown.", "error");
          return;
        }
        const inCatalog = preparedStandards.some((p) => p.id === row.sourcePreparedStandardId.trim());
        if (!inCatalog && !isEditing) {
          addToast(
            "Chuẩn pha chế nguồn không còn trong danh mục — vui lòng tải lại trang và chọn lại.",
            "error",
          );
          return;
        }
      }
      const qty = Number(row.quantityUsed);
      if (!Number.isFinite(qty) || qty <= 0) {
        addToast("Lượng chuẩn gốc sử dụng không hợp lệ", "error");
        return;
      }
      if (fromStandardCatalog && row.standardId) {
        const standard = standards.find((s) => s.id === row.standardId);
        if (standard && requiresLotSelection(standard.stockLots) && !row.stockLotId) {
          addToast(`${LOT_SELECTION_REQUIRED_MESSAGE} (${standard.name})`, "error");
          return;
        }
      }
    }
    for (const row of validSolvents) {
      const qty = Number(row.quantityUsed);
      if (!Number.isFinite(qty) || qty <= 0) {
        addToast("Lượng dung môi sử dụng không hợp lệ", "error");
        return;
      }
      const chemical = chemicals.find((c) => c.id === row.chemicalId);
      if (chemical && requiresLotSelection(chemical.stockLots) && !row.stockLotId) {
        addToast(`${LOT_SELECTION_REQUIRED_MESSAGE} (${chemical.name})`, "error");
        return;
      }
    }

    const componentPayload = validComponents
      .map((row) => buildComponentSubmitRow(row, fromStandardCatalog, multiLevelSource, preparedStandards))
      .filter((row): row is Record<string, unknown> => row !== null);

    if (componentPayload.length !== validComponents.length) {
      addToast("Thông tin chuẩn gốc sử dụng không hợp lệ — vui lòng chọn lại nguồn từ dropdown.", "error");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[prepared-standards] submit components payload:", componentPayload);
    }

    const fd = new FormData();
    fd.set("user", role);
    PREPARED_STANDARD_FORM_FIELD_KEYS.forEach((key) => fd.set(key, String(form[key] ?? "")));
    fd.set("components", JSON.stringify(componentPayload));
    fd.set(
      "solvents",
      JSON.stringify(
        validSolvents.map((row) => ({
          chemicalId: row.chemicalId,
          stockLotId: row.stockLotId || null,
          lotNumber: row.lotNumber,
          quantityUsed: Number(row.quantityUsed),
          unit: row.unit,
        })),
      ),
    );
    if (isEditing && editingId) fd.set("id", editingId);
    if (pendingAmendmentReason) fd.set("amendmentReason", pendingAmendmentReason);

    startTransition(async () => {
      const result = isEditing ? await updatePreparedStandard(fd) : await createPreparedStandard(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        isEditing ? "Đã cập nhật chuẩn pha chế" : "Đã tạo nháp — chuyển sang Đã pha chế để trừ tồn",
        "success",
      );
      setIsFormOpen(false);
      setPendingAmendmentReason("");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const fd = new FormData();
    fd.set("user", role);
    fd.set("id", target.id);
    startTransition(async () => {
      const result = await deletePreparedStandard(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa chuẩn pha chế", "success");
      if (selected?.id === target.id) setSelected(null);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Pha chế</p>
            <h1 className="text-2xl font-semibold text-slate-900">Chuẩn pha chế</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Thêm chuẩn pha chế
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã, tên, nồng độ..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div className="w-full sm:w-64">
              <label className="mb-1 block text-xs text-slate-500">Cấp chuẩn</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as PreparedStandardLevelFilter)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              >
                {PREPARED_STANDARD_LEVEL_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PREPARATION_WORKFLOW_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setWorkflowFilter(s)}
                className={`rounded-xl px-3 py-2 text-sm ${workflowFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {s === "All"
                  ? "Tất cả quy trình"
                  : PREPARATION_WORKFLOW_STATUS_LABELS[s as keyof typeof PREPARATION_WORKFLOW_STATUS_LABELS]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PREPARED_STANDARD_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-2 text-sm ${
                  statusFilter === s ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {s === "All" ? "Tất cả trạng thái" : s}
              </button>
            ))}
          </div>
        </div>

        {selectedRowIds.size > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-800">Đã chọn: {selectedRowIds.size} mục</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrintDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              >
                <Printer className="h-4 w-4" />
                In tem nhãn
              </button>
              <button
                type="button"
                onClick={() => setSelectedRowIds(new Set())}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        ) : null}

        <DataTable
          columns={[
            { key: "stt", header: "STT" },
            { key: "levelLabel", header: "Cấp chuẩn" },
            { key: "code", header: "Mã chuẩn pha chế" },
            { key: "name", header: "Tên chuẩn pha chế" },
            {
              key: "concentration",
              header: "Nồng độ",
              render: (_v, row) => `${row.concentration} ${row.concentrationUnit}`.trim(),
            },
            {
              key: "solventVolume",
              header: "Dung môi định mức",
              render: (_v, row) =>
                row.solventVolume ? `${row.solventVolume} ${row.solventUnit}`.trim() : "-",
            },
            { key: "preparedDate", header: "Ngày pha", render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "expiryDate", header: "Hạn dùng", render: (v) => (v ? formatDate(String(v)) : "-") },
            { key: "preparedBy", header: "Người pha" },
            {
              key: "workflowStatus",
              header: "Quy trình",
              render: (_v, row) => <WorkflowStatusBadge status={row.workflowStatus} />,
            },
            {
              key: "componentsSummary",
              header: "Chuẩn gốc sử dụng",
              render: (_v, row) => (
                <div className="space-y-1 text-xs leading-5">
                  {row.components.map((c) => (
                    <p key={c.id}>{c.displayLine}</p>
                  ))}
                </div>
              ),
            },
            {
              key: "solventsSummary",
              header: "Dung môi sử dụng",
              render: (_v, row) => (
                <div className="space-y-1 text-xs leading-5">
                  {row.solvents.map((s) => (
                    <p key={s.id}>{s.displayLine}</p>
                  ))}
                </div>
              ),
            },
            { key: "status", header: "Trạng thái", render: (v) => <StatusBadge status={String(v)} /> },
          ]}
          rows={filtered}
          onRowClick={(row) => {
            setSelected(row);
            setDrawerTab("Chi tiết");
          }}
          selection={{
            getRowId: (row) => row.id,
            selectedIds: selectedRowIds,
            onSelectedIdsChange: setSelectedRowIds,
          }}
          rowActionsHeader="Hành động"
          rowActions={
            canManage
              ? (row) => (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                )
              : undefined
          }
        />

        <DetailDrawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.name ?? ""}
          subtitle={selected?.code}
          tabs={["Chi tiết", "Lịch sử", "Truy xuất"]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          layout="stacked"
          maxWidth="5xl"
          actions={
            selected ? (
              <>
                <PrintLabelButton
                  template="prepared-standard"
                  data={preparedStandardToLabelData(selected)}
                />
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Sửa
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                ) : null}
              </>
            ) : undefined
          }
          tabContent={
            selected ? (
              <PreparationDrawerTabContent
                tab={drawerTab}
                preparationType="STANDARD"
                record={{
                  id: selected.id,
                  workflowStatus: selected.workflowStatus,
                  version: selected.version,
                }}
                staff={staff}
                canEdit={canEdit}
                role={role}
                onRefresh={() => router.refresh()}
                onError={(msg) => addToast(msg, "error")}
                onSuccess={(msg) => addToast(msg, "success")}
                detail={
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Mã chuẩn pha chế</p>
                    <p className="font-medium">{selected.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tên chuẩn pha chế</p>
                    <p className="font-medium">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cấp chuẩn</p>
                    <p className="font-medium">{selected.levelLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nồng độ</p>
                    <p className="font-medium">
                      {selected.concentration} {selected.concentrationUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Dung môi định mức</p>
                    <p className="font-medium">
                      {selected.solventVolume} {selected.solventUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Người pha</p>
                    <p className="font-medium">{selected.preparedBy || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ngày pha chế</p>
                    <p className="font-medium">{formatDate(selected.preparedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ngày hết hạn</p>
                    <p className="font-medium">{formatDate(selected.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vị trí lưu</p>
                    <p className="font-medium">{selected.storageLocation || "-"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Điều kiện bảo quản</p>
                    <p className="font-medium whitespace-pre-wrap">{selected.storageCondition || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Ghi chú</p>
                    <p className="font-medium">{selected.notes || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-slate-500">Chuẩn gốc sử dụng</p>
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    {selected.components.map((c) => (
                      <div
                        key={c.id}
                        className="grid gap-2 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0 sm:grid-cols-6"
                      >
                        <p>{c.standardCode}</p>
                        <p>{c.standardName}</p>
                        {c.sourceType === "Standard" ? (
                          <>
                            <p className="text-slate-600">{c.manufacturer || "/"}</p>
                            <p className="text-slate-600">{c.productCode || "/"}</p>
                            <p className="text-slate-600">{c.lotNumber || "/"}</p>
                            <p className="text-slate-600">{c.purity || "/"}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-600">
                              {[c.concentration, c.concentrationUnit].filter(Boolean).join(" ") || "/"}
                            </p>
                            <p className="text-slate-600">{c.levelLabel || "/"}</p>
                            <p className="text-slate-600">
                              {c.preparedDate ? formatDate(c.preparedDate) : "/"}
                            </p>
                            <p className="text-slate-600">
                              {c.expiryDate ? formatDate(c.expiryDate) : "/"}
                            </p>
                          </>
                        )}
                        <p className="sm:col-span-6">
                          Lượng: {c.quantityUsed} {c.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-slate-500">Dung môi sử dụng</p>
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    {selected.solvents.map((s) => (
                      <div
                        key={s.id}
                        className="grid gap-2 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0 sm:grid-cols-5"
                      >
                        <p>{s.chemicalCode}</p>
                        <p>{s.chemicalName}</p>
                        <p className="text-slate-600">{s.casProductCode || "/"}</p>
                        <p className="text-slate-600">{s.lotNumber || "/"}</p>
                        <p>
                          {s.quantityUsed} {s.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                }
              />
            ) : null
          }
        />

        <ModalShell
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isEditing ? "Sửa chuẩn pha chế" : "Thêm chuẩn pha chế"}
            </h2>
            <button type="button" onClick={() => setIsFormOpen(false)}>
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Mã chuẩn pha chế *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Tên chuẩn pha chế *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Cấp chuẩn *</label>
              <select
                value={form.level}
                onChange={(e) => handleLevelChange(e.target.value as PreparedStandardLevel)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                {PREPARED_STANDARD_LEVEL_TABS.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Nồng độ *</label>
              <input
                value={form.concentration}
                onChange={(e) => setForm((p) => ({ ...p, concentration: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Đơn vị nồng độ</label>
              <input
                value={form.concentrationUnit}
                onChange={(e) => setForm((p) => ({ ...p, concentrationUnit: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Thể tích/Khối lượng dung môi định mức</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.solventVolume}
                onChange={(e) => setForm((p) => ({ ...p, solventVolume: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Đơn vị dung môi</label>
              <input
                value={form.solventUnit}
                onChange={(e) => setForm((p) => ({ ...p, solventUnit: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Ngày pha chế *</label>
              <input
                type="date"
                value={form.preparedDate}
                onChange={(e) => setForm((p) => ({ ...p, preparedDate: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Ngày hết hạn pha chế *</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Người pha</label>
              <input
                value={form.preparedBy}
                onChange={(e) => setForm((p) => ({ ...p, preparedBy: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Vị trí lưu</label>
              <input
                value={form.storageLocation}
                onChange={(e) => setForm((p) => ({ ...p, storageLocation: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-slate-600">Điều kiện bảo quản</label>
              <input
                value={form.storageCondition}
                onChange={(e) => setForm((p) => ({ ...p, storageCondition: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-slate-600">Ghi chú</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Chuẩn gốc sử dụng</h3>
                <p className="text-xs text-slate-500">
                  {fromStandardCatalog
                    ? "Chọn từ danh mục Chất chuẩn gốc — không giới hạn số dòng."
                    : multiLevelSource
                      ? "Chọn cấp chuẩn nguồn và chuẩn pha chế tương ứng — có thể trộn nhiều cấp trong cùng một chuẩn làm việc."
                      : `Chọn từ ${PREPARED_STANDARD_LEVEL_TABS.find((t) => t.value === fixedParentLevel)?.label ?? "cấp liền trước"} — không giới hạn số dòng.`}
                </p>
                {parentLevelMissing && parentLevelMessage ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">{parentLevelMessage}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setComponents((rows) => [...rows, emptyComponent(form.level)])}
                disabled={parentLevelMissing}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm chuẩn gốc sử dụng
              </button>
            </div>
            <div className="space-y-3">
              {components.map((row, index) => (
                <div key={row.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-medium text-slate-500">STT {index + 1}</div>
                  <div className="grid gap-3 sm:grid-cols-8">
                    {multiLevelSource ? (
                      <>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Cấp chuẩn nguồn *</label>
                          <select
                            value={row.sourceLevel}
                            onChange={(e) =>
                              selectComponentSourceLevel(
                                row.key,
                                e.target.value as PreparedStandardLevel | "",
                              )
                            }
                            disabled={parentLevelMissing}
                            className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm disabled:opacity-50"
                          >
                            <option value="">Chọn cấp</option>
                            {WORKING_SOURCE_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {PREPARED_STANDARD_LEVEL_TABS.find((t) => t.value === level)?.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-slate-600">Chuẩn pha chế nguồn *</label>
                          <SearchableSelect
                            value={row.sourcePreparedStandardId}
                            onChange={(v) => selectComponentSource(row.key, v)}
                            options={getPreparedSourceOptions(row.sourceLevel)}
                            placeholder={row.sourceLevel ? "Chọn chuẩn nguồn" : "Chọn cấp trước"}
                            disabled={parentLevelMissing || !row.sourceLevel}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Mã chuẩn</label>
                          <input readOnly value={row.standardCode || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Tên chuẩn</label>
                          <input readOnly value={row.standardName || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Nồng độ</label>
                          <input
                            readOnly
                            value={[row.concentration, row.concentrationUnit].filter(Boolean).join(" ") || "/"}
                            className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Lot/Batch</label>
                          <input readOnly value={row.lotNumber || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-slate-600">
                            {fromStandardCatalog ? "Chất chuẩn gốc" : "Chuẩn pha chế nguồn"}
                          </label>
                          <SearchableSelect
                            value={fromStandardCatalog ? row.standardId : row.sourcePreparedStandardId}
                            onChange={(v) => selectComponentSource(row.key, v)}
                            options={componentSourceOptions}
                            placeholder="Chọn chuẩn gốc"
                            disabled={parentLevelMissing}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Mã chuẩn</label>
                          <input readOnly value={row.standardCode || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Tên chuẩn</label>
                          <input readOnly value={row.standardName || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                        </div>
                        {fromStandardCatalog ? (
                          <>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Hãng SX</label>
                              <input readOnly value={row.manufacturer || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Product code</label>
                              <input readOnly value={row.productCode || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Lot</label>
                              <StockLotPicker
                                stockLots={
                                  standards.find((s) => s.id === row.standardId)?.stockLots ?? []
                                }
                                value={{ stockLotId: row.stockLotId, lotNumber: row.lotNumber }}
                                onChange={(lot) =>
                                  setComponents((rows) =>
                                    rows.map((r) =>
                                      r.key === row.key
                                        ? { ...r, stockLotId: lot.stockLotId, lotNumber: lot.lotNumber }
                                        : r,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Purity</label>
                              <input readOnly value={row.purity || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Nồng độ</label>
                              <input
                                readOnly
                                value={[row.concentration, row.concentrationUnit].filter(Boolean).join(" ") || "/"}
                                className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Cấp chuẩn</label>
                              <input readOnly value={row.levelLabel || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Ngày pha</label>
                              <input readOnly value={row.preparedDate ? formatDate(row.preparedDate) : "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-slate-600">Hạn dùng</label>
                              <input readOnly value={row.expiryDate ? formatDate(row.expiryDate) : "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:w-fit sm:max-w-md sm:grid-cols-[minmax(9rem,1fr)_4rem_auto] sm:items-end">
                      <div className="min-w-0">
                        <label className="mb-1 block text-xs text-slate-600">Lượng sử dụng</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.quantityUsed}
                          onChange={(e) =>
                            setComponents((rows) =>
                              rows.map((r) =>
                                r.key === row.key ? { ...r, quantityUsed: e.target.value } : r,
                              ),
                            )
                          }
                          className="h-10 w-full min-w-[9rem] rounded-xl border border-slate-200 px-3 text-sm tabular-nums"
                        />
                      </div>
                      <div className="w-full sm:w-16 sm:shrink-0">
                        <label className="mb-1 block text-xs text-slate-600">ĐVT</label>
                        <input
                          value={row.unit}
                          onChange={(e) =>
                            setComponents((rows) =>
                              rows.map((r) => (r.key === row.key ? { ...r, unit: e.target.value } : r)),
                            )
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm"
                        />
                      </div>
                      {components.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setComponents((rows) => rows.filter((r) => r.key !== row.key))}
                          className="mb-0.5 justify-self-start rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 sm:justify-self-end"
                          aria-label="Xóa dòng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dung môi sử dụng</h3>
                <p className="text-xs text-slate-500">Chọn từ danh mục Hóa chất gốc — không giới hạn số dòng.</p>
              </div>
              <button
                type="button"
                onClick={() => setSolvents((rows) => [...rows, emptySolvent()])}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm dung môi
              </button>
            </div>
            <div className="space-y-3">
              {solvents.map((row, index) => (
                <div key={row.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-medium text-slate-500">STT {index + 1}</div>
                  <div className="grid gap-3 sm:grid-cols-7">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-slate-600">Hóa chất gốc</label>
                      <SearchableSelect
                        value={row.chemicalId}
                        onChange={(v) => selectChemical(row.key, v)}
                        options={chemicalOptions}
                        placeholder="Chọn dung môi"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Mã hóa chất</label>
                      <input readOnly value={row.chemicalCode || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">CAS/Product</label>
                      <input readOnly value={row.casProductCode || "/"} className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Lot</label>
                      <StockLotPicker
                        stockLots={chemicals.find((c) => c.id === row.chemicalId)?.stockLots ?? []}
                        value={{ stockLotId: row.stockLotId, lotNumber: row.lotNumber }}
                        onChange={(lot) =>
                          setSolvents((rows) =>
                            rows.map((r) =>
                              r.key === row.key
                                ? { ...r, stockLotId: lot.stockLotId, lotNumber: lot.lotNumber }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:w-fit sm:max-w-md sm:grid-cols-[minmax(9rem,1fr)_4rem_auto] sm:items-end">
                      <div className="min-w-0">
                        <label className="mb-1 block text-xs text-slate-600">Lượng sử dụng</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.quantityUsed}
                          onChange={(e) =>
                            setSolvents((rows) =>
                              rows.map((r) =>
                                r.key === row.key ? { ...r, quantityUsed: e.target.value } : r,
                              ),
                            )
                          }
                          className="h-10 w-full min-w-[9rem] rounded-xl border border-slate-200 px-3 text-sm tabular-nums"
                        />
                      </div>
                      <div className="w-full sm:w-16 sm:shrink-0">
                        <label className="mb-1 block text-xs text-slate-600">ĐVT</label>
                        <input
                          value={row.unit}
                          onChange={(e) =>
                            setSolvents((rows) =>
                              rows.map((r) => (r.key === row.key ? { ...r, unit: e.target.value } : r)),
                            )
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 px-2 text-sm"
                        />
                      </div>
                      {solvents.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setSolvents((rows) => rows.filter((r) => r.key !== row.key))}
                          className="mb-0.5 justify-self-start rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 sm:justify-self-end"
                          aria-label="Xóa dòng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : isEditing ? "Cập nhật" : "Lưu"}
            </button>
          </div>
        </ModalShell>

        <PrintLabelsDialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          selectedCount={selectedRowIds.size}
          defaultLabelTotal={defaultBulkLabelTotal}
          onConfirm={handleBulkPrint}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Xóa chuẩn pha chế"
          message={`Xác nhận xóa mềm "${deleteTarget?.name}"? Tồn kho sẽ được hoàn lại nếu đã trừ.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <AmendmentReasonDialog
          open={amendmentOpen}
          onCancel={() => setAmendmentOpen(false)}
          onConfirm={(reason) => {
            setPendingAmendmentReason(reason);
            setAmendmentOpen(false);
            setIsFormOpen(true);
          }}
        />

        <ExcelImportDialog
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            void router.refresh();
          }}
          title="Import chuẩn pha chế"
          columnMap={PREPARED_STANDARD_IMPORT_COLUMN_MAP}
          onImport={handleImport}
        />
      </div>
    </AppShell>
  );
}
