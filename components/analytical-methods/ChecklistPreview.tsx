"use client";

import { DataTable } from "@/components/DataTable";
import { WORKFLOW_NODE_TYPE_LABELS } from "@/lib/analytical-methods-labels";
import type { ChecklistItemView } from "@/types/analytical-methods";

type Props = { items: ChecklistItemView[] };

export function ChecklistPreview({ items }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Checklist sinh tự động từ flowchart (preview).</p>
      <DataTable
        columns={[
          { key: "stepOrder", header: "STT" },
          { key: "stepName", header: "Bước" },
          { key: "instruction", header: "Hướng dẫn" },
          {
            key: "nodeType",
            header: "Loại",
            render: (v) => WORKFLOW_NODE_TYPE_LABELS[String(v)] ?? String(v),
          },
        ]}
        rows={items}
        getRowKey={(row) => `${row.workflowNodeKey}-${row.stepOrder}`}
      />
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Thêm bước Step/QC/Equipment/Reagent trong flowchart.</p>
      ) : null}
    </div>
  );
}
