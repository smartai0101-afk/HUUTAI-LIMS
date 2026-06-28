"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Database, ExternalLink, RefreshCw } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/ToastProvider";
import { ChemInfoEmptyState } from "@/components/chem-info/ChemInfoEmptyState";
import { ChemicalSyncStatusBadge, sourceLabel } from "@/components/chem-info/ChemicalSyncStatusBadge";
import { GhsPictogramGrid } from "@/components/chem-info/GhsPictogramGrid";
import { HazardStatementList } from "@/components/chem-info/HazardStatementList";
import { SdsDocumentList } from "@/components/chem-info/SdsDocumentList";
import { refreshFromPubChem } from "@/lib/actions/chem-info-sync";
import { cn, formatDate } from "@/lib/utils";
import type { ChemicalReferenceView, InventoryChemicalLink } from "@/types/chem-info";

type Tab = "Thông tin" | "An toàn GHS/SDS" | "Liên kết kho";

const tabs: Tab[] = ["Thông tin", "An toàn GHS/SDS", "Liên kết kho"];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium whitespace-pre-wrap text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function ChemicalReferenceDetailClient({
  reference,
  inventoryLinks,
}: {
  reference: ChemicalReferenceView;
  inventoryLinks: InventoryChemicalLink[];
}) {
  const router = useRouter();
  const { canEdit } = useSession();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Thông tin");
  const [pending, startTransition] = useTransition();

  const handleRefresh = (force = false) => {
    startTransition(async () => {
      const result = await refreshFromPubChem(reference.id, force);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã refresh dữ liệu từ PubChem", "success");
      router.refresh();
    });
  };

  const safety = reference.safety;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/chem-info/chemicals"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại tra cứu
          </Link>
          <p className="text-sm text-slate-500">Thông tin hóa học</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{reference.name}</h1>
            <ChemicalSyncStatusBadge syncStatus={reference.syncStatus} source={reference.source} />
          </div>
          <p className="text-sm text-slate-500">
            CAS {reference.casNumber}
            {reference.molecularFormula ? ` · ${reference.molecularFormula}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reference.pubchemUrl ? (
            <Link
              href={reference.pubchemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Xem trên PubChem
            </Link>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => handleRefresh(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
              Refresh dữ liệu
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Thông tin" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CAS Number" value={reference.casNumber} />
              <Field label="Công thức phân tử" value={reference.molecularFormula} />
              <Field
                label="Khối lượng mol"
                value={reference.molecularWeight != null ? `${reference.molecularWeight} g/mol` : "—"}
              />
              <Field label="PubChem CID" value={reference.pubchemCid != null ? String(reference.pubchemCid) : "—"} />
              <Field label="Nguồn dữ liệu" value={sourceLabel(reference.source)} />
              <Field
                label="Cập nhật lần cuối"
                value={reference.lastSyncedAt ? formatDate(reference.lastSyncedAt) : "—"}
              />
              <Field label="IUPAC Name" value={reference.iupacName} />
              <Field
                label="Nhóm nguy hiểm"
                value={reference.hazardCategories.length ? reference.hazardCategories.join(", ") : "—"}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Tên đồng nghĩa"
                  value={reference.synonyms.length ? reference.synonyms.join("; ") : "—"}
                />
              </div>
              <div className="sm:col-span-2">
                <Field label="Canonical SMILES" value={reference.smiles} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Isomeric SMILES" value={reference.isomericSmiles} />
              </div>
              <div className="sm:col-span-2">
                <Field label="InChI Key" value={reference.inchiKey} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Ghi chú" value={reference.notes} />
              </div>
            </div>
            {reference.structure2dUrl ? (
              <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs text-slate-500">Cấu trúc 2D</p>
                <div className="relative h-48 w-48">
                  <Image
                    src={reference.structure2dUrl}
                    alt={`Cấu trúc ${reference.name}`}
                    fill
                    className="object-contain"
                    sizes="192px"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "An toàn GHS/SDS" ? (
        <div className="space-y-6">
          {!safety ? (
            <ChemInfoEmptyState message="Chưa có dữ liệu an toàn GHS. Dùng Refresh dữ liệu hoặc nhập thủ công. Dữ liệu an toàn từ API ngoài chỉ mang tính tham khảo." />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Dữ liệu GHS/SDS hiển thị tại đây là nguồn nội bộ hoặc do admin nhập. Thông tin an toàn từ PubChem
                hoặc API ngoài chỉ mang tính tham khảo trước khi kiểm duyệt chính thức.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Từ tín hiệu" value={safety.signalWord} />
                <Field label="UN Number" value={safety.unNumber} />
                <Field label="Nhóm nguy hiểm vận chuyển" value={safety.hazardClass} />
                <Field label="Nhóm đóng gói" value={safety.packingGroup} />
                <Field label="Cập nhật lần cuối" value={formatDate(safety.updatedAt)} />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Pictogram GHS</h3>
                <GhsPictogramGrid pictograms={safety.pictograms} />
              </div>

              <HazardStatementList title="Câu cảnh báo (H)" statements={safety.hazardStatements} />
              <HazardStatementList
                title="Biện pháp phòng ngừa (P)"
                statements={safety.precautionaryStatements}
              />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SdsDocumentList referenceId={reference.id} documents={reference.sdsDocuments} />
          </div>
        </div>
      ) : null}

      {activeTab === "Liên kết kho" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!inventoryLinks.length ? (
            <ChemInfoEmptyState message="Không tìm thấy hóa chất tồn kho nào khớp CAS này." />
          ) : (
            <ul className="space-y-2">
              {inventoryLinks.map((link) => (
                <li
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{link.name}</p>
                      <p className="text-xs text-slate-500">
                        {link.code} · CAS {link.casNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-600">
                      Tồn: {link.quantity} {link.unit}
                    </span>
                    <Link
                      href={`/chemicals?code=${encodeURIComponent(link.code)}`}
                      className="font-medium text-cyan-700 hover:underline"
                    >
                      Xem trong kho
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
