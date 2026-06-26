# Lịch sử quá trình pha chế — ISO/IEC 17025

> **Trạng thái:** Phase 1–4 done · QA browser pass (2026-06-27)  
> **Cập nhật:** 2026-06-27 (Phase 4 commit · QA workflow + soft delete TG2 + export Excel)  
> **Quyết định:** Không tạo `PreparationBatch` trùng — mở rộng `PreparedChemical` / `PreparedStandard` / `PreparedStrain` + `PreparationHistory` + `PreparationAuditLog`  
> **Backfill:** Dữ liệu cũ → `workflowStatus = Approved`

---

## Implementation todos

| ID | Phase | Task | Trạng thái |
|----|-------|------|------------|
| `phase1-schema` | 1 | Migration: workflowStatus, Staff FKs, deletedAt, PreparationHistory, PreparationAuditLog + backfill Approved | done (`0d9518f`) |
| `phase1-services` | 1 | `lib/services/preparation-workflow.ts` + hook prepared-chemicals/standards/modules | done (`0d9518f`) |
| `phase2-ui-workflow` | 2 | Workflow UI: transitions, amendment dialog, soft delete, Staff pickers (3 Prepared*Client) | done (`0d9518f`) |
| `phase3-traceability` | 3 | `preparation-traceability.ts` + tree UI + reverse lookup catalog + `/preparation/[type]/[id]` | done (`aa305a5`) |
| `phase3-soft-delete-code` | 3 | `prepared-code-guard.ts` — archive mã ghost · release on create/update | done (`4bbcb0b`) |
| `phase4-reports` | 4 | `/preparation-history`, Excel export, prepared-excel/import, seed chain, HANDOFF | done |

---

## 1. Hiện trạng codebase

### Đã có — tận dụng

| Khái niệm | Trong repo |
|-----------|------------|
| Batch pha chế | `PreparedChemical`, `PreparedStandard`, `PreparedStrain` |
| Nguyên liệu | `PreparedChemicalIngredient`, `PreparedStandardComponent`, `PreparedStandardSolvent`; `PreparedStrain.sourceStrainId` |
| Chuỗi đa cấp | `PreparedStandardComponent.sourcePreparedStandardId` · seed `PSTD-0005 → PSTD-0006` trong `prisma/seed-data/links.ts` |
| Snapshot lot | `*Snapshot` trên ingredient |
| Audit cơ bản | `AuditLog` + `logActivity()` trong prepared-chemicals/standards; PreparedStrain dùng `audit()` trong `modules.ts` |
| Trừ tồn theo lot | `applyInventoryStockChange` + `stockLotId` |
| Excel | `lib/prepared-excel.ts`, `prepared-import.ts` |
| UI | `PreparedChemicalsClient`, `PreparedStandardsClient`, `PreparedStrainsClient` |

### Thiếu (ISO 17025)

- Workflow Draft → Prepared → Checked → Approved → Cancelled
- `checkedBy` / `approvedBy` trên HC/Chuẩn pha chế; không có lịch sử bất biến theo version
- Amendment sau duyệt (bắt buộc lý do) — pattern tham khảo `equipment-calibration.ts`, `equipment-disposal.ts`
- Soft delete (hiện hard delete)
- UI truy xuất: tab lịch sử, cây nguồn gốc, reverse lookup từ catalog gốc
- Báo cáo export lịch sử pha chế
- Đính kèm (`attachmentUrl`)

---

## 2. Database

### Enum mới

- `PreparationType`: CHEMICAL | STANDARD | STRAIN
- `PreparationWorkflowStatus`: Draft | Prepared | Checked | Approved | Cancelled
- `PreparationIngredientRole`: MAIN | SOLVENT | MEDIUM | ADDITIVE

### Mở rộng Prepared* (additive)

`workflowStatus` (default Approved), `preparedByStaffId`, `checkedByStaffId`, `approvedByStaffId`, `originalConcentration`, `finalConcentration`, `formula`, `equipmentUsed`, `preparationCondition`, `attachmentUrl`, `deletedAt`, `version`, `amendmentReason`.

