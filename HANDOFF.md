# Lab Inventory LIMS — HANDOFF

> **Cập nhật:** 2026-06-25 (Auth/RBAC · Phân quyền sidebar · Turso/Vercel)  
> **Mục đích:** Dùng file này để mở chat mới — **không scan toàn repo**. Chỉ đọc file liên quan trực tiếp.

---

## 1. Current Status

### App có chạy được không

| Thành phần | Trạng thái |
|------------|------------|
| **Dev server** | ✅ http://localhost:3000 — kill PID trước `prisma generate` nếu EPERM |
| **Build production** | ✅ `npm run build` |
| **`/stock-in` — Nhập kho** | ✅ Identity → cùng mã · cảnh báo lot/đơn vị · quy đổi L/mL/µL |
| **`/prepared-chemicals`, `/prepared-standards`, `/prepared-strains`** | ✅ Chọn Lot khi ≥2 lot · trừ/hoàn theo lot · snapshot lot |
| **`/containers` → Thống kê** | ✅ Bảng gộp catalog + expand tồn theo lot |
| **`/usage-logs`** | ✅ Ghi theo vật tư gốc; tab Thống kê nhân viên |
| **`/chemicals`, `/standards`, `/microbial-strains`** | ✅ CRUD · bảng theo lot (Excel) · Chuẩn có CAS |
| **Inventory deduction** | ✅ Trừ theo `stockLotId` khi chọn lot; FIFO chỉ khi `ALLOW_FIFO_WITHOUT_LOT=true` |
| **TypeScript / Tests** | ✅ `tsc`, `test-stock-in.ts`, `test-inventory-stock.ts`, `test-stock-in-identity.ts`, `test-catalog-lot-rows.ts`, `test-equipment-schedule.ts`, `test-equipment-history-sync.ts`, **`test-equipment-e2e-qa.ts`** |
| **Module Thiết bị** (`/equipment/*`) | ✅ HC inline · BT/SC UX · Phụ kiện · upload đa file · subtitle EN · Dashboard gọn · **Lý lịch gallery ảnh + carousel** |
| **Lý lịch thiết bị** (`/equipment/history`) | ✅ Chọn sự kiện timeline → gallery ảnh (nguồn gốc + upload) · carousel prev/next · PDF link riêng |
| **Authentication & RBAC** | ✅ Login/logout · JWT session · middleware · **23 quyền theo sidebar** · Admin UI |
| **Deploy Vercel** | 🟡 Cần **Turso** + env trên Vercel — xem § Deploy Vercel |
| **Sidebar navigation** | ✅ 3 nhóm collapsible: **Hoá chất - Chuẩn - Chủng** (11) · **Thiết bị** (9) · **Quản trị** (3) |

**Menu vật tư** (nhóm **Hoá chất - Chuẩn - Chủng**, thứ tự gốc): Dashboard · Nhập kho · Hoá chất/Chuẩn/Chủng gốc · pha chế · Thống kê · Nhật ký · Báo cáo.  
**Route `/containers`** giữ URL, label menu **“Thống kê”**. **Nhập kho** → `/stock-in`.

### URL hiện tại

| Môi trường | URL |
|------------|-----|
| **Local dev** | http://localhost:3000 |
| **Vercel (prod)** | https://huutai-lims-m929.vercel.app — login cần Turso + env (§ Deploy Vercel) |

### Trạng thái Next.js

- **Version:** 16.2.9 (App Router, Turbopack dev)
- **Kiến trúc:** Server component fetch Prisma → client component → server actions
- **Server Actions upload:** `next.config.ts` → `experimental.serverActions.bodySizeLimit: "32mb"` (restart dev sau đổi config)
- **Module MVP cũ (localStorage):** `/solutions`, `/transactions`, `/inventory`, `/alerts`, `/` (mock dashboard)

### Trạng thái Prisma

- **Client:** ✅ Generated — restart dev server nếu `prisma generate` báo EPERM
- **Schema:** ✅ Valid
- **Migrations (14):**
  - `20260621050000_restore_chemical_standard_fields`
  - `20260621120000_prepared_standard_components`
  - `20260621180000_prepared_standard_component_source`
  - `20260621200000_prepared_chemical_form_fields`
  - `20260621210000_inventory_stock`
  - `20260621220000_prepared_storage_condition`
  - `20260621230000_usage_log_master_stock`
  - `20260622100000_stock_lot_and_stock_in` ← StockLot + StockInLog
  - `20260622110000_standard_cas_number` ← `Standard.casNumber`
  - `20260622120000_prepared_stock_lot` ← **`stockLotId` trên pha chế / chủng pha**
  - `20260623_equipment_module` ← **Equipment + HC/BT/SC/phụ tùng/thanh lý/lý lịch**
  - `20260624_calibration_record_results` ← **`CalibrationRecord.calibrationResults` JSON**
  - `20260624_spare_part_catalog_fields` ← **`SparePart.manufacturer`, `productCode`, `lotNumber`**
  - `20260625_auth_rbac` ← **User, Permission, UserPermission, Task**
- **Dev note:** `migrate deploy` có thể báo P3005 — dùng `db execute` migration SQL hoặc `db push`

### Trạng thái Database

- **Local:** SQLite — `prisma/dev.db` · `DATABASE_URL="file:./dev.db"`
- **Production (Vercel):** **Turso (libSQL)** — SQLite file local **không** chạy trên Vercel serverless
- **`.env` local:** `SESSION_SECRET`, `SESSION_MAX_AGE` — xem [`.env.example`](.env.example)
- **Optional:** `ALLOW_FIFO_WITHOUT_LOT=true` — FIFO khi **không** chọn lot (mặc định: false)
- **Seed:** `npx tsx prisma/seed.ts` hoặc `npm run db:seed`
- **Remote setup:** `npm run db:setup-remote` (push schema + seed lên Turso)

### Module đang hoạt động

| Module | Route | Ghi chú |
|--------|-------|---------|
| **Thống kê** | `/containers` | Gộp catalog; expand lot; Ghi sử dụng → prefill nhật ký |
| **Nhập kho** | `/stock-in` | Identity → cùng mã; auto-fill; cảnh báo lot/đơn vị |
| **Nhật ký** | `/usage-logs` | Tab Nhật ký + Thống kê nhân viên |
| Pha chế | `/prepared-chemicals`, `/prepared-standards`, `/prepared-strains` | Lot picker · trừ tồn theo lot |
| Catalog gốc | `/chemicals`, `/standards`, `/microbial-strains` | CRUD + 1 dòng/lot + export grouped |
| **Thiết bị** | `/equipment`, `/equipment/catalog`, … | 9 menu sidebar; xem § Module Thiết bị |
| **Quản trị** | `/admin/users`, `/admin/permissions`, `/admin/tasks` | Admin: users + phân quyền; LM/Analyst: giao việc |
| Báo cáo | `/reports`, `/` | ReportsClient / mock dashboard |
| **Login** | `/login` | Public; middleware redirect nếu chưa auth |

### Các lỗi còn tồn tại

| Vấn đề | Mức | Ghi chú |
|--------|-----|---------|
| **Lot nhập sai đơn vị (vd. mg vs mL)** | 🟡 | Có cảnh báo UI; kiểm tra/sửa lot trong DB nếu nhập nhầm |
| **Product code để trống ≠ bản ghi có code** | 🟡 | Không coi là trùng identity |
| **Purity/uncertainty theo lot** | 🟡 | Chỉ trên master; `StockLot` chưa có purity |
| **CAS DB cũ rỗng** | 🟡 | Backfill hoặc re-seed |
| **Usage log chưa chọn lot** | 🟡 | FIFO (nếu policy cho phép) |
| **Chưa UI InventoryTransaction / Staff** | 🟡 | Phase 3 |
| **Catalog CRUD sửa `quantity` trực tiếp** | 🟡 | Có thể lệch khi đã có StockLot |
| **Chưa commit** | 🟡 | Auth/RBAC + phân quyền sidebar + Turso — chờ user yêu cầu |
| **Vercel login lỗi 500** | 🟡 | Chưa set Turso + `SESSION_SECRET` trên Vercel — xem § Deploy Vercel |
| **Non-equipment actions chưa session guard** | 🟡 | Catalog/stock-in/usage-log vẫn không check session server-side (chỉ middleware route) |
| Dev server treo port 3000 / EPERM generate | 🟡 | `taskkill /F /IM node.exe` → `npx prisma generate` → `npm run dev` |
| Prisma stale client (Turbopack) | 🟢 | Fix `lib/db.ts` Proxy; restart dev nếu vẫn lỗi `findMany` undefined |
| DetailDrawer che ModalShell | 🟢 | Đã fix — `DetailDrawer` `z-[70]`, `ModalShell` `z-[80]`, `ConfirmDialog` `z-[90]` |
| Sidebar hydration warning (dev) | 🟡 | Next.js dev overlay; không chặn click sau fix z-index |

