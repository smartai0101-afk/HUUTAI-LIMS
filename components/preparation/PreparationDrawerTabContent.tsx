"use client";

import { PreparationHistoryTimeline } from "@/components/preparation/PreparationHistoryTimeline";
import { PreparationWorkflowPanel } from "@/components/preparation/PreparationWorkflowPanel";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import type { StaffView } from "@/lib/services/staff";

type Props = {
  tab: string;
  preparationType: PreparationRecordType;
  record: { id: string; workflowStatus: string; version: number };
  staff: StaffView[];
  canEdit: boolean;
  role: string;
  onRefresh: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  detail: React.ReactNode;
};

export function PreparationDrawerTabContent({
  tab,
  preparationType,
  record,
  staff,
  canEdit,
  role,
  onRefresh,
  onError,
  onSuccess,
  detail,
}: Props) {
  if (tab === "Lịch sử") {
    return (
      <PreparationHistoryTimeline
        preparationType={preparationType}
        preparationId={record.id}
        role={role}
      />
    );
  }
  if (tab === "Truy xuất") {
    return (
      <p className="text-sm text-slate-500">
        Cây truy xuất nguồn gốc sẽ có ở Phase 3.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <PreparationWorkflowPanel
        preparationType={preparationType}
        recordId={record.id}
        workflowStatus={record.workflowStatus}
        version={record.version}
        staff={staff}
        canEdit={canEdit}
        role={role}
        onChanged={onRefresh}
        onError={onError}
        onSuccess={onSuccess}
      />
      {detail}
    </div>
  );
}
