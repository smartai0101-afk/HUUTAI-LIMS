"use client";

import type { EnvironmentalLogView } from "@/types";
import type { EquipmentOption } from "@/lib/services/equipment-options";

export type IsoFormValues = {
  formula: string;
  originalConcentration: string;
  finalConcentration: string;
  equipmentUsed: string;
  preparationCondition: string;
  equipmentId: string;
  attachmentUrl: string;
};

type Props = {
  form: IsoFormValues;
  onChange: (patch: Partial<IsoFormValues>) => void;
  environmentalLogs?: EnvironmentalLogView[];
  equipmentOptions?: EquipmentOption[];
  showEquipmentPicker?: boolean;
  attachmentFile: File | null;
  onAttachmentChange: (file: File | null) => void;
};

export function PreparationIsoFormFields({
  form,
  onChange,
  environmentalLogs = [],
  equipmentOptions = [],
  showEquipmentPicker = false,
  attachmentFile,
  onAttachmentChange,
}: Props) {
  const selectedEquipment = equipmentOptions.find((item) => item.id === form.equipmentId);

  const applyEnvironmentalLog = (logId: string) => {
    const log = environmentalLogs.find((item) => item.id === logId);
    if (!log) return;
    onChange({ preparationCondition: log.snapshotText });
  };

  const selectEquipment = (equipmentId: string) => {
    const equipment = equipmentOptions.find((item) => item.id === equipmentId);
    onChange({
      equipmentId,
      equipmentUsed: equipment ? `${equipment.code} · ${equipment.name}` : form.equipmentUsed,
    });
  };

  return (
    <>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Công thức</label>
        <input
          value={form.formula}
          onChange={(e) => onChange({ formula: e.target.value })}
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Nồng độ gốc</label>
        <input
          value={form.originalConcentration}
          onChange={(e) => onChange({ originalConcentration: e.target.value })}
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Nồng độ sau pha</label>
        <input
          value={form.finalConcentration}
          onChange={(e) => onChange({ finalConcentration: e.target.value })}
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
        />
      </div>
      {showEquipmentPicker ? (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">Thiết bị sử dụng</label>
          <select
            value={form.equipmentId}
            onChange={(e) => selectEquipment(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">— Chọn thiết bị —</option>
            {equipmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} · {item.name}
                {item.isCalibrationExpired ? " (HC quá hạn)" : ""}
              </option>
            ))}
          </select>
          {selectedEquipment?.isCalibrationExpired ? (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Cảnh báo: thiết bị {selectedEquipment.code} đã quá hạn hiệu chuẩn
              {selectedEquipment.calibrationExpiryDate
                ? ` (${selectedEquipment.calibrationExpiryDate})`
                : ""}
              .
            </p>
          ) : null}
        </div>
      ) : (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">Thiết bị sử dụng</label>
          <input
            value={form.equipmentUsed}
            onChange={(e) => onChange({ equipmentUsed: e.target.value })}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </div>
      )}
      {environmentalLogs.length ? (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">Nhật ký môi trường gần đây</label>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyEnvironmentalLog(e.target.value);
              e.target.value = "";
            }}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">— Chọn để điền điều kiện pha chế —</option>
            {environmentalLogs.map((log) => (
              <option key={log.id} value={log.id}>
                {log.snapshotText}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Điều kiện pha chế</label>
        <textarea
          value={form.preparationCondition}
          onChange={(e) => onChange({ preparationCondition: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm text-slate-600">Tệp đính kèm</label>
        {form.attachmentUrl ? (
          <p className="mb-2 text-xs text-slate-500">
            Hiện tại:{" "}
            <a href={form.attachmentUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
              {form.attachmentUrl.split("/").pop()}
            </a>
          </p>
        ) : null}
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onAttachmentChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600"
        />
        {attachmentFile ? (
          <p className="mt-1 text-xs text-slate-500">Tệp mới: {attachmentFile.name}</p>
        ) : null}
      </div>
    </>
  );
}