---

## 2. Completed Work

### Phiên này (2026-06-25) — Auth/RBAC + Phân quyền sidebar + Turso/Vercel

#### Authentication & RBAC ✅

- ✅ `bcryptjs` + `jose`; env `SESSION_SECRET`, `SESSION_MAX_AGE`
- ✅ Prisma: `User`, `Permission`, `UserPermission`, `Task` + migration `20260625_auth_rbac` + seed admin
- ✅ `lib/auth/*` — password, session JWT httpOnly, roles, permissions, guards
- ✅ `/login`, `/access-denied`, `middleware.ts`
- ✅ `SessionProvider` thay mock; Topbar logout; Sidebar lọc permission
- ✅ `/admin/users`, `/admin/permissions`, `/admin/tasks`
- ✅ Equipment server actions: `requireSessionCanEdit/Manage/Approve` (bỏ `FormData role`)
- ✅ Admin seed: `smartai0101@gmail.com` / `Admin@123456` · Demo: `*@demo.local` / `Demo@123456`
- **File:** `lib/auth/`, `lib/actions/auth.ts`, `components/SessionProvider.tsx`, `middleware.ts`, `app/login/`, `app/admin/*`, `components/admin/*`

#### Phân quyền 1-1 với sidebar (23 quyền) ✅

- ✅ Registry chung [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts) — 3 nhóm · 23 key tiếng Việt
- ✅ Sidebar + middleware + Admin UI dùng cùng registry
- ✅ Role defaults: LM/Analyst write materials+equipment+tasks; QA/QC read+reports; Viewer read-only
- ✅ Checkbox Admin = quyền **bổ sung** (role default không hiển thị tick)

#### Deploy Vercel — Turso adapter ✅ (code)

- ✅ `@libsql/client` + `@prisma/adapter-libsql` — [`lib/db.ts`](lib/db.ts) auto Turso khi có env
- ✅ JWT tách [`lib/auth/jwt.ts`](lib/auth/jwt.ts) — middleware không load Prisma
- ✅ Login try/catch — message rõ khi thiếu DB/SESSION_SECRET
- ✅ `npm run db:setup-remote` · [`.env.example`](.env.example)
- ⏳ **User cần:** tạo Turso DB · set env Vercel · chạy `db:setup-remote` · redeploy

### Phiên trước (2026-06-25) — Lý lịch gallery + QA E2E Thiết bị

#### Lý lịch thiết bị — Gallery ảnh + carousel ✅

- ✅ Click sự kiện timeline → highlight card · panel ảnh bên dưới
- ✅ Gộp ảnh: nguồn gốc (BT `attachmentPaths`, HC `certificatePath`, thanh lý `documentPath`) + upload lý lịch (`EquipmentAttachment`)
- ✅ Carousel fade/slide · prev/next · dots · counter · click mở full size
- ✅ Upload nhiều ảnh (auto-sync + Manual) · xóa ảnh upload (Admin/LM)
- ✅ PDF/DOC → link tải (`otherFiles`), không vào carousel
- **File:** [`lib/equipment-history-media.ts`](lib/equipment-history-media.ts), [`HistoryEventImageGallery.tsx`](components/equipment/HistoryEventImageGallery.tsx), [`EquipmentTimeline.tsx`](components/equipment/EquipmentTimeline.tsx), [`EquipmentHistoryClient.tsx`](components/equipment/EquipmentHistoryClient.tsx), [`lib/actions/equipment-history.ts`](lib/actions/equipment-history.ts), [`lib/services/equipment-history.ts`](lib/services/equipment-history.ts)

#### QA E2E Module Thiết bị (automated) ✅

- ✅ Script [`scripts/test-equipment-e2e-qa.ts`](scripts/test-equipment-e2e-qa.ts) — 18 assertions pass:
  - BT complete → sync `MaintenancePlan` + history
  - HC Pass/Fail + latest record / thiết bị
  - Ghi xuất phụ kiện → trừ tồn + history
  - Duyệt thanh lý → `Equipment.status = Disposed`
- ✅ `npx tsc --noEmit` pass

#### Plan Auth/RBAC ✅ đã implement — xem § Authentication & RBAC

### Phiên trước (2026-06-25) — Sidebar vật tư + UX Thiết bị

#### Sidebar — nhóm **Hoá chất - Chuẩn - Chủng**

- ✅ Collapsible giống **Thiết bị** (`materialsNavItems` + `materialsOpen` + `localStorage` key `materials-nav-open`)
- ✅ Gom **11 mục** vào dropdown (không còn link top-level):
  1. Dashboard (`/`)
  2. Nhập kho
  3. Hoá chất gốc · Chất chuẩn gốc · Chủng gốc vi sinh
  4. Hoá chất/Chuẩn/Chủng pha chế
  5. Thống kê · Nhật ký sử dụng · Báo cáo
- ✅ Active: `isMaterialsRoute()` — `/` chỉ match exact `pathname === "/"`
- **File:** [`components/Sidebar.tsx`](components/Sidebar.tsx)

#### Tiểu mục tiếng Anh module Thiết bị

- ✅ `EQUIPMENT_SUBTITLE = "Laboratory equipment"` trong [`lib/equipment-labels.ts`](lib/equipment-labels.ts)
- ✅ Truyền qua `EquipmentModuleShell` + Dashboard/History; bỏ default `"Thiết bị"`
- **Pattern:** giống `Reference materials` trên [`StandardsClient.tsx`](components/standards/StandardsClient.tsx)

#### Dashboard thiết bị — bỏ chi phí

- ✅ Xóa 3 thẻ chi phí năm + placeholder biểu đồ (luôn 0 đ — UI không nhập cost)
- ✅ Bỏ query aggregate cost trong [`lib/services/equipment-dashboard.ts`](lib/services/equipment-dashboard.ts)
- ✅ Giữ 8 thẻ trạng thái + 3 bảng HC/BT/phụ kiện thấp
- **File:** `EquipmentDashboardClient.tsx`, `types/index.ts`, `lib/equipment-labels.ts` (`DASHBOARD_LABELS`)

#### QA một phần (phiên này)

- ✅ `npx tsc --noEmit` pass (nhiều lần trong phiên)
- ✅ Nhật ký BT/SC: form 9 trường · upload multiple · cột Trạng thái (code + browser)
- ✅ Phụ kiện: SP-LAMP-D2 seed `manufacturer: Shimadzu VN`; bảng/drawer có Hãng/Mã/LOT
- ⏳ **Chưa E2E:** Xác nhận hoàn thành BT → sync plan + lý lịch (DB không có log mở lúc QA)

### Phiên trước — Nhật ký bảo trì/sửa chữa UX

- ✅ Nhãn **Ngày phát hiện** / **Ngày hoàn thành** (form + bảng + export); bỏ **Chi phí** khỏi UI
- ✅ Cột **Trạng thái** + nút **Xác nhận hoàn thành**; bỏ cột **Thao tác** (Xóa chuyển drawer)
- ✅ Upload **nhiều file** (`EquipmentFileUpload` multiple); fix FormData key `attachments`
- ✅ Labels `MAINTENANCE_LOG` trong [`lib/equipment-labels.ts`](lib/equipment-labels.ts)
- **File:** `MaintenanceLogsClient.tsx`, `EquipmentFileUpload.tsx`, `lib/actions/equipment-maintenance.ts`

