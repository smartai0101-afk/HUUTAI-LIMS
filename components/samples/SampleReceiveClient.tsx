"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSampleAction } from "@/lib/actions/samples";
import {
  CONDITION_REASON_SUGGESTIONS,
  SAMPLE_CONDITION_LABELS,
  SAMPLE_TYPE_OPTIONS,
} from "@/lib/sample-labels";
import type { MethodOption } from "@/types/samples";

type Prefill = {
  requestId?: string;
  requestCode?: string;
  sampleName?: string;
  sampleType?: string;
  dueDate?: string;
  preservationCondition?: string;
  parameterNames?: string[];
  primaryMethodId?: string;
  primaryMethodVersionId?: string;
};

type Props = {
  methodOptions: MethodOption[];
  chemicalReferences: { id: string; name: string; casNumber: string }[];
  prefill?: Prefill | null;
  defaultReceivedBy: string;
};

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className ?? ""}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none";

export function SampleReceiveClient({
  methodOptions,
  chemicalReferences,
  prefill,
  defaultReceivedBy,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [parameterText, setParameterText] = useState(
    (prefill?.parameterNames ?? []).join("\n"),
  );

  const nowLocal = new Date();
  nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  const defaultReceivedAt = nowLocal.toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("parameterNames", JSON.stringify(parameterText.split("\n").map((s) => s.trim()).filter(Boolean)));

    startTransition(async () => {
      const result = await createSampleAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/samples/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tiếp nhận mẫu mới</h1>
        <p className="text-sm text-slate-500">Mã mẫu sẽ được sinh tự động theo dạng SPL-YYYYMMDD-0001</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <FieldGroup title="Thông tin phiếu yêu cầu">
        <Field label="Mã phiếu yêu cầu">
          <input
            name="requestId"
            type="hidden"
            defaultValue={prefill?.requestId ?? ""}
          />
          <input
            className={inputClass}
            defaultValue={prefill?.requestCode ?? ""}
            disabled
            placeholder="Không liên kết phiếu yêu cầu"
          />
        </Field>
        <Field label="Hạn trả kết quả">
          <input name="dueDate" type="date" className={inputClass} defaultValue={prefill?.dueDate ?? ""} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Thông tin mẫu">
        <Field label="Tên mẫu" required>
          <input
            name="sampleName"
            required
            className={inputClass}
            defaultValue={prefill?.sampleName ?? ""}
          />
        </Field>
        <Field label="Loại mẫu" required>
          <input
            name="sampleType"
            list="sample-types"
            required
            className={inputClass}
            defaultValue={prefill?.sampleType ?? ""}
          />
          <datalist id="sample-types">
            {SAMPLE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Mã mẫu khách hàng">
          <input name="customerSampleCode" className={inputClass} />
        </Field>
        <Field label="Người giao mẫu">
          <input name="deliveredBy" className={inputClass} />
        </Field>
        <Field label="Ngày giờ tiếp nhận" required>
          <input
            name="receivedAt"
            type="datetime-local"
            required
            className={inputClass}
            defaultValue={defaultReceivedAt}
          />
        </Field>
        <Field label="Người nhận mẫu" required>
          <input
            name="receivedBy"
            required
            className={inputClass}
            defaultValue={defaultReceivedBy}
          />
        </Field>
        <Field label="Số lượng / khối lượng" required>
          <input name="quantity" type="number" step="any" required className={inputClass} />
        </Field>
        <Field label="Đơn vị" required>
          <input name="unit" required className={inputClass} placeholder="g, mL, cái..." />
        </Field>
        <Field label="Bao bì chứa mẫu">
          <input name="containerType" className={inputClass} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Điều kiện tiếp nhận">
        <Field label="Điều kiện mẫu khi nhận" required>
          <select name="conditionOnReceipt" required className={inputClass} defaultValue="Pass">
            {Object.entries(SAMPLE_CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lý do / ghi chú bất thường" className="md:col-span-2">
          <textarea name="conditionNote" rows={3} className={inputClass} />
          <datalist id="condition-reasons">
            {CONDITION_REASON_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
      </FieldGroup>

      <FieldGroup title="Phân tích yêu cầu">
        <Field label="Phương pháp phân tích chính">
          <select
            name="primaryMethodId"
            className={inputClass}
            defaultValue={prefill?.primaryMethodId ?? ""}
          >
            <option value="">— Cần chỉ định phương pháp —</option>
            {methodOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.methodCode} — {m.methodName}
                {m.versionStatus ? ` (v${m.version ?? "?"} · ${m.versionStatus})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phiên bản phương pháp">
          <select
            name="primaryMethodVersionId"
            className={inputClass}
            defaultValue={prefill?.primaryMethodVersionId ?? ""}
          >
            <option value="">Tự động (phiên bản hiện hành)</option>
            {methodOptions
              .filter((m) => m.versionId)
              .map((m) => (
                <option key={m.versionId!} value={m.versionId!}>
                  {m.methodCode} v{m.version}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Chỉ tiêu phân tích (mỗi dòng một chỉ tiêu)" className="md:col-span-2">
          <textarea
            value={parameterText}
            onChange={(e) => setParameterText(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="Ví dụ: Pb, Cd, Hg..."
          />
        </Field>
        <Field label="Thông tin hóa học liên quan">
          <select name="chemicalReferenceId" className={inputClass} defaultValue="">
            <option value="">— Không chọn —</option>
            {chemicalReferences.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.casNumber})
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>

      <FieldGroup title="Bảo quản và lưu mẫu">
        <Field label="Điều kiện bảo quản">
          <input
            name="preservationCondition"
            className={inputClass}
            defaultValue={prefill?.preservationCondition ?? ""}
          />
        </Field>
        <Field label="Vị trí lưu tạm">
          <input name="storageLocation" className={inputClass} />
        </Field>
        <Field label="Hạn lưu mẫu">
          <input name="retentionUntil" type="date" className={inputClass} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Ghi chú">
        <Field label="Ghi chú" className="md:col-span-2">
          <textarea name="note" rows={3} className={inputClass} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/samples")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Tiếp nhận mẫu"}
        </button>
      </div>
    </form>
  );
}
