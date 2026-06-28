"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMethodSopAction,
  extractSopAction,
  setPrimarySopAction,
  uploadMethodSopAction,
} from "@/lib/actions/analytical-methods";
import { AiExtractionBanner } from "@/components/analytical-methods/AiExtractionBanner";
import type { MethodDocumentView } from "@/types/analytical-methods";

type Props = {
  methodId: string;
  documents: MethodDocumentView[];
  editable: boolean;
};

export function SopUploadPanel({ methodId, documents, editable }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await uploadMethodSopAction(methodId, fd);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <AiExtractionBanner />
      {editable ? (
        <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="font-semibold text-slate-900">Upload SOP (PDF / DOCX)</h2>
          <input type="file" name="sop" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPrimary" value="true" />
            Đặt làm SOP chính
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
            Upload
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Phiên bản đã phê duyệt — tạo phiên bản mới để upload SOP.</p>
      )}

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Loại</th>
              <th className="px-4 py-2">Người upload</th>
              <th className="px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <a href={doc.filePath} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
                    {doc.fileName}
                    {doc.isPrimary ? " (chính)" : ""}
                  </a>
                </td>
                <td className="px-4 py-2">{doc.fileType}</td>
                <td className="px-4 py-2">{doc.uploadedBy}</td>
                <td className="px-4 py-2 flex flex-wrap gap-2">
                  {editable ? (
                    <>
                      <button
                        type="button"
                        className="text-xs text-cyan-700"
                        onClick={async () => {
                          await setPrimarySopAction(methodId, doc.id);
                          router.refresh();
                        }}
                      >
                        Đặt chính
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={async () => {
                          await deleteMethodSopAction(methodId, doc.id);
                          router.refresh();
                        }}
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        className="text-xs text-amber-700"
                        onClick={async () => {
                          const r = await extractSopAction(methodId, doc.id);
                          setMessage("message" in r ? r.message : r.error ?? "");
                        }}
                      >
                        Đề xuất từ SOP (AI)
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Chưa có SOP
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