### Phiên này — Upload Server Actions + menu Thiết bị

- ✅ Fix lỗi `Body exceeded 1 MB limit` — [`next.config.ts`](next.config.ts) `bodySizeLimit: "32mb"`
- ✅ Bỏ tab sidebar **Đề xuất sửa chữa**; `/equipment/repair-proposals` → redirect `/equipment/maintenance-logs`
- ✅ Đổi menu **Phụ tùng** → **Phụ kiện** (labels + UI; URL `/equipment/spare-parts` giữ nguyên)
- **File:** `Sidebar.tsx`, `EquipmentBreadcrumb.tsx`, `app/equipment/repair-proposals/page.tsx`, `SparePartsClient.tsx`, `EquipmentDashboardClient.tsx`

### Phiên này — Trường Phụ kiện (SparePart)

- ✅ Form/bảng/export: Mã · Tên · **Hãng sản xuất** · **Mã hàng** · **Số LOT** · Tồn kho · Tồn tối thiểu · Đơn vị · Ghi chú
- ✅ Bỏ **Đơn giá** / **NCC** khỏi UI (`unitPrice`/`supplier` giữ DB)
- ✅ Migration `20260624_spare_part_catalog_fields`; labels `SPARE_PART`
- **File:** `prisma/schema.prisma`, `SparePartsClient.tsx`, `lib/actions/equipment-spare-parts.ts`, `lib/mappers/equipment.ts`, `types/index.ts`, `prisma/seed.ts`

### Phiên trước — Gộp Người đánh giá (1 phiếu = 1 người)

- ✅ **Người đánh giá** cấp phiếu — grid ngang **Ngày đánh giá** | **Người đánh giá** (bỏ cột trong bảng dòng)
- ✅ Helper: `resolveRecordEvaluatedBy`, `applyRecordEvaluationMeta` (gộp date + evaluator)
- ✅ Drawer + export: người đánh giá hiển thị **một lần** ở cấp hồ sơ
- **File:** `lib/calibration-results.ts`, `components/equipment/CalibrationRecordsClient.tsx`

### Phiên này — HC UX: nhãn đầy đủ · ngày đánh giá chung · 1 dòng/thiết bị

- ✅ Đổi viết tắt → tên đầy đủ (HC/BT/SC/TB/ĐG/KP/KQ) — [`lib/equipment-labels.ts`](lib/equipment-labels.ts) + toàn module Thiết bị
- ✅ Cột **Đánh giá/Hành động khắc phục**; **1 ngày đánh giá / phiếu** (`resolveRecordEvaluationDate`)
- ✅ Bảng Hồ sơ hiệu chuẩn: **1 dòng / thiết bị** (hồ sơ mới nhất); drawer **lịch sử HC** xem/sửa/xóa
- **File:** `CalibrationRecordsClient.tsx`, `lib/calibration-results.ts`, `lib/equipment-labels.ts`, `Sidebar.tsx`, `components/equipment/*`

### Phiên trước — Gộp đánh giá Hồ sơ HC

- ✅ Bỏ dropdown Đạt/Không đạt; **Pass/Fail tự suy** (`deriveCalibrationResult` — so sánh `result` vs `standardResult`)
- ✅ Form 2 phần: hồ sơ HC + **bảng đánh giá inline** (1:1 với dòng KQ/sai số)
- ✅ JSON `calibrationResults` mở rộng: `standardResult`, `correctiveAction`, `evaluatedBy`, `evaluationDate`, `notes`
- ✅ Bỏ auto-create `PostCalibrationEvaluation` khi Fail
- ✅ Ẩn menu **Đánh giá sau HC**; `/equipment/calibration-evaluations` → redirect hồ sơ HC
- ✅ DetailDrawer + export Excel cập nhật
- **File:** `lib/calibration-results.ts`, `lib/actions/equipment-calibration.ts`, `CalibrationRecordsClient.tsx`, `Sidebar.tsx`, `types/index.ts`, `lib/mappers/equipment.ts`

### Phiên trước — QA Thiết bị · z-index · Hồ sơ HC kết quả/sai số

#### QA Module Thiết bị (một phần)

- ✅ 11 route `/equipment/*` → HTTP 200
- ✅ Danh mục: 7 dòng seed · DetailDrawer mở/đóng · Export Excel · Sửa → ModalShell
- ✅ Dashboard: widget trạng thái + 3 bảng HC/BT/phụ kiện (đã bỏ chi phí năm)
- ✅ Hồ sơ HC: modal form tương tác · cột/bảng/export cập nhật
- ✅ Lý lịch: chọn thiết bị · thêm sự kiện thủ công
- ✅ Automated: `tsc`, `test-equipment-schedule`, `test-equipment-history-sync` — pass
- ⏳ Chưa QA sâu E2E: HC Fail → đánh giá · BT complete → sync · SC ticket · xuất phụ tùng · duyệt thanh lý

#### Fix DetailDrawer z-index

- **Vấn đề:** Drawer và ModalShell cùng `z-[80]` — modal mở từ drawer khó click
- **Fix:** `components/DetailDrawer.tsx` → `z-[70]`; giữ `ModalShell` `z-[80]`, `ConfirmDialog` `z-[90]`

#### Hồ sơ HC — Kết quả hiệu chuẩn / Sai số (nhiều dòng)

Thay trường **Chi phí** + **Độ lệch** đơn lẻ bằng danh sách cặp `{ result, error }`:

- Form: ô trái **Kết quả hiệu chuẩn**, ô phải **Sai số**, nút **+ Thêm dòng**
- Bảng / export / DetailDrawer: cột **Kết quả hiệu chuẩn** (format `10 mg (±0.5); …`)
- DB: `CalibrationRecord.calibrationResults` JSON; `deviation` = chuỗi tóm tắt (legacy/search)
- Migration: `prisma/migrations/20260624_calibration_record_results/migration.sql`
- Helper: `lib/calibration-results.ts`
- **File:** `components/equipment/CalibrationRecordsClient.tsx`, `lib/actions/equipment-calibration.ts`, `lib/mappers/equipment.ts`, `types/index.ts`

**Áp dụng migration (dev):**

```powershell
npx prisma db execute --file prisma/migrations/20260624_calibration_record_results/migration.sql --schema prisma/schema.prisma
npx prisma generate
```

#### Chuẩn bị phiên sau — Plan gộp đánh giá HC ✅ đã implement

- Plan: [`PLAN-hc-evaluation-merge.md`](./PLAN-hc-evaluation-merge.md)

---

### Phiên trước — Module Thiết bị + fix Prisma cache

#### Module Thiết bị (4 giai đoạn)

- Prisma: 13 model Equipment (HC, BT, SC, phụ tùng, thanh lý, lý lịch, attachment)
- Migration: `prisma/migrations/20260623_equipment_module/migration.sql`
- Seed: 7 thiết bị mẫu (HPLC, UV-Vis, cân, ICP-OES…) + calibration plans + phụ tùng tồn thấp
- Sidebar collapsible **Thiết bị** — 11 route `/equipment/*`
- CRUD đầy đủ + Excel import/export (thư viện `xlsx`)
- Auto-sync: Hồ sơ HC → equipment + plan + lý lịch; Fail → draft đánh giá; BT complete → plan; phụ tùng → trừ tồn; duyệt thanh lý → `Disposed`
- Phân quyền: `canApprove` (Admin, Lab Manager, QA/QC)

#### Fix lỗi `Cannot read properties of undefined (reading 'findMany')`

**Triệu chứng:** Mở `/equipment/catalog`, `/equipment/history`, `/equipment/calibration-evaluations`… crash trên `db.equipmentHistoryEvent`, `db.postCalibrationEvaluation`, v.v.

**Nguyên nhân:** Turbopack/hot reload giữ **PrismaClient cũ** thiếu delegate model Equipment.

