"use client";

import { Atom } from "lucide-react";
import { BohrModelDiagram } from "@/components/chem-info/BohrModelDiagram";
import { classificationLabelVi } from "@/components/chem-info/element-colors";
import type { ElementView } from "@/types/chem-info";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatTemp(c: number | null) {
  if (c == null) return "—";
  return `${c} °C`;
}

export function ElementDetailPanel({ element }: { element: ElementView | null }) {
  if (!element) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Chọn một nguyên tố trên bảng tuần hoàn để xem chi tiết.</p>
      </div>
    );
  }

  const hasApplications = element.applications.length > 0;
  const hasElectronShell = element.electronShell.length > 0;

  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <Atom className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {element.nameVi || element.name}
          </h2>
          <p className="text-sm text-slate-500">
            {element.symbol} · {element.name}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ký hiệu" value={element.symbol} />
        <Field label="Số nguyên tử" value={String(element.atomicNumber)} />
        <Field label="Tên (tiếng Việt)" value={element.nameVi || "—"} />
        <Field label="Tên (tiếng Anh)" value={element.name} />
        <Field label="Khối lượng nguyên tử" value={`${element.atomicMass} u`} />
        <Field label="Nhóm" value={element.groupDisplay} />
        <Field label="Chu kỳ" value={String(element.period)} />
        <Field label="Khối (s/p/d/f)" value={element.block} />
        <Field label="Phân loại" value={classificationLabelVi(element.classification)} />
        <Field
          label="Độ âm điện"
          value={element.electronegativity != null ? String(element.electronegativity) : "—"}
        />
        <div className="sm:col-span-2">
          <Field label="Cấu hình electron" value={element.electronConfig} />
        </div>
        <Field label="Nhiệt độ nóng chảy" value={formatTemp(element.meltingPointC)} />
        <Field label="Nhiệt độ sôi" value={formatTemp(element.boilingPointC)} />
      </div>

      <section className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Ứng dụng điển hình</h3>
        {hasApplications ? (
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
            {element.applications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Chưa có dữ liệu ứng dụng</p>
        )}
      </section>

      <section className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Mô hình electron</h3>
        {hasElectronShell ? (
          <div className="space-y-2">
            <BohrModelDiagram symbol={element.symbol} shells={element.electronShell} />
            <p className="text-center text-xs text-slate-500">
              Số electron từng lớp: {element.electronShell.join(", ")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có dữ liệu mô hình electron</p>
        )}
      </section>
    </div>
  );
}
