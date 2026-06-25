# PLAN — Hồ sơ HC: Gộp đánh giá + tự suy Pass/Fail

> **Trạng thái:** ✅ Đã implement — 2026-06-24  
> **Đã chốt với user:** 2026-06-24  
> **Đọc kèm:** [HANDOFF.md](./HANDOFF.md) § Pending · § Module Thiết bị

---

## Tóm tắt

- Bỏ dropdown **Kết quả** (Đạt/Không đạt) trên form Hồ sơ HC.
- Thêm **Phần đánh giá hiệu chuẩn** — bảng 1:1 với từng dòng kết quả/sai số.
- **Pass/Fail tự suy** khi lưu: so sánh `result` vs `standardResult` từng dòng (chuỗi, chưa tính ±).
- **Gộp** menu `/equipment/calibration-evaluations` vào form hồ sơ (ẩn sidebar, redirect URL cũ).

---

## UX form (2 khối)

1. **Phần hồ sơ hiệu chuẩn** — giữ: Thiết bị, Ngày HC, Số chứng nhận, dòng KQ HC | Sai số (+ Thêm dòng), Đơn vị HC, Chứng nhận, Ghi chú chung.
2. **Phần đánh giá hiệu chuẩn** — bảng theo dòng:

| KQ HC (readonly) | Sai số (readonly) | KQ quy chuẩn | Hành động KP | Người ĐG | Ngày ĐG | Ghi chú |
|----------------|-------------------|--------------|--------------|----------|---------|---------|

- Thêm/xóa dòng ở phần HC → sync cùng index (không nút thêm riêng ở đánh giá).
- Modal rộng hơn: `max-w-4xl`.

---

## Mô hình dữ liệu

Mở rộng JSON `CalibrationRecord.calibrationResults` — **không cần migration DB mới**:

```typescript
type CalibrationRecordRow = {
  result: string;           // Kết quả hiệu chuẩn
  error: string;            // Sai số
  standardResult: string;     // Kết quả theo quy chuẩn
  correctiveAction: string;   // Hành động khắc phục
  evaluatedBy: string;      // Người đánh giá
  evaluationDate: string;   // YYYY-MM-DD
  notes: string;            // Ghi chú dòng
};
```

Legacy rows thiếu field → parse default `""`.

---

## Logic server

File: `lib/calibration-results.ts` — thêm `deriveCalibrationResult(rows)`.

File: `lib/actions/equipment-calibration.ts`:

- `createCalibrationRecord` / `updateCalibrationRecord` dùng `deriveCalibrationResult` thay `parseResult(formData)`.
- History: `Hiệu chuẩn đạt` / `Hiệu chuẩn không đạt`.
- **Xóa** auto-create `PostCalibrationEvaluation` khi Fail (~dòng 281–289).

Quy tắc Pass/Fail:

```typescript
for (const row of rows) {
  const measured = row.result.trim();
  const standard = row.standardResult.trim();
  if (measured && standard && measured !== standard) return "Fail";
}
return "Pass";
```

---

## File cần sửa

| File | Việc làm |
|------|----------|
| `lib/calibration-results.ts` | Type mở rộng, parse/normalize, `deriveCalibrationResult` |
| `lib/actions/equipment-calibration.ts` | Auto Pass/Fail; bỏ PostCalibrationEvaluation auto-create |
| `types/index.ts` | Cập nhật type row / view |
| `lib/mappers/equipment.ts` | Map rows mở rộng |
| `components/equipment/CalibrationRecordsClient.tsx` | Form 2 section, bảng đánh giá, DetailDrawer, export |
| `components/Sidebar.tsx` | Bỏ "Đánh giá sau HC" |
| `app/equipment/calibration-evaluations/page.tsx` | `redirect("/equipment/calibration-records")` |
| `components/equipment/EquipmentBreadcrumb.tsx` | Bỏ entry không dùng |
| `HANDOFF.md` | Cập nhật sau khi xong |

**Không sửa** Prisma `PostCalibrationEvaluation` (dữ liệu cũ giữ; UI mới không tạo thêm).

---

## Checklist implement

- [x] Mở rộng `CalibrationRecordRow` + `deriveCalibrationResult`
- [x] Server actions: parse rows, auto Pass/Fail, bỏ auto-create evaluation
- [x] Form UI: bỏ dropdown Kết quả, bảng đánh giá, sync dòng
- [x] DetailDrawer + export + mapper/types
- [x] Ẩn menu, redirect route cũ
- [x] `npx tsc --noEmit`

## QA sau implement

- 2 dòng HC + quy chuẩn khớp → **Đạt**
- 1 dòng lệch quy chuẩn → **Không đạt**
- Sidebar không còn "Đánh giá sau HC"; URL cũ redirect OK
- Hồ sơ cũ (JSON thiếu field) vẫn sửa được

## Phạm vi không làm

- So sánh có tính sai số (±)
- Workflow phê duyệt QA/QC trên trang riêng
- Xóa bảng `PostCalibrationEvaluation` khỏi DB

---

## Prompt phiên sau

```
Đọc HANDOFF.md + PLAN-hc-evaluation-merge.md.
Implement gộp đánh giá HC (bỏ dropdown Đạt/Không đạt, bảng đánh giá, auto Pass/Fail, ẩn menu Đánh giá sau HC).
Chỉ đọc file liên quan — không scan toàn repo.
```