**Fix:** `lib/db.ts` — **Proxy lazy singleton**: mỗi lần gọi `db.*` kiểm tra toàn bộ model trong DMMF; thiếu delegate → tạo client mới.

**Restart chuẩn sau schema/generate:**

```powershell
taskkill /F /IM node.exe
npx prisma generate
npm run dev
```

**Verified:** `/equipment/catalog`, `/equipment/history` → HTTP 200 sau restart.

---

### Phiên trước — Lot pha chế + quy đổi µL + identity nhập kho

**Yêu cầu đã implement:**

| # | Yêu cầu | Trạng thái |
|---|---------|------------|
| 1 | ≥2 lot → dropdown Lot bắt buộc | ✅ `StockLotPicker` |
| 2 | Payload: masterId + stockLotId + lotNumber | ✅ |
| 3 | Snapshot đầy đủ lot | ✅ `lotNumberSnapshot`, `stockLotId` |
| 4 | Trừ tồn đúng lot (không FIFO mặc định) | ✅ `deductFromSpecificStockLot` |
| 5 | Báo cáo / displayLine theo lot đã dùng | ✅ |
| 6 | Lot không đủ → không lưu | ✅ |
| 7 | FIFO chỉ khi không chọn lot + `ALLOW_FIFO_WITHOUT_LOT=true` | ✅ |

**Migration:** `prisma/migrations/20260622120000_prepared_stock_lot/migration.sql`

- `PreparedChemicalIngredient.stockLotId`
- `PreparedStandardComponent.stockLotId`, `PreparedStandardSolvent.stockLotId`
- `PreparedStrain.sourceStockLotId`, `sourceLotNumberSnapshot`

**File chính:**

- `lib/resolve-stock-lot-selection.ts`, `lib/inventory-lot-policy.ts`
- `lib/stock-lot.ts` — `deductFromSpecificStockLot`, `restoreToStockLotById`
- `lib/inventory-stock.ts` — trừ theo `stockLotId` trên stock line
- `lib/actions/prepared-chemicals.ts`, `prepared-standards.ts`, `modules.ts`
- `components/StockLotPicker.tsx`
- `components/prepared-chemicals/PreparedChemicalsClient.tsx`
- `components/prepared-standards/PreparedStandardsClient.tsx`
- `components/modules/ModuleCrudClient.tsx` (field `stockLot`)

**Lỗi đã gặp:** `Unknown argument 'stockLotId'` → Prisma Client cũ; fix: `npx prisma generate` + restart dev.

#### Quy đổi đơn vị (mở rộng µL)

- `lib/inventory-units.ts` — **kg/g/mg** và **L/mL/µL** (µ và μ)
- Case **10 mg** vs kho **10 g** → 0.01 g → đủ tồn
- `describeUnitMismatch`, `unitsAreConvertible` — lỗi rõ khi khác nhóm (mass vs volume)

#### Nhập kho — identity bắt buộc cùng mã

**Quy tắc HC:** cùng tên + hãng + CAS + Product Code → **cùng một mã hoá chất**.

- Server: `ensureMaster` trong `lib/actions/stock-in.ts` — từ chối nếu mã form ≠ mã đã có
- `lib/services/stock-in-match.ts` — `codesMatch`, `identityCodeMismatchMessage`, `find*ByIdentity`
- `lib/stock-in-form-helpers.ts` — match trên dropdown options
- UI: auto-fill mã + gợi ý teal; **mã không bị khóa** (server vẫn validate)
- `createChemical` — cùng rule identity
- Chuẩn / Chủng — identity tương tự (name + hãng + product/ATCC)

**Lưu ý Product Code:** nếu bản ghi cũ có product code, form phải nhập đúng — để trống **không** coi là trùng.

#### Nhập kho — fix lỗi “cùng đơn vị không nhập được”

**Nguyên nhân thực tế:** Lot đã tồn tại với đơn vị khác (vd. lot `dgas` ghi **mg** trong DB, form nhập **mL**).

**Fix code:**

- `applyStockIn` — lỗi rõ khi lot cũ khác nhóm đơn vị
- `syncMasterQuantityFromLots` — báo lot conflict khi cộng tồn master
- `ChemicalStockInForm` — cảnh báo vàng khi Lot Number trùng lot có đơn vị khác
- `stock-in-options.ts` — thêm `unit`, `stockLots` trên master options

**Test:** `scripts/test-stock-in-identity.ts`

---

### Phiên trước — Catalog lot rows (Excel-style) + CAS chuẩn

- `lib/catalog-lot-rows.ts` — `expandCatalogToLotRows()`, `groupedCell()`
- Services load `stockLots`; UI HC/Chuẩn/Chủng 1 dòng/lot
- `Standard.casNumber` — migration `20260622110000_standard_cas_number`
- **File:** `components/chemicals/ChemicalsClient.tsx`, `StandardsClient.tsx`, `MicrobialStrainsClient.tsx`

### Phiên trước — Module Nhập kho (`/stock-in`)

- Model `StockLot`, `StockInLog`; backfill từ catalog
- `lib/stock-lot.ts` — `applyStockIn`, FIFO `deductFromStockLotsFifo`
- Tab Nhập + Lịch sử; form HC/Chuẩn/Chủng + auto-fill dropdown
- **Khóa nhận dạng master (không gồm lot):**
  - HC: name + casNumber + manufacturer + productCode
  - Chuẩn: name + manufacturer + productCode
  - Chủng: name + atccProductCode + manufacturer

### Tích lũy — Nhật ký, Thống kê, In tem, Inventory

- Nhật ký theo vật tư gốc; Staff; tab Thống kê nhân viên
- `lib/inventory-stock.ts` — lot-aware deduct/restore
- In tem: `lib/print-label.ts`, `PrintLabelButton`, `PrintLabelsDialog`

---

## 3. Label Printing Logic (tích lũy)

- `lib/print-label.ts` — `printPreparedLabel()`, `printPreparedLabelsBulk()`
- Logo: `public/sci-tech-logo.png` (watermark 10%)
- **Số tem mặc định hàng loạt:** 1 tem / mẫu

---

## 4. File triển khai (tham chiếu nhanh)

### Lot pha chế + inventory policy

| File | Mô tả |
|------|-------|
| `prisma/migrations/20260622120000_prepared_stock_lot/migration.sql` | stockLotId columns |
| `lib/resolve-stock-lot-selection.ts` | Validate lot khi pha |
| `lib/inventory-lot-policy.ts` | `ALLOW_FIFO_WITHOUT_LOT` |
| `lib/stock-lot.ts` | applyStockIn, deduct/restore by lot ID |
| `lib/inventory-units.ts` | kg/g/mg, L/mL/µL, mismatch messages |
| `lib/inventory-stock.ts` | `applyInventoryStockChange` per lot |
| `components/StockLotPicker.tsx` | Shared lot picker UI |

### Nhập kho + identity

| File | Mô tả |
|------|-------|
| `lib/services/stock-in-match.ts` | Identity match, code enforcement |
| `lib/stock-in-form-helpers.ts` | Client option matching |
| `lib/actions/stock-in.ts` | `createStockIn`, `ensureMaster` |
| `lib/stock-in-fields.ts` | Validation messages |
| `components/stock-in/ChemicalStockInForm.tsx` | Identity auto-fill, lot warning |
| `components/stock-in/StandardStockInForm.tsx` | Identity auto-fill (chuẩn) |
| `components/stock-in/StrainStockInForm.tsx` | Identity auto-fill (chủng) |
| `lib/services/stock-in-options.ts` | Dropdown + stockLots |

### Catalog lot rows + CAS

| File | Mô tả |
|------|-------|
| `lib/catalog-lot-rows.ts` | Expand master → 1 row/lot |
| `lib/map-stock-lot.ts` | Map StockLot → StockLotView |
| `lib/services/chemicals.ts`, `standards.ts`, `microbial-strains.ts` | + stockLots |

### Module Thiết bị + DB