Giữ field `status` hiện tại = **trạng thái hết hạn** (không rename).

### Model mới

**PreparationHistory** — snapshot bất biến (INSERT only): `preparationType`, `preparationId`, `version`, `event`, `snapshotJson`, `reason`, `performedBy`, `performedAt`.

**PreparationAuditLog** — ISO export: `action`, `beforeJson`, `afterJson`, `reason`, `performedBy`, `performedAt`.

Migration: `prisma/migrations/20260627_preparation_iso/migration.sql`  
Script: `scripts/backfill-preparation-history.ts`

---

## 3. Services & actions

| File mới | Vai trò |
|----------|---------|
| `lib/services/preparation-workflow.ts` | snapshot, history, FSM transition, amend, separation of duties |
| `lib/services/preparation-traceability.ts` | forward/reverse tree, `buildTraceTree` |
| `lib/prepared-code-guard.ts` | Kiểm tra trùng mã active · archive/release ghost codes |
| `lib/services/preparation-history-report.ts` | rows báo cáo 14 cột |
| `lib/actions/preparation-workflow.ts` | server actions transition/amend |
| `lib/preparation-workflow-labels.ts` | label VI |

**Sửa:** `prepared-chemicals.ts`, `prepared-standards.ts`, `modules.ts` (PreparedStrain), `prepared-import.ts`

**FSM:** Approved → chỉ `amendPreparation(reason)` hoặc cancel; bản ghi Draft mới trừ tồn khi chuyển Prepared (backfill Approved giữ stock như cũ).

---

## 4. UI & routes

| Route | Mục đích |
|-------|----------|
| `/preparation-history` | Báo cáo + filter + export Excel |
| `/preparation/[type]/[id]` | Chi tiết + timeline + cây truy xuất |

**Components:** `components/preparation/*` (DetailPanel, Timeline, TraceTree, HistoryReport, AmendmentReasonDialog, WorkflowStatusBadge)

**3 Prepared*Client:** tabs Chi tiết | Lịch sử | Truy xuất; workflow buttons; filter workflowStatus

**Catalog gốc:** section "Bản ghi pha chế phát sinh" trên Chemicals/Standards/MicrobialStrains clients

**Nav:** `preparation_history` trong `nav-permissions.ts` (24 → 25 quyền)

**PDF:** print view HTML (`@media print`); chưa thêm thư viện PDF

---

## 5. Rủi ro migration

| Rủi ro | Giảm thiểu |
|--------|------------|
| Hard delete mất lịch sử | Soft delete + block delete Approved |
| status vs workflowStatus | Label UI rõ |
| Stock vs Draft | Backfill Approved; Draft trừ khi Prepared |
| Turso prod | Migration idempotent; chạy thủ công |

---

## 6. Checklist test (tóm tắt)

- Migration + History v0 cho bản ghi cũ
- Draft → Prepared → Checked → Approved; amend có reason; cancel soft
- PSTD-0006 tree → PSTD-0005 → STD-0007
- Export Excel 14 cột; regression nhập kho/nhật ký/tem nhãn
- `npx tsc --noEmit` pass

---

## 7. Lộ trình 4 phase

1. **Foundation** — schema, backfill, workflow service, hook actions  
2. **Workflow UI** — transitions, amendment, Staff pickers, tabs  
3. **Traceability** — tree, reverse lookup, detail page ✅ (`aa305a5`)  
4. **Reports** — `/preparation-history`, Excel, import/export, seed, HANDOFF ✅

---

## File đọc trước khi implement

| Mục đích | File |
|----------|------|
| Schema pha chế | `prisma/schema.prisma` (Prepared*) |
| Actions HC pha chế | `lib/actions/prepared-chemicals.ts` |
| Actions Chuẩn pha chế | `lib/actions/prepared-standards.ts` |
| Actions Chủng pha chế | `lib/actions/modules.ts` |
| Audit pattern | `lib/audit.ts`, `lib/actions/equipment-calibration.ts` |
| Seed chain demo | `prisma/seed-data/links.ts` |
| Bàn giao | `HANDOFF.md` § Lịch sử pha chế ISO |
