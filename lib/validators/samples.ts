import { z } from "zod";

const conditionEnum = z.enum(["Pass", "Fail", "NeedConfirmation", "Rejected"]);

export const sampleReceiveSchema = z
  .object({
    sampleName: z.string().trim().min(1, "Tên mẫu là bắt buộc"),
    sampleType: z.string().trim().min(1, "Loại mẫu là bắt buộc"),
    receivedAt: z.string().min(1, "Ngày giờ tiếp nhận là bắt buộc"),
    receivedBy: z.string().trim().min(1, "Người nhận mẫu là bắt buộc"),
    conditionOnReceipt: conditionEnum,
    conditionNote: z.string().optional(),
    quantity: z.coerce.number().positive().optional().nullable(),
    unit: z.string().trim().min(1, "Đơn vị là bắt buộc"),
    customerSampleCode: z.string().optional(),
    deliveredBy: z.string().optional(),
    containerType: z.string().optional(),
    preservationCondition: z.string().optional(),
    storageLocation: z.string().optional(),
    retentionUntil: z.string().optional(),
    note: z.string().optional(),
    requestId: z.string().optional(),
    primaryMethodId: z.string().optional(),
    primaryMethodVersionId: z.string().optional(),
    chemicalReferenceId: z.string().optional(),
    dueDate: z.string().optional(),
    parameterNames: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.conditionOnReceipt === "Fail" || data.conditionOnReceipt === "Rejected") &&
      !data.conditionNote?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Bắt buộc nhập lý do khi mẫu không đạt hoặc bị từ chối",
        path: ["conditionNote"],
      });
    }
    if (data.quantity == null || !Number.isFinite(data.quantity)) {
      ctx.addIssue({
        code: "custom",
        message: "Số lượng/khối lượng mẫu là bắt buộc",
        path: ["quantity"],
      });
    }
  });

export const sampleRequestSchema = z.object({
  requestDate: z.string().min(1, "Ngày yêu cầu là bắt buộc"),
  requesterName: z.string().trim().min(1, "Người yêu cầu là bắt buộc"),
  sampleType: z.string().trim().min(1, "Loại mẫu là bắt buộc"),
  sampleCount: z.coerce.number().int().min(1, "Số lượng mẫu tối thiểu là 1"),
  customerName: z.string().optional(),
  department: z.string().optional(),
  purpose: z.string().optional(),
  dueDate: z.string().optional(),
  note: z.string().optional(),
  requestedTests: z.array(z.string()).optional(),
  methodIds: z.array(z.string()).optional(),
});

export const sampleAssignSchema = z.object({
  sampleId: z.string().min(1, "Chọn mẫu"),
  groups: z
    .array(
      z.object({
        id: z.string().optional(),
        parameterGroup: z.string().trim().min(1, "Nhóm chỉ tiêu là bắt buộc"),
        parameters: z.array(z.string().trim().min(1)).min(1, "Chọn ít nhất một chỉ tiêu"),
        departmentId: z.string().min(1, "Phòng ban phụ trách là bắt buộc"),
        managerId: z.string().min(1, "Quản lý phòng phụ trách là bắt buộc"),
        dueDate: z.string().min(1, "Deadline là bắt buộc"),
        status: z
          .enum([
            "waiting_assignment",
            "assigned",
            "department_received",
            "department_processing",
            "completed",
            "cancelled",
          ])
          .optional(),
        note: z.string().optional(),
      }),
    )
    .min(1, "Cần ít nhất một nhóm chỉ tiêu"),
});

export const sampleStorageSchema = z.object({
  sampleId: z.string().min(1),
  storageLocation: z.string().trim().min(1, "Vị trí lưu mẫu là bắt buộc"),
  preservationCondition: z.string().optional(),
  retentionUntil: z.string().optional(),
  storedBy: z.string().trim().min(1, "Người thực hiện lưu mẫu là bắt buộc"),
});

export const sampleDisposeSchema = z.object({
  sampleId: z.string().min(1),
  disposeReason: z.string().trim().min(1, "Lý do hủy mẫu là bắt buộc"),
  disposedBy: z.string().trim().min(1, "Người xác nhận hủy mẫu là bắt buộc"),
});

export type SampleReceiveInput = z.infer<typeof sampleReceiveSchema>;
export type SampleRequestInput = z.infer<typeof sampleRequestSchema>;
export type SampleAssignInput = z.infer<typeof sampleAssignSchema>;
export type SampleStorageInput = z.infer<typeof sampleStorageSchema>;
export type SampleDisposeInput = z.infer<typeof sampleDisposeSchema>;