| File | Mô tả |
|------|-------|
| `lib/db.ts` | Proxy Prisma singleton — bust cache khi thiếu delegate (Turbopack) |
| `lib/calibration-results.ts` | Parse/format JSON rows; `deriveCalibrationResult`; `resolve/applyRecordEvaluationMeta` |
| `lib/equipment-labels.ts` | Nhãn đầy đủ module Thiết bị (không viết tắt) |
| `lib/equipment-*.ts`, `lib/excel.ts` | Infra HC/BT schedule, upload, history, auth, Excel xlsx |
| `lib/mappers/equipment.ts` | View types |
| `lib/services/equipment-*.ts` | Server fetch |
| `lib/actions/equipment-*.ts` | CRUD + auto-sync |
| `components/equipment/*` | 11 client pages + shared UI |
| `app/equipment/**/page.tsx` | Routes |
| `components/Sidebar.tsx` | Nhóm **Hoá chất - Chuẩn - Chủng** (11 mục) + **Thiết bị** collapsible |
| `components/RoleProvider.tsx` | `canApprove` |
| `package.json` | dependency `xlsx` |

### Scripts test

| Script | Mô tả |
|--------|-------|
| `scripts/test-stock-in.ts` | Stock-in flow |
| `scripts/test-inventory-stock.ts` | Unit conversion + stock flow |
| `scripts/test-stock-in-identity.ts` | Identity + code rules |
| `scripts/test-catalog-lot-rows.ts` | Catalog expand rows |
| `scripts/seed-multi-lot-qa.ts` | Multi-lot QA samples |
| `scripts/backfill-standard-cas.ts` | Backfill CAS chuẩn |
| `scripts/test-equipment-schedule.ts` | Schedule status Green/Yellow/Red |
| `scripts/test-equipment-history-sync.ts` | History append + dedupe |

---

## 5. Database Changes

### Migration `20260623_equipment_module`

13 bảng: `Equipment`, `CalibrationPlan`, `CalibrationRecord`, `PostCalibrationEvaluation`, `MaintenancePlan`, `MaintenanceLog`, `RepairProposal`, `SparePart`, `EquipmentSparePartLink`, `SparePartUsage`, `EquipmentDisposal`, `EquipmentHistoryEvent`, `EquipmentAttachment`

**Áp dụng (dev):**

```powershell
npx prisma db execute --file prisma/migrations/20260623_equipment_module/migration.sql --schema prisma/schema.prisma
npx prisma generate
npx tsx prisma/seed.ts
```

Hoặc: `npx prisma db push` (đã dùng trong dev hiện tại).

### Migration `20260624_calibration_record_results`

- `CalibrationRecord.calibrationResults` JSON NOT NULL DEFAULT `[]` — mảng `{ result, error }`
- Cột `cost` giữ DB (legacy); UI không nhập · Dashboard TB không hiển thị chi phí
- Backfill legacy: đọc `deviation` cũ → 1 dòng kết quả nếu `calibrationResults` rỗng

**Áp dụng (dev):**

```powershell
npx prisma db execute --file prisma/migrations/20260624_calibration_record_results/migration.sql --schema prisma/schema.prisma
npx prisma generate
```

### Migration `20260624_spare_part_catalog_fields`

- `SparePart.manufacturer`, `productCode`, `lotNumber` TEXT NOT NULL DEFAULT `''`
- Backfill: `manufacturer` ← `supplier` nếu có
- `unitPrice`, `supplier` giữ nguyên (ẩn UI)

**Áp dụng (dev):**

```powershell
npx prisma db execute --file prisma/migrations/20260624_spare_part_catalog_fields/migration.sql --schema prisma/schema.prisma
npx prisma generate
```

### Migration `20260622120000_prepared_stock_lot`

| Bảng | Cột |
|------|-----|
| `PreparedChemicalIngredient` | `stockLotId` |
| `PreparedStandardComponent` | `stockLotId` |
| `PreparedStandardSolvent` | `stockLotId` |
| `PreparedStrain` | `sourceStockLotId`, `sourceLotNumberSnapshot` |

### Migration `20260622110000_standard_cas_number`

- `Standard.casNumber` TEXT NOT NULL DEFAULT ''

### Migration `20260622100000_stock_lot_and_stock_in`

- `StockLot`, `StockInLog`, `InventoryTransaction.stockLotId`
- Backfill StockLot từ catalog

**Áp dụng migration prepared_stock_lot (dev):**

```powershell
npx prisma db execute --file prisma/migrations/20260622120000_prepared_stock_lot/migration.sql --schema prisma/schema.prisma
npx prisma generate
```

**Lưu ý:** `master.quantity` / `master.lot` là cache — sync từ sum StockLot. Nhiều lot → `master.lot = "Nhiều lot"` (UI expand từ `StockLot`).

---

## 6. Phân quyền (session + RBAC)

**UI client:** `canEdit` / `canManage` / `canApprove` từ [`roleCapabilities()`](lib/auth/roles.ts) theo role session.  
**Route/middleware:** 23 permission keys — [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts).  
**Admin override:** tick thêm quyền bổ sung trên `/admin/permissions` (`user_permissions`).

| Role | Nhập kho / CRUD catalog | Ghi nhật ký | Xoá | Duyệt (`canApprove`) | Xem audit/báo cáo |
|------|-------------------------|-------------|-----|----------------------|-------------------|
| Viewer | Không | Không | Không | Không | Có (giới hạn) |
| Analyst | Có (`canEdit`) | Có | Không | Không | Có |
| QA/QC | Không sửa catalog gốc* | Có | Không | Có (thanh lý, đánh giá HC) | Có |
| Lab Manager, Admin | Có | Có | Có (`canManage`) | Có | Có |

\* Analyst/LM/Admin sửa catalog; QA/QC chủ yếu duyệt trên module Thiết bị.

---

## 7. Known Issues

| Bug | Mức | Ghi chú |
|-----|-----|---------|
| Lot nhập sai đơn vị (mg vs mL) | 🟡 | Cảnh báo UI; có thể cần sửa lot trong DB |
| Product code trống ≠ bản ghi có code | 🟡 | Không match identity |
| Purity/uncertainty theo lot | 🟡 | Chỉ trên master |
| CAS DB cũ rỗng | 🟡 | Backfill / re-seed |
| Usage log chưa chọn lot cụ thể | 🟡 | FIFO nếu policy cho phép |
| Catalog CRUD sửa quantity trực tiếp | 🟡 | Lệch khi đã có StockLot |
| Chưa UI InventoryTransaction / Staff | 🟡 | Phase 3 |
| Container vs catalog tồn kho | 🟡 | Legacy; luồng mới dùng StockLot |
| Chưa commit phiên gần đây | 🟡 | Thiết bị + HC gộp đánh giá + HC UX + db proxy |
| Prisma stale client (Turbopack) | 🟢 | Fix `lib/db.ts` Proxy — restart dev nếu tái phát |
| DetailDrawer che ModalShell | 🟢 | `z-[70]` / `z-[80]` / `z-[90]` |

---

## 8. Pending Tasks

### Ưu tiên 0 — Deploy Vercel + Turso 🟡 (phiên tiếp theo)

