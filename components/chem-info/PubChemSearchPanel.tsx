"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Globe, Loader2, Save } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import { syncFromPubChem } from "@/lib/actions/chem-info-sync";
import type { PubChemSearchHitView, PubChemSearchOnlineResponse } from "@/types/chem-info";

type Props = {
  query: string;
  searchMode: "all" | "name" | "cas" | "formula";
  onClose?: () => void;
};

function resolveErrorMessage(data: PubChemSearchOnlineResponse, status: number): string {
  if (data.message) return data.message;
  if (data.error) return data.error;

  switch (data.code) {
    case "NOT_FOUND":
      return "Không tìm thấy kết quả trên PubChem";
    case "TIMEOUT":
      return "PubChem không phản hồi trong thời gian cho phép (timeout 15 giây). Vui lòng thử lại sau.";
    case "UNREACHABLE":
      return "Không thể kết nối tới PubChem. Kiểm tra kết nối mạng, firewall hoặc VPN rồi thử lại.";
    case "PARSE_ERROR":
      return "Lỗi parse dữ liệu từ PubChem.";
    case "UNAUTHORIZED":
      return "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.";
    case "EMPTY_QUERY":
      return "Vui lòng nhập từ khóa tra cứu";
    default:
      if (status === 401) return "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.";
      return "Lỗi hệ thống khi tra cứu PubChem. Vui lòng thử lại sau.";
  }
}

export function PubChemSearchPanel({ query, searchMode, onClose }: Props) {
  const router = useRouter();
  const { canEdit } = useSession();
  const { addToast } = useToast();
  const [items, setItems] = useState<PubChemSearchHitView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, startLoading] = useTransition();
  const [savingCid, setSavingCid] = useState<number | null>(null);

  const runSearch = () => {
    startLoading(async () => {
      setError(null);
      setLoaded(false);
      try {
        const res = await fetch("/api/chemicals/search-online", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            mode: searchMode,
            limit: 20,
          }),
        });

        const text = await res.text();
        let data: PubChemSearchOnlineResponse;
        try {
          data = JSON.parse(text) as PubChemSearchOnlineResponse;
        } catch {
          setError(
            res.ok
              ? "Phản hồi API không hợp lệ (không phải JSON). Vui lòng tải lại trang và thử lại."
              : `Phản hồi API lỗi (HTTP ${res.status}). Vui lòng thử lại sau.`,
          );
          setItems([]);
          return;
        }

        if (!res.ok) {
          setError(resolveErrorMessage(data, res.status));
          setItems([]);
          return;
        }

        const hits = data.items ?? [];
        setItems(hits);

        if (hits.length === 0 || data.code === "NOT_FOUND") {
          setError(null);
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : "";
        setError(
          detail
            ? `Không thể gọi API tra cứu: ${detail}. Kiểm tra server dev đang chạy và thử lại.`
            : "Không thể gọi API tra cứu. Kiểm tra server dev đang chạy, kết nối mạng và thử lại.",
        );
        setItems([]);
      } finally {
        setLoaded(true);
      }
    });
  };

  const handleSave = (cid: number) => {
    if (!canEdit) return;
    setSavingCid(cid);
    startLoading(async () => {
      const result = await syncFromPubChem(cid, query);
      setSavingCid(null);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast(
        result.created ? "Đã lưu hóa chất mới vào hệ thống" : "Đã cập nhật hóa chất có sẵn",
        "success",
      );
      onClose?.();
      if (result.id) router.push(`/chem-info/chemicals/${result.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-900">
            <Globe className="h-4 w-4" />
            Tra cứu online (PubChem)
          </div>
          <p className="mt-1 text-xs text-cyan-800/80">
            Tối đa 20 kết quả/lần. Dữ liệu an toàn/GHS từ ngoài chỉ mang tính tham khảo.
          </p>
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
        >
          {loading && !loaded ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {loaded ? "Tra cứu lại" : "Tra cứu online"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loaded && !error && items.length === 0 ? (
        <p className="text-sm text-slate-600">Không tìm thấy kết quả trên PubChem cho &quot;{query}&quot;.</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.cid}
              className="flex flex-col gap-3 rounded-xl border border-white bg-white p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <Image
                  src={item.structure2dUrl}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  CID {item.cid}
                  {item.cas ? ` · CAS ${item.cas}` : ""}
                  {item.molecularFormula ? ` · ${item.molecularFormula}` : ""}
                  {item.molecularWeight != null ? ` · ${item.molecularWeight} g/mol` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${item.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  PubChem
                </Link>
                {canEdit ? (
                  <button
                    type="button"
                    disabled={loading && savingCid === item.cid}
                    onClick={() => handleSave(item.cid)}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
                  >
                    {savingCid === item.cid ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Lưu vào hệ thống
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
