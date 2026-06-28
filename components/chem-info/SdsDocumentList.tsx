"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";
import { deleteSdsDocument, uploadSdsDocument } from "@/lib/actions/chem-info-sds";
import { formatDate } from "@/lib/utils";
import type { SdsDocumentView } from "@/types/chem-info";

function SdsLink({ doc }: { doc: SdsDocumentView }) {
  const href = doc.filePath ?? doc.externalUrl;
  if (!href) return <span className="text-slate-400">Không có liên kết</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {doc.filePath ? <FileText className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
      {doc.filePath ? "Xem PDF" : "Liên kết ngoài"}
    </a>
  );
}

export function SdsDocumentList({
  referenceId,
  documents,
}: {
  referenceId: string;
  documents: SdsDocumentView[];
}) {
  const router = useRouter();
  const { canEdit } = useSession();
  const { addToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("SDS");
  const [supplier, setSupplier] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    const fd = new FormData();
    fd.set("referenceId", referenceId);
    fd.set("title", title);
    fd.set("supplier", supplier);
    fd.set("externalUrl", externalUrl);
    if (file) fd.set("file", file);

    startTransition(async () => {
      const result = await uploadSdsDocument(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã thêm tài liệu SDS", "success");
      setShowForm(false);
      setTitle("SDS");
      setSupplier("");
      setExternalUrl("");
      setFile(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSdsDocument(id);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa tài liệu SDS", "success");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Tài liệu SDS</h3>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Tải lên SDS
          </button>
        ) : null}
      </div>

      {showForm && canEdit ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Nhà cung cấp</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">URL ngoài (tùy chọn)</label>
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">File PDF</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleUpload}
              className="rounded-xl bg-slate-950 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {pending ? "Đang tải..." : "Lưu SDS"}
            </button>
          </div>
        </div>
      ) : null}

      {!documents.length ? (
        <ChemInfoEmptyState message="Chưa có tài liệu SDS. Tải lên PDF hoặc thêm liên kết ngoài." />
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {doc.title}
                  {doc.isPrimary ? (
                    <span className="ml-2 rounded-md bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">
                      Chính
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {doc.supplier || "—"}
                  {doc.revisionDate ? ` · Rev. ${formatDate(doc.revisionDate)}` : ""}
                  {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SdsLink doc={doc} />
                {canEdit ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Xóa
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
