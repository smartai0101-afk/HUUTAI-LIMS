import { z } from "zod";

export const rejectAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  rejectionReason: z.string().trim().min(1, "Bắt buộc nhập lý do từ chối"),
});

export const assignAnalystSchema = z.object({
  taskId: z.string().min(1),
  analystId: z.string().min(1, "Chọn analyst"),
  internalDueDate: z.string().min(1, "Deadline nội bộ là bắt buộc"),
  note: z.string().optional(),
});

export const createWorklistSchema = z.object({
  departmentId: z.string().min(1),
  methodId: z.string().min(1, "Chọn phương pháp"),
  methodVersionId: z.string().optional(),
  equipmentId: z.string().min(1, "Chọn thiết bị"),
  analystId: z.string().min(1, "Chọn analyst"),
  taskIds: z.array(z.string()).min(1, "Chọn ít nhất một task"),
});

export const createWorksheetSchema = z.object({
  worklistId: z.string().min(1),
  chemicalIds: z.array(z.string()).optional(),
  standardIds: z.array(z.string()).optional(),
  crmIds: z.array(z.string()).optional(),
  conditionNote: z.string().optional(),
  qcSamples: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export const saveTestResultSchema = z.object({
  resultId: z.string().min(1),
  resultValue: z.string().trim().min(1, "Kết quả là bắt buộc"),
  unit: z.string().optional(),
  lod: z.string().optional(),
  loq: z.string().optional(),
  limitValue: z.string().optional(),
  evaluation: z.enum(["pass", "fail", "not_applicable"]).optional(),
  note: z.string().optional(),
});

export const qcCheckSchema = z.object({
  taskId: z.string().min(1),
  worksheetId: z.string().optional(),
  checkType: z.enum([
    "blank",
    "duplicate",
    "spike",
    "crm",
    "recovery",
    "rsd",
    "calibration",
    "control_chart",
  ]),
  status: z.enum(["pass", "fail", "rerun", "investigate"]),
  note: z.string().optional(),
});

export type RejectAssignmentInput = z.infer<typeof rejectAssignmentSchema>;
export type AssignAnalystInput = z.infer<typeof assignAnalystSchema>;
export type CreateWorklistInput = z.infer<typeof createWorklistSchema>;
export type CreateWorksheetInput = z.infer<typeof createWorksheetSchema>;
export type SaveTestResultInput = z.infer<typeof saveTestResultSchema>;
export type QcCheckInput = z.infer<typeof qcCheckSchema>;
