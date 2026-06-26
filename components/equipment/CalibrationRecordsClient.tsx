"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { DetailDrawer } from "@/components/DetailDrawer";
import { ModalShell } from "@/components/ModalShell";
import { EquipmentFileUpload } from "@/components/equipment/EquipmentFileUpload";
import { FilterChipBar } from "@/components/FilterChipBar";
import { EquipmentModuleShell } from "@/components/equipment/EquipmentModuleShell";
import { EquipmentSelect, type EquipmentOption } from "@/components/equipment/EquipmentSelect";
import { USER_DISPLAY_NAME, useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import {
  createCalibrationRecord,
  deleteCalibrationRecord,
  updateCalibrationRecord,
} from "@/lib/actions/equipment-calibration";
import {
  applyRecordEvaluationMeta,
  EMPTY_CALIBRATION_RESULT_ROW,
  normalizeCalibrationResultRows,
  resolveRecordEvaluationDate,
  resolveRecordEvaluatedBy,
  type CalibrationResultRow,
} from "@/lib/calibration-results";
import { CALIBRATION_RESULT_LABELS } from "@/lib/equipment-fields";
import { CALIBRATION_EVAL, EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE } from "@/lib/equipment-labels";
import { exportToXlsx } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import type { CalibrationRecordView } from "@/types";

type EquipmentCalibrationGroup = {
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  latest: CalibrationRecordView;
  records: CalibrationRecordView[];
};

const exportColumns = [
  { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
  { key: "calibrationDate", header: EQUIPMENT_COLUMN.calibrationDate },
  { key: "certificateNo", header: EQUIPMENT_COLUMN.certificateNo },
  { key: "resultLabel", header: EQUIPMENT_COLUMN.result },
  { key: "calibrationResultsLabel", header: EQUIPMENT_COLUMN.calibrationResults },
  { key: "evaluationSummary", header: EQUIPMENT_COLUMN.evaluationSummary },
  { key: "vendor", header: EQUIPMENT_COLUMN.calibrationVendor },
];

const initialForm = {
  equipmentId: "",
  calibrationDate: "",
  certificateNo: "",
  vendor: "",
  notes: "",
  evaluationDate: "",
  evaluatedBy: "",
  resultRows: [{ ...EMPTY_CALIBRATION_RESULT_ROW }],
};

function updateResultRow(
  rows: CalibrationResultRow[],
  index: number,
  patch: Partial<CalibrationResultRow>,
): CalibrationResultRow[] {
  return rows.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function buildGroups(items: CalibrationRecordView[]): EquipmentCalibrationGroup[] {
  const map = new Map<string, CalibrationRecordView[]>();
  for (const item of items) {
    const list = map.get(item.equipmentId) ?? [];
    list.push(item);
    map.set(item.equipmentId, list);
  }
  const groups: EquipmentCalibrationGroup[] = [];
  for (const records of map.values()) {
    records.sort((a, b) => b.calibrationDate.localeCompare(a.calibrationDate));
    const latest = records[0];
    groups.push({
      equipmentId: latest.equipmentId,
      equipmentCode: latest.equipmentCode,
      equipmentName: latest.equipmentName,
      latest,
      records,
    });
  }
  return groups.sort((a, b) => a.equipmentCode.localeCompare(b.equipmentCode));
}

export function CalibrationRecordsClient({
  items,
  equipmentOptions,
}: {
  items: CalibrationRecordView[];
  equipmentOptions: EquipmentOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"All" | "Pass" | "Fail">("All");
  const [selectedGroup, setSelectedGroup] = useState<EquipmentCalibrationGroup | null>(null);
  const [activeRecord, setActiveRecord] = useState<CalibrationRecordView | null>(null);
  const [form, setForm] = useState(initialForm);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalibrationRecordView | null>(null);
  const [pending, startTransition] = useTransition();
  const { canManage, canEdit, role } = useRole();
  const { addToast } = useToast();

  const editingRecord = editingId ? items.find((item) => item.id === editingId) : null;

  const grouped = useMemo(() => buildGroups(items), [items]);

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase();
    return grouped.filter((group) => {
      const matchQuery =
        !q ||
        group.equipmentCode.toLowerCase().includes(q) ||
        group.equipmentName.toLowerCase().includes(q) ||
        group.records.some(
          (record) =>
            record.certificateNo.toLowerCase().includes(q) ||
            record.vendor.toLowerCase().includes(q),
        );
      const matchResult = resultFilter === "All" || group.latest.result === resultFilter;
      return matchQuery && matchResult;
    });
  }, [grouped, query, resultFilter]);

  const tableRows = useMemo(
    () =>
      filteredGroups.map((group) => ({
        id: group.equipmentId,
        equipmentCode: group.equipmentCode,
        equipmentName: group.equipmentName,
        calibrationDate: group.latest.calibrationDate,
        certificateNo: group.latest.certificateNo,
        resultLabel: group.latest.resultLabel,
        vendor: group.latest.vendor,
        calibrationResultsLabel: group.latest.calibrationResultsLabel,
        recordCount: group.records.length,
      })),
    [filteredGroups],
  );

  const openGroup = (group: EquipmentCalibrationGroup) => {
    setSelectedGroup(group);
    setActiveRecord(group.latest);
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(initialForm);
    setCertFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: CalibrationRecordView) => {
    setIsEditing(true);
    setEditingId(item.id);
    setForm({
      equipmentId: item.equipmentId,
      calibrationDate: item.calibrationDate,
      certificateNo: item.certificateNo,
      vendor: item.vendor,
      notes: item.notes,
      evaluationDate: resolveRecordEvaluationDate(item.calibrationResults),
      evaluatedBy: resolveRecordEvaluatedBy(item.calibrationResults),
      resultRows: normalizeCalibrationResultRows(item.calibrationResults),
    });
    setCertFile(null);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.equipmentId || !form.calibrationDate) {
      addToast("Thiết bị và ngày hiệu chuẩn là bắt buộc", "error");
      return;
    }
    const measurementRows = form.resultRows.filter(
      (row) => row.result.trim() || row.error.trim(),
    );
    const rowsToSave = applyRecordEvaluationMeta(measurementRows, {
      evaluationDate: form.evaluationDate,
      evaluatedBy: form.evaluatedBy,
    });
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("equipmentId", form.equipmentId);
    fd.set("calibrationDate", form.calibrationDate);
    fd.set("certificateNo", form.certificateNo);
    fd.set("vendor", form.vendor);
    fd.set("notes", form.notes);
    fd.set("calibrationResults", JSON.stringify(rowsToSave));
    if (certFile) fd.set("certificate", certFile);
    if (isEditing && editingId) fd.set("id", editingId);
    startTransition(async () => {
      const result = isEditing ? await updateCalibrationRecord(fd) : await createCalibrationRecord(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        isEditing ? "Đã cập nhật hồ sơ hiệu chuẩn" : "Đã thêm hồ sơ hiệu chuẩn",
        "success",
      );
      setIsFormOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("user", USER_DISPLAY_NAME);
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      const result = await deleteCalibrationRecord(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa hồ sơ hiệu chuẩn", "success");
      if (activeRecord?.id === deleteTarget.id) {
        setActiveRecord(null);
        setSelectedGroup(null);
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleExport = () => {
    exportToXlsx(
      "ho-so-hieu-chuan",
      filteredGroups.map((group) => ({ ...group.latest })),
      exportColumns,
    );
    addToast("Đã export Excel", "success");
  };

  const recordEvaluationDate = activeRecord
    ? resolveRecordEvaluationDate(activeRecord.calibrationResults)
    : "";
  const recordEvaluatedBy = activeRecord
    ? resolveRecordEvaluatedBy(activeRecord.calibrationResults)
    : "";

  return (
    <>
      <EquipmentModuleShell
        title="Hồ sơ hiệu chuẩn"
        subtitle={EQUIPMENT_SUBTITLE}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Tìm theo mã thiết bị, số chứng nhận..."
        onExport={handleExport}
        onCreate={openCreate}
        createLabel="Thêm hồ sơ hiệu chuẩn"
        canEdit={canEdit}
        filters={
          <FilterChipBar
            options={(["All", "Pass", "Fail"] as const).map((s) => ({
              value: s,
              label: s === "All" ? "Tất cả" : CALIBRATION_RESULT_LABELS[s],
            }))}
            value={resultFilter}
            onChange={setResultFilter}
          />
        }
      >
        <DataTable
          columns={[
            { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
            { key: "equipmentName", header: EQUIPMENT_COLUMN.equipmentName },
            {
              key: "calibrationDate",
              header: EQUIPMENT_COLUMN.calibrationDate,
              render: (v) => formatDate(String(v)),
            },
            { key: "certificateNo", header: EQUIPMENT_COLUMN.certificateNo },
            { key: "resultLabel", header: EQUIPMENT_COLUMN.result },
            { key: "vendor", header: EQUIPMENT_COLUMN.calibrationVendor },
            {
              key: "calibrationResultsLabel",
              header: EQUIPMENT_COLUMN.calibrationResults,
              render: (v) => String(v || "-"),
            },
          ]}
          rows={tableRows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => {
            const group = filteredGroups.find((g) => g.equipmentId === row.id);
            if (group) openGroup(group);
          }}
        />
      </EquipmentModuleShell>

      <DetailDrawer
        open={!!selectedGroup}
        onClose={() => {
          setSelectedGroup(null);
          setActiveRecord(null);
        }}
        title={selectedGroup ? `${selectedGroup.equipmentCode} — ${selectedGroup.equipmentName}` : "Hồ sơ hiệu chuẩn"}
        subtitle={
          selectedGroup
            ? `${selectedGroup.records.length} hồ sơ hiệu chuẩn`
            : undefined
        }
        tabs={["Chi tiết"]}
        activeTab="Chi tiết"
        onTabChange={() => undefined}
        actions={
          activeRecord && canEdit ? (
            <button
              type="button"
              onClick={() => openEdit(activeRecord)}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Sửa
            </button>
          ) : undefined
        }
        tabContent={
          selectedGroup ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lịch sử hồ sơ hiệu chuẩn
                </p>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2">{EQUIPMENT_COLUMN.calibrationDate}</th>
                        <th className="px-3 py-2">{EQUIPMENT_COLUMN.certificateNo}</th>
                        <th className="px-3 py-2">{EQUIPMENT_COLUMN.result}</th>
                        <th className="px-3 py-2">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.records.map((record) => (
                        <tr
                          key={record.id}
                          className={`border-t ${activeRecord?.id === record.id ? "bg-cyan-50" : ""}`}
                        >
                          <td className="px-3 py-2">{formatDate(record.calibrationDate)}</td>
                          <td className="px-3 py-2">{record.certificateNo || "-"}</td>
                          <td className="px-3 py-2">{record.resultLabel}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveRecord(record)}
                                className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                              >
                                Xem
                              </button>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(record)}
                                  className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
                                >
                                  Sửa
                                </button>
                              )}
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(record)}
                                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {activeRecord ? (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-slate-800">
                    Chi tiết: {activeRecord.certificateNo || formatDate(activeRecord.calibrationDate)}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">{EQUIPMENT_COLUMN.result}</p>
                      <p className="font-medium">{activeRecord.resultLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{EQUIPMENT_COLUMN.calibrationVendor}</p>
                      <p className="font-medium">{activeRecord.vendor || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{CALIBRATION_EVAL.evaluationDate}</p>
                      <p className="font-medium">
                        {recordEvaluationDate ? formatDate(recordEvaluationDate) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{CALIBRATION_EVAL.evaluatedBy}</p>
                      <p className="font-medium">{recordEvaluatedBy || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{CALIBRATION_EVAL.certificate}</p>
                      {activeRecord.certificatePath ? (
                        <a
                          href={activeRecord.certificatePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-700 underline"
                        >
                          Tải xuống
                        </a>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500">{CALIBRATION_EVAL.generalNotes}</p>
                      <p className="whitespace-pre-wrap font-medium">{activeRecord.notes || "-"}</p>
                    </div>
                  </div>
                  {activeRecord.calibrationResults.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {CALIBRATION_EVAL.sectionTitle}
                      </p>
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-xs text-slate-500">
                            <tr>
                              <th className="px-3 py-2">{CALIBRATION_EVAL.measuredResult}</th>
                              <th className="px-3 py-2">{CALIBRATION_EVAL.error}</th>
                              <th className="px-3 py-2">{CALIBRATION_EVAL.standardResult}</th>
                              <th className="px-3 py-2">{CALIBRATION_EVAL.correctiveAction}</th>
                              <th className="px-3 py-2">{CALIBRATION_EVAL.notes}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeRecord.calibrationResults.map((row, index) => (
                              <tr key={`${row.result}-${row.error}-${index}`} className="border-t">
                                <td className="px-3 py-2">{row.result || "-"}</td>
                                <td className="px-3 py-2">{row.error || "-"}</td>
                                <td className="px-3 py-2">{row.standardResult || "-"}</td>
                                <td className="px-3 py-2">{row.correctiveAction || "-"}</td>
                                <td className="px-3 py-2">{row.notes || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có dòng kết quả hiệu chuẩn.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chọn một hồ sơ để xem chi tiết.</p>
              )}
            </div>
          ) : null
        }
      />

      <ModalShell
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Sửa hồ sơ hiệu chuẩn" : "Thêm hồ sơ hiệu chuẩn"}
          </h2>
          <button type="button" onClick={() => setIsFormOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="mt-4 space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">{CALIBRATION_EVAL.recordSectionTitle}</h3>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Thiết bị</label>
              <EquipmentSelect
                value={form.equipmentId}
                onChange={(v) => setForm((p) => ({ ...p, equipmentId: v }))}
                options={equipmentOptions}
                disabled={isEditing}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_COLUMN.calibrationDate}</label>
                <input
                  type="date"
                  value={form.calibrationDate}
                  onChange={(e) => setForm((p) => ({ ...p, calibrationDate: e.target.value }))}
                  className="h-11 w-full rounded-xl border px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_COLUMN.certificateNo}</label>
                <input
                  value={form.certificateNo}
                  onChange={(e) => setForm((p) => ({ ...p, certificateNo: e.target.value }))}
                  className="h-11 w-full rounded-xl border px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm text-slate-600">
                  {CALIBRATION_EVAL.measuredResult} / {CALIBRATION_EVAL.error}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      resultRows: [...p.resultRows, { ...EMPTY_CALIBRATION_RESULT_ROW }],
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm dòng
                </button>
              </div>
              <div className="space-y-2">
                {form.resultRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      value={row.result}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          resultRows: updateResultRow(p.resultRows, index, { result: e.target.value }),
                        }))
                      }
                      placeholder={CALIBRATION_EVAL.measuredResult}
                      className="h-11 w-full rounded-xl border px-3 text-sm"
                    />
                    <input
                      value={row.error}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          resultRows: updateResultRow(p.resultRows, index, { error: e.target.value }),
                        }))
                      }
                      placeholder={CALIBRATION_EVAL.error}
                      className="h-11 w-full rounded-xl border px-3 text-sm"
                    />
                    <button
                      type="button"
                      disabled={form.resultRows.length === 1}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          resultRows:
                            p.resultRows.length === 1
                              ? p.resultRows
                              : p.resultRows.filter((_, i) => i !== index),
                        }))
                      }
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Xóa dòng"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">{EQUIPMENT_COLUMN.calibrationVendor}</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
                className="h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>
            <EquipmentFileUpload
              label={CALIBRATION_EVAL.certificate}
              onChange={setCertFile}
              currentPath={editingRecord?.certificatePath}
            />
            <div>
              <label className="mb-1 block text-sm text-slate-600">{CALIBRATION_EVAL.generalNotes}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">{CALIBRATION_EVAL.sectionTitle}</h3>
            <p className="text-xs text-slate-500">{CALIBRATION_EVAL.passFailHint}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-600">{CALIBRATION_EVAL.evaluationDate}</label>
                <input
                  type="date"
                  value={form.evaluationDate}
                  onChange={(e) => setForm((p) => ({ ...p, evaluationDate: e.target.value }))}
                  className="h-11 w-full rounded-xl border px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">{CALIBRATION_EVAL.evaluatedBy}</label>
                <input
                  value={form.evaluatedBy}
                  onChange={(e) => setForm((p) => ({ ...p, evaluatedBy: e.target.value }))}
                  placeholder={CALIBRATION_EVAL.evaluatedBy}
                  className="h-11 w-full rounded-xl border px-3 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-2 py-2">{CALIBRATION_EVAL.measuredResult}</th>
                    <th className="px-2 py-2">{CALIBRATION_EVAL.error}</th>
                    <th className="px-2 py-2">{CALIBRATION_EVAL.standardResult}</th>
                    <th className="px-2 py-2">{CALIBRATION_EVAL.correctiveAction}</th>
                    <th className="px-2 py-2">{CALIBRATION_EVAL.notes}</th>
                  </tr>
                </thead>
                <tbody>
                  {form.resultRows.map((row, index) => (
                    <tr key={index} className="border-t align-top">
                      <td className="px-2 py-2 text-slate-600">{row.result || "-"}</td>
                      <td className="px-2 py-2 text-slate-600">{row.error || "-"}</td>
                      <td className="px-2 py-2">
                        <input
                          value={row.standardResult}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              resultRows: updateResultRow(p.resultRows, index, {
                                standardResult: e.target.value,
                              }),
                            }))
                          }
                          placeholder="Quy chuẩn"
                          className="h-10 w-full min-w-[7rem] rounded-lg border px-2 text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.correctiveAction}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              resultRows: updateResultRow(p.resultRows, index, {
                                correctiveAction: e.target.value,
                              }),
                            }))
                          }
                          placeholder="Đánh giá hoặc hành động khắc phục"
                          className="h-10 w-full min-w-[7rem] rounded-lg border px-2 text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.notes}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              resultRows: updateResultRow(p.resultRows, index, { notes: e.target.value }),
                            }))
                          }
                          placeholder={CALIBRATION_EVAL.notes}
                          className="h-10 w-full min-w-[6rem] rounded-lg border px-2 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-sm">
            Huỷ
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa hồ sơ hiệu chuẩn"
        message="Bạn có chắc muốn xóa hồ sơ hiệu chuẩn này?"
        cancelLabel="Hủy"
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