- [ ] Tạo database tại https://turso.tech
- [ ] Local: set `TURSO_*` + `DATABASE_URL=libsql://...?authToken=...` → `npm run db:setup-remote`
- [ ] Vercel env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET` (≥32 chars)
- [ ] Redeploy · QA login prod `smartai0101@gmail.com` / `Admin@123456`

### Ưu tiên 0 — Authentication & RBAC ✅ (đã implement)

- [x] `bcryptjs` + `jose`; env `SESSION_SECRET`
- [x] Prisma User/Permission/UserPermission/Task + migration + seed
- [x] `lib/auth/*` — session, guards, permissions
- [x] `/login`, `/access-denied`, `middleware.ts`
- [x] `SessionProvider`; Topbar logout; Sidebar lọc permission (23 key)
- [x] `/admin/users`, `/admin/permissions`, `/admin/tasks`
- [x] Equipment actions: session guards (bỏ `FormData role`)
- [ ] QA manual: login/logout · Viewer không Sửa · revoke 1 quyền → sidebar ẩn · task flow

### Ưu tiên 1 — QA Auth/RBAC trên prod

- [ ] Login/logout Vercel sau Turso setup
- [ ] Tick bổ sung `chemicals` trên Viewer → thấy Hoá chất gốc
- [ ] Analyst không vào `/admin/users` (middleware → access-denied)
- [ ] LM giao task · Analyst cập nhật status

### Ưu tiên 0 — Lý lịch gallery ✅ (đã implement)

- [x] Timeline selectable + gallery carousel
- [x] Gộp ảnh nguồn + upload `EquipmentAttachment`
- [x] Upload/xóa ảnh · labels `HISTORY`

### Ưu tiên 0 — Hồ sơ HC UX ✅ (đã implement)

- [x] Gộp đánh giá inline + auto Pass/Fail ([PLAN-hc-evaluation-merge.md](./PLAN-hc-evaluation-merge.md))
- [x] Nhãn đầy đủ module Thiết bị (`lib/equipment-labels.ts`)
- [x] 1 dòng / thiết bị + drawer lịch sử HC
- [x] 1 ngày đánh giá + 1 người đánh giá / phiếu (`applyRecordEvaluationMeta`)

### Ưu tiên 0 — Tiểu mục tiếng Anh trang Thiết bị ✅ (đã implement)

- [x] `EQUIPMENT_SUBTITLE` → `"Laboratory equipment"`
- [x] `EquipmentModuleShell` — bỏ default `"Thiết bị"`
- [x] Tất cả equipment clients + Dashboard/History

### Ưu tiên 0 — Sidebar vật tư ✅ (đã implement)

- [x] Dropdown **Hoá chất - Chuẩn - Chủng** — 11 sub-items, Dashboard đầu list
- [x] Nhóm **Thiết bị** giữ nguyên bên dưới

### Ưu tiên 0 — Dashboard thiết bị gọn ✅ (đã implement)

- [x] Bỏ thẻ chi phí + placeholder biểu đồ
- [x] Bỏ aggregate cost khỏi service/types

### Ưu tiên 1 — QA Nhật ký BT/SC + Phụ kiện

- [x] `/equipment/maintenance-logs` — form · upload multiple · cột Trạng thái
- [x] `/equipment/spare-parts` — Hãng/Mã/LOT seed SP-LAMP-D2
- [x] **E2E automated** BT complete sync · xuất phụ kiện · duyệt thanh lý — [`test-equipment-e2e-qa.ts`](scripts/test-equipment-e2e-qa.ts)
- [ ] **E2E browser** Xác nhận hoàn thành BT trên UI seed (DB có thể thiếu MaintenancePlan)

### QA Hồ sơ hiệu chuẩn (ưu tiên 2 — manual)

- [ ] EQ-BAL-001 có ≥2 hồ sơ → bảng **1 dòng**; drawer liệt kê đủ lịch sử
- [ ] Tạo/sửa HC: 2 dòng KQ + quy chuẩn khớp → **Đạt**; 1 dòng lệch → **Không đạt**
- [ ] Ngày + người đánh giá nhập 1 lần → lưu/mở lại/export đúng
- [ ] Sidebar/breadcrumb/form không còn viết tắt HC/ĐG/KP/TB
- [ ] `/equipment/calibration-evaluations` redirect OK
- [ ] Tạo Hồ sơ HC → `CalibrationPlan` + `Equipment` + lý lịch cập nhật

### QA Module Thiết bị (ưu tiên 3)

- [x] 11 route `/equipment/*` load HTTP 200
- [x] Danh mục: drawer, Export Excel, modal Sửa
- [x] Dashboard: widget trạng thái + 3 bảng (đã bỏ chi phí năm)
- [x] Hồ sơ HC: form đánh giá inline · auto Pass/Fail · 1 dòng/thiết bị
- [x] Nhật ký BT/SC UX (nhãn, trạng thái, đa file, bỏ chi phí UI)
- [x] Phụ kiện: trường manufacturer/productCode/lotNumber
- [ ] CRUD Danh mục import Excel (~10 dòng) end-to-end
- [x] Hoàn thành Nhật ký bảo trì → sync plan + lý lịch (automated E2E)
- [ ] ~~Đề xuất SC sidebar~~ → đã bỏ menu; backend `RepairProposal` giữ DB
- [x] Ghi xuất phụ kiện → trừ tồn + lý lịch (automated E2E)
- [x] Duyệt thanh lý → `Equipment.status = Disposed` (automated E2E)

### QA pha chế + Lot (ưu tiên 2)

- [ ] HC pha / Chuẩn pha / Chủng pha — master ≥2 lot → dropdown Lot bắt buộc
- [ ] Trừ tồn đúng lot đã chọn (không FIFO khi đã chọn lot)
- [ ] Lot không đủ → không lưu, message `Lot X: cần … còn …`
- [ ] 10 mg từ kho 10 g — lưu thành công
- [ ] Chi tiết phiếu / CSV — lot đã dùng hiển thị đúng

### QA nhập kho (ưu tiên 3)

- [ ] Identity HC → auto mã; mã khác → server từ chối
- [ ] Lot mới + mL; lot cũ cùng đơn vị → cộng đúng
- [ ] Lot cũ khác nhóm đơn vị → cảnh báo vàng + lỗi rõ
- [ ] Chuẩn / Chủng — identity tương tự
- [ ] Tab Lịch sử + export CSV

### QA catalog + dữ liệu

- [ ] Multi-lot catalog rows + cột CAS chuẩn
- [ ] Backfill `casNumber` (`scripts/backfill-standard-cas.ts` hoặc seed)
- [ ] `scripts/seed-multi-lot-qa.ts` — STD-0002, CHEM-0001

### QA nhật ký & thống kê

- [ ] USE → SL giảm ở Thống kê / catalog
- [ ] Prefill Ghi sử dụng từ Thống kê
- [ ] Tab Thống kê `/usage-logs` — lọc, export CSV
- [ ] Xoá nhật ký (Admin/LM) → hoàn tồn đúng

### Phase 3 & tích lũy

- [x] Fix DetailDrawer z-index (`z-[70]` dưới ModalShell)
- [ ] UI quản lý Staff (Admin)
- [ ] UI InventoryTransaction
- [ ] Chặn/warning edit `quantity` catalog khi đã có StockLot
- [ ] UI chọn lot trên nhật ký sử dụng
- [ ] Purity theo lot trên `StockLot` (nếu cần đúng Excel)
- [ ] QA in tem máy in / PDF Scale 100%
- [ ] Deprecate Container (nếu user đồng ý)

### Automated

```powershell
npx tsc --noEmit
npx tsx scripts/test-stock-in.ts
npx tsx scripts/test-inventory-stock.ts
npx tsx scripts/test-stock-in-identity.ts
npx tsx scripts/test-catalog-lot-rows.ts
npx tsx scripts/test-equipment-schedule.ts
npx tsx scripts/test-equipment-history-sync.ts
npx tsx scripts/test-equipment-e2e-qa.ts
npm run build
# Turso prod (một lần): npm run db:setup-remote
```

---

## 9. Restart Instructions

```powershell
cd C:\Users\admin\Documents\Codex\2026-06-16\lab-inventory-lims

taskkill /F /IM node.exe
npm install
npx prisma db execute --file prisma/migrations/20260623_equipment_module/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260624_calibration_record_results/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260624_spare_part_catalog_fields/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260622120000_prepared_stock_lot/migration.sql --schema prisma/schema.prisma
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

URL: **http://localhost:3000**

### Nếu `migrate deploy` báo P3005 (dev)

```powershell
npx prisma db execute --file prisma/migrations/20260622100000_stock_lot_and_stock_in/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260622110000_standard_cas_number/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260622120000_prepared_stock_lot/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260623_equipment_module/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260624_calibration_record_results/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260624_spare_part_catalog_fields/migration.sql --schema prisma/schema.prisma
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### Port 3000 bị chiếm / EPERM prisma generate

```powershell
taskkill /F /IM node.exe
netstat -ano | findstr :3000
taskkill /F /PID <PID>
npx prisma generate
npm run dev
```

---

## 10. Recommended Next Prompt

```
Đọc HANDOFF.md (§ Deploy Vercel).
Hoàn tất Turso + env Vercel, QA login production.
Hoặc: QA browser E2E Thiết bị · QA pha chế/lot · QA nhập kho.
Chỉ đọc file liên quan — không scan toàn repo.
```

**Turso setup nhanh:**

```powershell
$env:TURSO_DATABASE_URL="libsql://YOUR-DB.turso.io"
$env:TURSO_AUTH_TOKEN="YOUR_TOKEN"
$env:DATABASE_URL="libsql://YOUR-DB.turso.io?authToken=YOUR_TOKEN"
$env:SESSION_SECRET="random-32-chars-minimum"
npm run db:setup-remote
```

**Admin seed:** `smartai0101@gmail.com` / `Admin@123456`

---

## Sidebar (cấu trúc hiện tại)

| Nhóm | localStorage | Sub-items |
|------|--------------|-----------|
| **Hoá chất - Chuẩn - Chủng** | `materials-nav-open` | 11 — xem §1 |
| **Thiết bị** | `equipment-nav-open` | 9 — xem § Module Thiết bị |
| **Quản trị** | `admin-nav-open` | 3 — Người dùng · Phân quyền · Giao việc |

**File:** [`components/Sidebar.tsx`](components/Sidebar.tsx) — nav từ [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts).

---

## Module Thiết bị (`/equipment/*`)

### Routes (sidebar nhóm **Thiết bị**)

| Route | Menu |
|-------|------|
| `/equipment` | Dashboard tổng hợp |
| `/equipment/catalog` | Danh mục thiết bị |
| `/equipment/history` | Lý lịch thiết bị |
| `/equipment/calibration-plans` | Kế hoạch hiệu chuẩn |
| `/equipment/calibration-records` | Hồ sơ hiệu chuẩn (+ đánh giá inline) |
| `/equipment/calibration-evaluations` | Redirect → `/equipment/calibration-records` |
| `/equipment/maintenance-plans` | Kế hoạch bảo trì |
| `/equipment/maintenance-logs` | Nhật ký bảo trì/sửa chữa |
| `/equipment/repair-proposals` | Redirect → `/equipment/maintenance-logs` (không còn sidebar) |
| `/equipment/spare-parts` | Phụ kiện |
| `/equipment/disposal` | Thanh lý |

### Prisma models mới

`Equipment`, `CalibrationPlan`, `CalibrationRecord`, `PostCalibrationEvaluation`, `MaintenancePlan`, `MaintenanceLog`, `RepairProposal`, `SparePart`, `EquipmentSparePartLink`, `SparePartUsage`, `EquipmentDisposal`, `EquipmentHistoryEvent`, `EquipmentAttachment`

Schema: `prisma/schema.prisma` · DB sync: `npx prisma db push` hoặc migration `20260623_equipment_module`

### Fix Prisma stale client

- File: `lib/db.ts` — Proxy lazy singleton, kiểm tra mọi delegate DMMF
- Lỗi điển hình: `db.equipmentHistoryEvent.findMany` / `db.postCalibrationEvaluation.findMany` undefined
- Cách xử lý: `taskkill /F /IM node.exe` → `npx prisma generate` → `npm run dev`

### File chính

| Layer | Path |
|-------|------|
| DB | `lib/db.ts` |
| Infra | `lib/equipment-schedule.ts`, `lib/equipment-upload.ts`, `lib/equipment-history.ts`, `lib/equipment-auth.ts`, `lib/excel.ts`, `lib/equipment-fields.ts` |
| Mappers | `lib/mappers/equipment.ts` |
| Services | `lib/services/equipment-*.ts` |
| Actions | `lib/actions/equipment-*.ts` |
| UI | `components/equipment/*`, `components/ExcelImportDialog.tsx` |
| Pages | `app/equipment/**/page.tsx` |

### Phân quyền (session + RBAC)

> **Session thật** — JWT cookie · middleware · 23 quyền sidebar. Plan: [PLAN-auth-rbac.md](./PLAN-auth-rbac.md)

- [`SessionProvider`](components/SessionProvider.tsx): role từ session; `canEdit`/`canManage`/`canApprove` từ `roleCapabilities()`
- Equipment actions: `requireSessionCanEdit/Manage/Approve` qua [`lib/equipment-auth.ts`](lib/equipment-auth.ts)
- Sidebar: lọc theo `hasPermission(key)` từ [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts)

### Luồng tự động

- **Hồ sơ HC** → cập nhật `Equipment` + `CalibrationPlan` + `EquipmentHistoryEvent`; Pass/Fail **tự suy** từ so sánh KQ HC vs quy chuẩn; đánh giá inline trong JSON `calibrationResults`
- **Hoàn thành nhật ký BT** → sync `MaintenancePlan` + history
- **Ghi xuất phụ kiện** → trừ `stockQty` + history
- **Duyệt thanh lý** → `Equipment.status = Disposed`

### Hồ sơ HC — Form đánh giá (trạng thái hiện tại)

**JSON `calibrationResults` mỗi dòng:**

| Field | UI |
|-------|-----|
| `result`, `error` | Phần hồ sơ — nhiều dòng KQ / sai số |
| `standardResult`, `correctiveAction`, `notes` | Bảng đánh giá — theo dòng |
| `evaluationDate`, `evaluatedBy` | **Cấp phiếu** — 1 ngày + 1 người (sync mọi dòng khi lưu) |

**Helpers** [`lib/calibration-results.ts`](lib/calibration-results.ts): `deriveCalibrationResult` · `resolveRecordEvaluationDate` / `resolveRecordEvaluatedBy` · `applyRecordEvaluationMeta`

**Bảng list:** group `equipmentId` → 1 dòng/thiết bị; drawer = lịch sử + chi tiết. **Nhãn:** [`lib/equipment-labels.ts`](lib/equipment-labels.ts).

Legacy: `PostCalibrationEvaluation` trong DB; UI mới không tạo thêm; `/equipment/calibration-evaluations` → redirect.

### Hồ sơ HC — Kết quả hiệu chuẩn / Sai số

| Layer | Path |
|-------|------|
| Schema | `CalibrationRecord.calibrationResults` Json, `deviation` (tóm tắt) |
| Helper | `lib/calibration-results.ts` |
| Actions | `lib/actions/equipment-calibration.ts` — parse JSON từ FormData |
| UI | `components/equipment/CalibrationRecordsClient.tsx` |
| Migration | `prisma/migrations/20260624_calibration_record_results/migration.sql` |

Form: nhiều dòng `{ result, error }`. Legacy `deviation` → 1 dòng khi `calibrationResults` rỗng.

**Plans đã implement:** [PLAN-hc-evaluation-merge.md](./PLAN-hc-evaluation-merge.md) · HC UX nhãn + 1 dòng/TB · gộp người đánh giá.

### Nhật ký bảo trì/sửa chữa — UX hiện tại

| Layer | Path |
|-------|------|
| Labels | `MAINTENANCE_LOG` trong [`lib/equipment-labels.ts`](lib/equipment-labels.ts) |
| UI | [`MaintenanceLogsClient.tsx`](components/equipment/MaintenanceLogsClient.tsx) |
| Upload | [`EquipmentFileUpload.tsx`](components/equipment/EquipmentFileUpload.tsx) (`multiple`); FormData key `attachments` |
| Actions | [`lib/actions/equipment-maintenance.ts`](lib/actions/equipment-maintenance.ts) |

- Bảng: Ngày phát hiện · Mô tả · **Trạng thái** (badge + Xác nhận hoàn thành) · Ngày hoàn thành — **không** cột Thao tác / Chi phí
- `completeMaintenanceLog` → sync `MaintenancePlan` + `EquipmentHistoryEvent`
- `cost` giữ DB; UI mới không nhập (default 0)

### Phụ kiện (SparePart) — catalog fields

| Cột DB | Nhãn UI |
|--------|---------|
| `code`, `name` | Mã / Tên phụ kiện |
| `manufacturer` | Hãng sản xuất |
| `productCode` | Mã hàng |
| `lotNumber` | Số LOT |
| `stockQty`, `minQty`, `unit`, `notes` | Tồn kho · Tồn tối thiểu · Đơn vị · Ghi chú |

Migration: `prisma/migrations/20260624_spare_part_catalog_fields/migration.sql`  
Labels: `SPARE_PART` · UI: [`SparePartsClient.tsx`](components/equipment/SparePartsClient.tsx) · Actions: [`lib/actions/equipment-spare-parts.ts`](lib/actions/equipment-spare-parts.ts)

Legacy: `unitPrice`, `supplier` giữ DB — ẩn khỏi form.

### Lý lịch thiết bị — Gallery ảnh ✅

| Layer | Path |
|-------|------|
| Media resolver | [`lib/equipment-history-media.ts`](lib/equipment-history-media.ts) — gộp nguồn + `EquipmentAttachment` |
| Service | [`lib/services/equipment-history.ts`](lib/services/equipment-history.ts) — batch load media |
| Actions | [`lib/actions/equipment-history.ts`](lib/actions/equipment-history.ts) — `addHistoryEventImages`, `deleteHistoryEventImage` |
| UI | [`EquipmentTimeline.tsx`](components/equipment/EquipmentTimeline.tsx), [`HistoryEventImageGallery.tsx`](components/equipment/HistoryEventImageGallery.tsx), [`EquipmentHistoryClient.tsx`](components/equipment/EquipmentHistoryClient.tsx) |
| Labels | `HISTORY` trong [`lib/equipment-labels.ts`](lib/equipment-labels.ts) |
| Types | `HistoryEventMediaItem`, `images`/`otherFiles` trên `EquipmentHistoryEventView` |

- `EquipmentAttachment`: `entityType = "EquipmentHistoryEvent"`, `entityId = event.id`
- Không migration mới — tái dùng bảng `EquipmentAttachment` có sẵn

### UI overlay z-index

| Component | z-index |
|-----------|---------|
| `DetailDrawer` | `z-[70]` |
| `ModalShell` | `z-[80]` |
| `ConfirmDialog` | `z-[90]` |
| Toast | `z-[100]` |

### Seed & tests

```powershell
npx tsx prisma/seed.ts          # 7 thiết bị mẫu + 1 phụ kiện tồn thấp (SP-LAMP-D2)
npx tsx scripts/test-equipment-schedule.ts
npx tsx scripts/test-equipment-history-sync.ts
npx tsx scripts/test-equipment-e2e-qa.ts
npm run build
```

---

## Authentication & RBAC ✅ (đã implement)

> Plan gốc: [PLAN-auth-rbac.md](./PLAN-auth-rbac.md)

| Thành phần | Trạng thái |
|------------|------------|
| Login / Logout | ✅ `/login` · server action · JWT cookie `lims_session` |
| `middleware.ts` | ✅ Route → 23 permission keys |
| Models `User`, `Permission`, `UserPermission`, `Task` | ✅ migration `20260625_auth_rbac` |
| `/admin/users`, `/admin/permissions`, `/admin/tasks` | ✅ |
| `SessionProvider` | ✅ thay mock; [`RoleProvider`](components/RoleProvider.tsx) re-export |
| Phân quyền sidebar | ✅ 23 key — [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts) |

**Admin seed:** `smartai0101@gmail.com` / `Admin@123456`

**23 permission keys (tóm tắt):**

| Nhóm | Keys |
|------|------|
| Hoá chất… (11) | `dashboard`, `stock_in`, `chemicals`, `standards`, `microbial_strains`, `prepared_*`, `containers`, `usage_logs`, `reports` |
| Thiết bị (9) | `equipment_dashboard`, `equipment_catalog`, … `equipment_disposal` |
| Quản trị (3) | `admin_users`, `admin_permissions`, `admin_tasks` |

**File đọc khi sửa Auth:**

| Mục đích | File |
|----------|------|
| Nav + route permission | `lib/auth/nav-permissions.ts` |
| Role defaults | `lib/auth/permissions.ts` |
| Session / JWT | `lib/auth/session.ts`, `lib/auth/jwt.ts` |
| Guards | `lib/auth/guards.ts`, `lib/equipment-auth.ts` |
| UI | `components/SessionProvider.tsx`, `components/Sidebar.tsx`, `components/admin/*` |
| Actions | `lib/actions/auth.ts`, `admin-users.ts`, `admin-permissions.ts`, `tasks.ts` |

---

## Deploy Vercel + Turso

SQLite `file:./dev.db` **không** chạy trên Vercel. Production dùng **Turso** (libSQL).

### Env Vercel (Settings → Environment Variables)

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `TURSO_DATABASE_URL` | ✅ | `libsql://xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | ✅ | Token từ Turso dashboard |
| `SESSION_SECRET` | ✅ | ≥ 16 ký tự (khuyến nghị ≥ 32) |
| `SESSION_MAX_AGE` | — | Mặc định 604800 |

### Setup DB remote (một lần, từ local)

```powershell
npm run db:setup-remote
# hoặc: npx tsx scripts/setup-vercel-db.ts
```

Script: `prisma db push` + `prisma/seed.ts` lên Turso.

### Runtime

[`lib/db.ts`](lib/db.ts): nếu có `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (hoặc `DATABASE_URL=libsql://...?authToken=...`) → dùng `@prisma/adapter-libsql`.

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| Vercel "server error" khi login | Không có DB / chưa seed | Turso + `db:setup-remote` |
| "SESSION_SECRET must be set" | Thiếu env | Set trên Vercel, redeploy |
| Login OK local, fail prod | Chỉ có `dev.db` local | Turso + env Vercel |

**File:** [`.env.example`](.env.example), [`scripts/setup-vercel-db.ts`](scripts/setup-vercel-db.ts)

---

## Quy tắc cho agent tiếp theo

- Đọc **HANDOFF.md** trước khi code
- **Không** scan toàn bộ repo
- Chỉ đọc file liên quan trực tiếp task
- **Không** revert: **Sidebar vật tư**, **EQUIPMENT_SUBTITLE**, **Dashboard TB bỏ chi phí**, **HC UX**, **BT/SC log UX**, **Phụ kiện catalog fields**, **DetailDrawer z-index**, **Lý lịch gallery carousel** — trừ khi user yêu cầu
- Không commit trừ khi user yêu cầu
- Sau mỗi task: báo file sửa + `npx tsc --noEmit`

---

## Ghi chú phiên làm việc

- **Phiên kết thúc (2026-06-25):** **Auth/RBAC** (login, middleware, SessionProvider, Admin UI) · **23 quyền sidebar** (`nav-permissions.ts`) · **Turso adapter** cho Vercel · `tsc` + `build` pass · **chưa commit**
- **Vercel prod:** https://huutai-lims-m929.vercel.app — login **chưa** chạy cho đến khi user setup Turso + env
- **Ưu tiên phiên sau:** Hoàn tất **Turso + Vercel env** · QA login prod · QA Auth manual · QA E2E vật tư/thiết bị

### File đọc trước (phiên sau — Vercel / QA)

| Mục đích | File |
|----------|------|
| Bàn giao | `HANDOFF.md` § Deploy Vercel |
| DB prod | `lib/db.ts`, `.env.example`, `scripts/setup-vercel-db.ts` |
| Auth | `lib/auth/nav-permissions.ts`, `lib/actions/auth.ts` |
| Admin UI | `components/admin/AdminPermissionsClient.tsx` |

### File tham chiếu (Auth — đã xong)

| Mục đích | File |
|----------|------|
| Nav registry | `lib/auth/nav-permissions.ts` |
| Session | `lib/auth/session.ts`, `lib/auth/jwt.ts` |
| Middleware | `middleware.ts` |
| Seed auth | `prisma/seed.ts` → `seedAuth()` |
