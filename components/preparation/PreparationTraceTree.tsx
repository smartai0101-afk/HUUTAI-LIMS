"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { fetchPreparationTraceTree } from "@/lib/actions/preparation-workflow";
import type { TraceTreeNode } from "@/lib/services/preparation-traceability";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";

const KIND_LABELS: Record<TraceTreeNode["kind"], string> = {
  PreparedChemical: "HC pha chế",
  PreparedStandard: "Chuẩn pha chế",
  PreparedStrain: "Chủng pha chế",
  Chemical: "Hóa chất gốc",
  Standard: "Chuẩn gốc",
  MicrobialStrain: "Chủng gốc",
};

const ROLE_LABELS: Record<string, string> = {
  ROOT: "Bản ghi hiện tại",
  MAIN: "Thành phần",
  SOLVENT: "Dung môi",
  SOURCE: "Nguồn gốc",
};

type Props = {
  preparationType: PreparationRecordType;
  preparationId: string;
  equipmentHref?: string;
  equipmentLabel?: string;
};

function TraceNodeRow({ node, depth }: { node: TraceTreeNode; depth: number }) {
  const meta: string[] = [];
  if (node.role && node.role !== "ROOT") meta.push(ROLE_LABELS[node.role] ?? node.role);
  if (node.lot) meta.push(`Lot ${node.lot}`);
  if (node.quantityUsed != null && node.unit) meta.push(`${node.quantityUsed} ${node.unit}`);
  if (node.concentration) {
    meta.push(
      node.concentrationUnit
        ? `${node.concentration} ${node.concentrationUnit}`
        : node.concentration,
    );
  }

  return (
    <li className="list-none">
      <div
        className="rounded-xl border border-slate-200 bg-white p-3"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {node.href ? (
                <Link href={node.href} className="text-sky-700 hover:underline">
                  {node.code}
                </Link>
              ) : (
                node.code
              )}
              {" · "}
              {node.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{KIND_LABELS[node.kind]}</p>
          </div>
          {meta.length ? (
            <p className="text-xs text-slate-600">{meta.join(" · ")}</p>
          ) : null}
        </div>
      </div>
      {node.children.length ? (
        <ul className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TraceNodeRow key={`${child.kind}:${child.id}:${depth}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PreparationTraceTree({
  preparationType,
  preparationId,
  equipmentHref,
  equipmentLabel,
}: Props) {
  const [tree, setTree] = useState<TraceTreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fd = new FormData();
    fd.set("preparationType", preparationType);
    fd.set("id", preparationId);
    startTransition(async () => {
      const result = await fetchPreparationTraceTree(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("tree" in result && result.tree) {
        setTree(result.tree);
      }
    });
  }, [preparationType, preparationId]);

  if (pending && !tree) {
    return <p className="text-sm text-slate-500">Đang tải cây truy xuất...</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!tree) {
    return <p className="text-sm text-slate-500">Không có dữ liệu truy xuất.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Truy ngược từ bản ghi pha chế đến nguyên liệu / chuẩn / chủng gốc.
      </p>
      {equipmentLabel ? (
        <p className="text-sm text-slate-700">
          Thiết bị:{" "}
          {equipmentHref ? (
            <Link href={equipmentHref} className="text-sky-700 hover:underline">
              {equipmentLabel}
            </Link>
          ) : (
            equipmentLabel
          )}
        </p>
      ) : null}
      <ul className="space-y-2">
        <TraceNodeRow node={tree} depth={0} />
      </ul>
    </div>
  );
}
