"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createSampleRequestAction,
  submitSampleRequestAction,
  updateSampleRequestAction,
} from "@/lib/actions/samples";
import { SAMPLE_TYPE_OPTIONS } from "@/lib/sample-labels";
import type { MethodOption, SampleRequestDetailView } from "@/types/samples";

type Props = {
  methodOptions: MethodOption[];
  initial?: SampleRequestDetailView | null;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none";

export function SampleRequestFormClient({ methodOptions, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [testsText, setTestsText] = useState((initial?.requestedTests ?? []).join("\n"));
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    initial?.methods.map((m) => m.methodId) ?? [],
  );

  function buildFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("requestedTests", JSON.stringify(testsText.split("\n").map((s) => s.trim()).filter(Boolean)));
    fd.set("methodIds", JSON.stringify(selectedMethods));
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
      if (andSubmit && id) {
        const submit = await submitSampleRequestAction(id);
        if (submit.error) {
          setError(submit.error);
          return;
        }
      }
      router.push(id ? `/samples/requests/${id}` : "/samples/requests");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {initial ? `Phiếu ${initial.requestCode}` : "Tạo phiếu yêu cầu mới"}
        </h1>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <form id="request-form" className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Ngày yêu cầu *</span>
              <input
                name="requestDate"
                type="date"
                required
                className={inputClass}
                defaultValue={initial?.requestDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Người yêu cầu *</span>
              <input name="requesterName" required className={inputClass} defaultValue={initial?.requesterName ?? ""} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Khách hàng</span>
              <input name="customerName" className={inputClass} defaultValue={initial?.customerName ?? ""} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Phòng ban</span>
              <input name="department" className={inputClass} defaultValue={initial?.department ?? ""} />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Mục đích thử nghiệm</span>
              <textarea name="purpose" rows={2} className={inputClass} defaultValue={initial?.purpose ?? ""} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Loại mẫu *</span>
              <input
                name="sampleType"
                list="sample-types-req"
                required
                className={inputClass}
                defaultValue={initial?.sampleType ?? ""}
              />
              <datalist id="sample-types-req">
                {SAMPLE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Số lượng mẫu *</span>
              <input
                name="sampleCount"
                type="number"
                min={1}
                required
                className={inputClass}
                defaultValue={initial?.sampleCount ?? 1}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Thời hạn trả kết quả</span>
              <input
                name="dueDate"
                type="date"
                className={inputClass}
                defaultValue={initial?.dueDate?.slice(0, 10) ?? ""}
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Chỉ tiêu cần phân tích</span>
              <textarea value={testsText} onChange={(e) => setTestsText(e.target.value)} rows={4} className={inputClass} />
            </label>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium">Phương pháp đề xuất</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {methodOptions.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMethods.includes(m.id)}
                      onChange={(e) => {
                        setSelectedMethods((prev) =>
                          e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                        );
                      }}
                    />
                    {m.methodCode} — {m.methodName}
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Ghi chú</span>
              <textarea name="note" rows={2} className={inputClass} defaultValue={initial?.note ?? ""} />
            </label>
          </div>
        </section>
      </form>

      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/samples/requests" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
          Quay lại
        </Link>
        {initial ? (
          <Link
            href={`/samples/receive?requestId=${initial.id}`}
            className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm text-cyan-800"
          >
            Tiếp nhận mẫu từ phiếu này
          </Link>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const form = document.getElementById("request-form") as HTMLFormElement;
            handleSave(form, false);
          }}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
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
          className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          {pending ? "Đang lưu..." : "Lưu & gửi"}
        </button>
      </div>
    </div>
  );
}
