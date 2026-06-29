import { z } from "zod";

export const createReportSchema = z.object({
  sampleId: z.string().min(1),
});

export const approveReportSchema = z.object({
  reportId: z.string().min(1),
  labManagerName: z.string().optional(),
});

export const qaApproveReportSchema = z.object({
  reportId: z.string().min(1),
  qaName: z.string().optional(),
});

export const issueReportSchema = z.object({
  reportId: z.string().min(1),
  note: z.string().optional(),
  reason: z.string().optional(),
});

export const reissueReportSchema = z.object({
  reportId: z.string().min(1),
  reason: z.string().min(1, "Bắt buộc lý do đính chính/phát hành lại"),
});

export const updateReportNoteSchema = z.object({
  reportId: z.string().min(1),
  note: z.string(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ApproveReportInput = z.infer<typeof approveReportSchema>;
export type QaApproveReportInput = z.infer<typeof qaApproveReportSchema>;
export type IssueReportInput = z.infer<typeof issueReportSchema>;
export type ReissueReportInput = z.infer<typeof reissueReportSchema>;
