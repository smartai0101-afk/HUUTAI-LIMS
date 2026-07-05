import type { SampleStatus } from "@prisma/client";

export const SAMPLE_TRANSITIONS: Record<SampleStatus, SampleStatus[]> = {
  Received: ["WaitingAssignment", "Rejected"],
  WaitingAssignment: ["Assigned", "Rejected"],
  Assigned: ["InAnalysis", "WaitingAssignment", "Rejected"],
  InAnalysis: ["WaitingReview", "Assigned", "Rejected"],
  WaitingReview: ["Completed", "InAnalysis", "Rejected"],
  Completed: ["ResultIssued", "Rejected"],
  ResultIssued: ["Stored", "Disposed"],
  Stored: ["Disposed"],
  Disposed: [],
  Rejected: [],
};

export function canTransitionSampleStatus(from: SampleStatus, to: SampleStatus): boolean {
  return SAMPLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function initialSampleStatus(condition: string): SampleStatus {
  if (condition === "Rejected") return "Rejected";
  return "Received";
}

export function nextStatusAfterReceive(condition: string): SampleStatus {
  if (condition === "Rejected") return "Rejected";
  if (condition === "NeedConfirmation") return "Received";
  if (condition === "Fail") return "WaitingAssignment";
  return "WaitingAssignment";
}

export const TERMINAL_SAMPLE_STATUSES: SampleStatus[] = [
  "ResultIssued",
  "Stored",
  "Disposed",
  "Rejected",
];

export function isSampleOverdue(dueDate: Date | null | undefined, status: SampleStatus): boolean {
  if (!dueDate) return false;
  if (TERMINAL_SAMPLE_STATUSES.includes(status)) return false;
  return dueDate.getTime() < Date.now();
}

export function validateCompletionRequirements(tests: {
  methodId: string | null;
  assignedTo: string;
  status: string;
}[]): string | null {
  if (tests.length === 0) {
    return "Cần ít nhất một phép thử trước khi hoàn thành mẫu";
  }
  const valid = tests.some(
    (t) => t.methodId && t.assignedTo.trim() && (t.status === "Done" || t.status === "Reviewed"),
  );
  if (!valid) {
    return "Cần phương pháp phân tích, người phụ trách và trạng thái phân tích phù hợp";
  }
  return null;
}
