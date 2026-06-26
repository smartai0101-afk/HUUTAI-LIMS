# Lab Inventory LIMS — HANDOFF

> **Cập nhật:** 2026-06-27 (ISO Phase 1–3 + soft-delete code fix · push prod ✅ · HEAD `8d21c3a`)  
> **Mục đích:** Dùng file này để mở chat mới — **không scan toàn repo**. Chỉ đọc file liên quan trực tiếp.

---

## 1. Current Status

### App có chạy được không

| Thành phần | Trạng thái |
|------------|------------|
| **Dev server** | ✅ http://localhost:3000 — kill PID port 3000 trước `prisma generate` nếu EPERM · xóa `.next` nếu cache cũ |
| **Trang Tài khoản** (`/account`) | ✅ Commit `d183d4d` · Turso `avatarUrl` applied · redeploy prod |
| **Export/Import Excel** (6 trang vật tư) | ✅ Commit `e31304b` · round-trip + import P0 · script QA `test-standards-import-qa.ts` pass · **QA browser 6 trang pending** |
| **Desktop scroll bảng** | ✅ Commit `d8adfa0` — `table-scroll-viewport` · cuộn X+Y · **chỉ sticky header** (`lg+`) · **không pin cột** · **QA browser pending** |
| **Mobile bảng** | ✅ Vuốt ngang tự do · không sticky cột |
| **Module Thiết bị — navigation UX** | ✅ Commit `e31304b` — `app/equipment/layout.tsx` + `loading.tsx` shell cố định |
| **Seed demo liên kết** | ✅ Commit `7e5ff9f` — ~20 master/nhóm + ảnh `public/seed-assets/` · Turso prod seeded 2026-06-26 |
| **Vercel Blob upload** | 🟡 Code `lib/file-storage.ts` commit `59f4681` · cần `BLOB_READ_WRITE_TOKEN` trên Vercel + QA upload prod |
| **Login UI** | ✅ Bỏ gợi ý email/mật khẩu seed trên form |
| **Build production** | ✅ `npm run build` |
| **`/stock-in` — Nhập kho** | ✅ Identity → cùng mã · cảnh báo lot/đơn vị · quy đổi L/mL/µL |
| **`/prepared-chemicals`, `/prepared-standards`, `/prepared-strains`** | ✅ ISO workflow · tab Lịch sử + **Truy xuất** (`aa305a5`) · soft delete giải phóng mã (`4bbcb0b`) · **QA browser pending** |
| **`/containers` → Thống kê** | ✅ Bảng gộp catalog + expand tồn theo lot |
| **`/usage-logs`** | ✅ Ghi theo vật tư gốc; tab Thống kê nhân viên |
| **`/chemicals`, `/standards`, `/microbial-strains`** | ✅ CRUD · bảng theo lot (Excel) · Chuẩn có CAS |
| **Inventory deduction** | ✅ Trừ theo `stockLotId` khi chọn lot; FIFO chỉ khi `ALLOW_FIFO_WITHOUT_LOT=true` |
| **TypeScript / Tests** | ✅ `tsc`, `test-stock-in.ts`, `test-inventory-stock.ts`, `test-stock-in-identity.ts`, `test-catalog-lot-rows.ts`, `test-equipment-schedule.ts`, `test-equipment-history-sync.ts`, **`test-equipment-e2e-qa.ts`**, **`test-notifications.ts`** |
| **Module Thiết bị** (`/equipment/*`) | ✅ HC inline · BT/SC UX · Phụ kiện · upload đa file · subtitle EN · Dashboard gọn · **Lý lịch gallery** · **layout shell dùng chung** |
| **Lý lịch thiết bị** (`/equipment/history`) | ✅ Chọn sự kiện timeline → gallery ảnh (nguồn gốc + upload) · carousel prev/next · PDF link riêng |
| **Authentication & RBAC** | ✅ Login/logout · JWT session · middleware · **25 quyền sidebar** (`preparation_history` + `admin_people`) · Admin UI |
| **Session / Sidebar auth** | ✅ Fix sidebar trống (JWT↔DB lệch) · fix cookie crash layout · stale → `/login?reason=session` |
| **Mobile UX (bảng + filter)** | ✅ `TouchHorizontalScroll` · `FilterChipBar` · **không sticky cột mobile** (`ede088c`) |
| **Deploy Vercel** | ✅ Branch pushed · prod redeployed (`dpl_2sHScr5aKzzjb1cMNSUHPg4NStes` / https://huutai-lims-m929.vercel.app) · HEAD `4bbcb0b`+ |
| **Notification system** | ✅ Commit `ed32b5b` — bell + badge · `/notifications` · API 4 route · **đã redeploy prod** · **Turso migrate + QA browser pending** |
| **Danh mục TB — cột Thông số kỹ thuật** | ✅ Commit `ed32b5b` — cột sau Hãng SX · import/export Excel · seed 27 mã · **đã redeploy prod** · **QA browser + Turso backfill pending** |
| **Danh mục TB — In tem nhãn** | ✅ Commit `d8adfa0` — checkbox · preview modal · in A4 grid · profile ladder · logo căn giữa · **QA browser prod pending** |
| **Dashboard `/`** | ✅ Commit `d8adfa0` — KPI Prisma (StockLot, tồn thấp, HC/BT TB) · alerts · hoạt động gần đây · **không còn mock** |
| **Báo cáo `/reports`** | ✅ Commit `d8adfa0` — stats DB + export CSV (tồn lot, nhật ký, nhập kho, sổ cái, audit) · **không còn mock** |
| **Sổ cái tồn `/inventory-ledger`** | ✅ Commit `d8adfa0` — UI `InventoryTransaction` · filter · export CSV |
| **Quản lý nhân sự `/admin/people`** | ✅ Commit `d04f674` · Turso `user_staff_link` applied · **QA browser pending** |
| **Lịch sử pha chế ISO 17025** | ✅ **Phase 1–4 done** · QA browser pass (2026-06-27) · plan [`PLAN-preparation-iso.md`](PLAN-preparation-iso.md) |
| **Nhật ký — lot picker** | ✅ Commit `d8adfa0` — bắt buộc chọn lot khi ≥2 lot · `stockLotId` trên deduct |
| **Catalog quantity guard** | ✅ Commit `d8adfa0` — chặn sửa `quantity` master khi đã có StockLot · `lib/catalog-quantity-guard.ts` |
| **Session guard actions** | ✅ Commit `d8adfa0` — catalog/stock-in/usage-logs dùng `requireSessionCanEdit/Manage` |
| **Cảnh báo chủ động (cron)** | ✅ Commit `d8adfa0` — `GET /api/cron/proactive-alerts` · `vercel.json` 7:00 UTC · **cần `CRON_SECRET` trên Vercel** |
| **Thống kê — filter rủi ro** | ✅ Commit `d8adfa0` — filter Sắp hết hạn / Tồn thấp trên `/containers` |
| **Legacy MVP routes** | ✅ Commit `d8adfa0` — `/solutions`→prepared-standards · `/transactions`→usage-logs · `/inventory`→containers · `/alerts`→`/` |

**Menu vật tư** (nhóm **Hoá chất - Chuẩn - Chủng**): Dashboard · Nhập kho · Hoá chất/Chuẩn/Chủng gốc · pha chế · Thống kê · Nhật ký · **Sổ cái tồn** · Báo cáo.  
**Menu Quản trị:** **Nhân sự** · Phân quyền · Giao việc.  
**Route `/containers`** giữ URL, label menu **“Thống kê”**. **Nhập kho** → `/stock-in`.

### URL hiện tại

| Môi trường | URL |
|------------|-----|
| **Local dev** | http://localhost:3000 |
| **Vercel (prod)** | https://huutai-lims-m929.vercel.app — deploy cũ `dpl_hA5ZQf4JWL7Bq7uo9zFGRVZ4dJpH` · **chưa có `d8adfa0`** (dashboard thật, staff, ledger, cron) |
| **Vercel (alt)** | https://huutai-lims.vercel.app — project `huutai/huutai-lims` (có env riêng, không phải URL chính user dùng) |

### Trạng thái Next.js

- **Version:** 16.2.9 (App Router, Turbopack dev)
- **Kiến trúc:** Server component fetch Prisma → client component → server actions
- **Server Actions upload:** `next.config.ts` → `experimental.serverActions.bodySizeLimit: "32mb"` (restart dev sau đổi config)
- **Module MVP cũ (localStorage):** đã **redirect** sang module Prisma (`d8adfa0`) — không còn ghi localStorage

### Trạng thái Prisma

- **Client:** ✅ Generated — restart dev server nếu `prisma generate` báo EPERM
- **Schema:** ✅ Valid
- **Migrations (18):**
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
  - `20260625_user_avatar` ← **`User.avatarUrl`**
  - `20260626_notifications` ← **`Notification`, `NotificationRead`**
  - `20260626_user_staff_link` ← **`User.staffId` FK → Staff**
  - `20260627_preparation_iso` ← **workflowStatus, PreparationHistory, PreparationAuditLog, soft delete**
- **Dev note:** `migrate deploy` có thể báo P3005 — dùng `db execute` migration SQL hoặc `db push`

### Trạng thái Database

- **Local:** SQLite — `prisma/dev.db` · `DATABASE_URL="file:./dev.db"`
- **Dev routing (`lib/db.ts`):** Khi `NODE_ENV !== production` và `DATABASE_URL` bắt đầu `file:` → **luôn dùng SQLite local**, bỏ qua `TURSO_*` trong `.env` (tránh crash thiếu cột khi Turso chưa migrate)
- **Production (Turso):** `libsql://huutai-lims-smartai0101-afk.aws-ap-northeast-1.turso.io` — **extended seed 2026-06-26** (29 HC · 26 chuẩn · 22 chủng · 27 TB)
- **Seed local:** `npm run db:seed` hoặc `npx tsx prisma/seed.ts`
- **Seed Turso prod** (DB đã có schema — **không** dùng `db:setup-remote` nếu báo table exists):
  ```powershell
  $env:NODE_ENV="production"; npx tsx prisma/seed.ts
  ```
- **Remote setup lần đầu:** `npm run db:setup-remote` — chỉ khi DB trống; dùng `prisma migrate diff` + `@libsql/client`
- **Kiểm tra env trước deploy:** `powershell -ExecutionPolicy Bypass -File scripts/deploy-check.ps1`

### Module đang hoạt động

| Module | Route | Ghi chú |
|--------|-------|---------|
| **Thống kê** | `/containers` | Gộp catalog; expand lot; Ghi sử dụng → prefill nhật ký |
| **Nhập kho** | `/stock-in` | Identity → cùng mã; auto-fill; cảnh báo lot/đơn vị |
| **Nhật ký** | `/usage-logs` | Tab Nhật ký + Thống kê nhân viên |
| Catalog gốc | `/chemicals`, `/standards`, `/microbial-strains` | CRUD + 1 dòng/lot · **Export/Import Excel** |
| Pha chế | `/prepared-chemicals`, `/prepared-standards`, `/prepared-strains` | Lot picker · trừ tồn · **Export/Import Excel** (import metadata) |
| **Lịch sử pha chế** | `/preparation-history` | Báo cáo ISO 14 cột · filter · export Excel |
| **Thiết bị** | `/equipment`, `/equipment/catalog`, … | 9 menu sidebar; xem § Module Thiết bị |
| **Quản trị** | `/admin/users`, `/admin/permissions`, `/admin/tasks` | Admin: users + phân quyền; LM/Analyst: giao việc |
| Báo cáo | `/reports`, `/` | ReportsClient / mock dashboard |
| **Login** | `/login` | Public; middleware redirect nếu chưa auth |
| **Tài khoản** | `/account` | Mọi user đã login — tên, avatar, mật khẩu; không cần permission RBAC |
| **Thông báo** | `/notifications` | Mọi user đã login · nội dung lọc theo quyền module · bell Topbar polling 45s |

### Các lỗi còn tồn tại

| Vấn đề | Mức | Ghi chú |
|--------|-----|---------|
| **Lot nhập sai đơn vị (vd. mg vs mL)** | 🟡 | Có cảnh báo UI; kiểm tra/sửa lot trong DB nếu nhập nhầm |
| **Product code để trống ≠ bản ghi có code** | 🟡 | Không coi là trùng identity |
| **Purity/uncertainty theo lot** | 🟡 | Chỉ trên master; `StockLot` chưa có purity |
| **CAS DB cũ rỗng** | 🟡 | Backfill hoặc re-seed |
| **Usage log chưa chọn lot** | 🟢 | Lot picker bắt buộc khi ≥2 lot (`d8adfa0`) |
| **Chưa UI InventoryTransaction / Staff** | 🟢 | `/inventory-ledger` + `/admin/people` |
| **Catalog CRUD sửa `quantity` trực tiếp** | 🟡 | Server guard chặn khi có StockLot · **UI vẫn cho sửa** (chỉ reject khi save) |
| **Turso thiếu `avatarUrl` (prod)** | 🟢 | Đã apply qua `scripts/apply-turso-migration.ps1` |
| **Upload COA/file/avatar trên Vercel** | 🟡 | Code Blob sẵn (`lib/file-storage.ts`) · **cần `BLOB_READ_WRITE_TOKEN` trên Vercel** + redeploy + QA |
| **Vercel prod login** | 🟡 | Env `TURSO_*` + `SESSION_SECRET` đã set · **QA login prod chưa xác nhận user** |
| **Turso token rotate** | 🟡 | Token đã paste chat · nên rotate lại sau go-live |
| **Non-equipment actions chưa session guard** | 🟢 | Catalog/stock-in/usage-log dùng `requireSessionCanEdit/Manage` (`d8adfa0`) |
| Sidebar trống (JWT stale) | 🟢 | Fix session — `getSessionUser` read-only · middleware xóa cookie `/login?reason=session` |
| Cookie crash layout Next.js 16 | 🟢 | Không gọi `clearSessionCookie()` trong layout/`getSessionUser` |
| Dev server treo port 3000 / EPERM generate | 🟡 | `taskkill /F /IM node.exe` → `npx prisma generate` → `npm run dev` |
| Prisma stale client (Turbopack) | 🟢 | Fix `lib/db.ts` Proxy; restart dev nếu vẫn lỗi `findMany` undefined |
| DetailDrawer che ModalShell | 🟢 | `DetailDrawer` `z-[70]`, `ModalShell` `z-[80]`, `ConfirmDialog` `z-[90]` |
| Sidebar hydration warning (dev) | 🟡 | Next.js dev overlay; không chặn click sau fix z-index |
| **Import Excel — QA browser round-trip** | 🟡 | Script `test-standards-import-qa.ts` pass · cần QA thủ công 6 trang |
| **Import Excel — tối ưu P1 (batch query)** | 🟢 | Batch lot cache preload trong `catalog-import.ts` (`d8adfa0`) · gộp preview+import vẫn P2 |
| **Desktop sticky header + viewport** | 🟢 | Commit `d8adfa0` · **QA browser pending** |
| **Turso chưa migration Notification** | 🟡 | Prod cần `db execute` migration `20260626_notifications` |
| **Turso/prod chưa backfill specs TB** | 🟡 | Chạy `backfill-equipment-specifications.ts` với `NODE_ENV=production` |
| **Prod chưa deploy `d8adfa0`** | 🟡 | Push branch + `npx vercel --prod` · set `CRON_SECRET` + `BLOB_READ_WRITE_TOKEN` |
| **Seed local — quyền mới** | 🟡 | Chạy `npm run db:seed` nếu thiếu permission `inventory_ledger`, `admin_people` |

---

## 2. Completed Work

### Phiên này (2026-06-27) — ISO Phase 3 + Prod ops + fix mã soft delete ✅

#### ISO Phase 3 Traceability — commit `aa305a5`

| Thành phần | Chi tiết |
|------------|----------|
| **Service** | `lib/services/preparation-traceability.ts` — `buildTraceTree`, `findPreparedDerivatives` |
| **UI** | `PreparationTraceTree`, `CatalogPreparedDerivatives` — tab Truy xuất · reverse lookup catalog |
| **Route** | `/preparation/[type]/[id]` — Chi tiết + Lịch sử + Truy xuất |
| **QA demo** | PSTD-0006 → PSTD-0005 → STD-0007 · STD-0007 reverse → PSTD-0005 |

#### Prod ops (Track A) — commits `a05132c`–`4bbcb0b`

| Thành phần | Chi tiết |
|------------|----------|
| **Push** | `cursor/mobile-scroll-vercel-session` → GitHub |
| **Turso prod** | `user_staff_link` + `preparation_iso` via `scripts/apply-migration-turso.ts` (⚠️ **không** dùng `prisma db execute` khi `.env` có `DATABASE_URL=file:`) |
| **Backfill prod** | Preparation history 12 bản ghi · equipment specs đã có |
| **Deploy** | `npx vercel --prod` → https://huutai-lims-m929.vercel.app |

#### Fix mã trùng sau soft delete — commit `4bbcb0b`

| Vấn đề | TG2 đã xóa mềm vẫn giữ `@unique code` → lỗi trùng / Prisma unique constraint |
| Fix | `lib/prepared-code-guard.ts` — kiểm tra trùng chỉ `deletedAt: null` · archive mã khi xóa · auto-release ghost trước create/update |
| Backfill | `scripts/backfill-archived-prepared-codes.ts` — local TG2 → `TG2__deleted__86e5acb3` |
| Lưu ý | Filter **Đã hủy** ≠ bản ghi **Xóa mềm** (server không trả `deletedAt != null`) |

**Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD **`8d21c3a`** · **đã push**

### Phiên cùng ngày (2026-06-27) — Nhân sự + ISO pha chế Phase 1+2 ✅

#### Nhân sự `/admin/people` — commit `d04f674`

| Thành phần | Chi tiết |
|------------|----------|
| **Route** | `/admin/people` — gộp User + Staff |
| **Migration** | `20260626_user_staff_link` — `User.staffId` |
| **RBAC** | Permission `admin_people` (24 quyền sidebar) |
| **Redirect** | `/admin/users`, `/admin/staff` → `/admin/people` |

#### ISO 17025 — Lịch sử pha chế Phase 1+2 — commit `0d9518f`

| Phase | Thành phần | Chi tiết |
|-------|------------|----------|
| **1 Schema** | Migration `20260627_preparation_iso` | `workflowStatus`, Staff FKs, `deletedAt`, `version`, `PreparationHistory`, `PreparationAuditLog` |
| **1 Service** | `lib/services/preparation-workflow.ts` | Snapshot, history, FSM, separation of duties, amendment guards |
| **1 Hooks** | `prepared-chemicals.ts`, `prepared-standards.ts`, `modules.ts` | Ghi history/audit trên create/update/delete |
| **1 Backfill** | `scripts/backfill-preparation-history.ts` | Local đã chạy: 2 HC + 7 chuẩn + 3 chủng |
| **2 Backend** | `preparation-workflow.ts` actions + `preparation-transition-stock.ts` | Transition FSM · trừ tồn khi Draft→Prepared · hoàn tồn khi cancel/xóa mềm |
| **2 CRUD** | Create → **Draft** (chưa trừ tồn) · legacy/backfill → **Approved** | Sửa Approved → bắt buộc `amendmentReason` · delete → soft delete |
| **2 UI** | `components/preparation/*` | WorkflowStatusBadge, WorkflowPanel, HistoryTimeline, AmendmentDialog |
| **2 Clients** | 3 Prepared*Client + `ModuleCrudClient` | Filter quy trình · tabs Chi tiết/Lịch sử/Truy xuất (Phase 3 done `aa305a5`) |

**Luồng FSM:** Draft → Prepared → Checked → Approved → (Cancelled)  
**Trừ tồn:** Chỉ khi chuyển **Prepared** (bản ghi mới Draft) hoặc khi sửa **Approved** (đã trừ từ trước).  
**Turso prod:** ✅ migration `20260627_preparation_iso` + backfill history (12 bản ghi)

**Lệnh kiểm tra:** `npx tsc --noEmit` pass

**Git:** commit `0d9518f` (đã push cùng branch)

### Phiên trước (2026-06-26) — Plan LIMS hoàn tất ✅ (commit `d8adfa0` · chưa push/redeploy prod)

#### Tier 1 — Dashboard & Báo cáo thật ✅

| Thành phần | Chi tiết |
|------------|----------|
| **Dashboard `/`** | [`app/page.tsx`](app/page.tsx) + [`lib/services/dashboard.ts`](lib/services/dashboard.ts) + [`DashboardClient.tsx`](components/dashboard/DashboardClient.tsx) — KPI StockLot, tồn thấp, HC/BT TB, alerts, hoạt động gần đây |
| **Báo cáo `/reports`** | [`app/reports/page.tsx`](app/reports/page.tsx) + [`lib/services/reports.ts`](lib/services/reports.ts) + [`ReportsClient.tsx`](components/reports/ReportsClient.tsx) — stats DB + export CSV |
| **Legacy redirect** | `/solutions`→prepared-standards · `/transactions`→usage-logs · `/inventory`→containers · `/alerts`→`/` |

#### Tier 2 — Schema có UI ✅

| Thành phần | Chi tiết |
|------------|----------|
| **Staff `/admin/people`** | [`AdminPeopleClient.tsx`](components/admin/AdminPeopleClient.tsx) · [`admin-people.ts`](lib/actions/admin-people.ts) · permission `admin_people` |
| **Sổ cái `/inventory-ledger`** | [`InventoryLedgerClient.tsx`](components/inventory-ledger/InventoryLedgerClient.tsx) · permission `inventory_ledger` |
| **Lot picker usage** | [`UsageLogsClient.tsx`](components/usage-logs/UsageLogsClient.tsx) — bắt buộc khi ≥2 lot |
| **Quantity guard** | [`lib/catalog-quantity-guard.ts`](lib/catalog-quantity-guard.ts) — chặn sửa quantity master khi có StockLot |

#### Tier 3 — Cảnh báo chủ động ✅

| Thành phần | Chi tiết |
|------------|----------|
| **Cron** | [`app/api/cron/proactive-alerts/route.ts`](app/api/cron/proactive-alerts/route.ts) · [`vercel.json`](vercel.json) 7:00 UTC |
| **Service** | [`lib/services/proactive-alerts.ts`](lib/services/proactive-alerts.ts) — tồn thấp, hết hạn, HC/BT sắp đến hạn |
| **Filter rủi ro** | [`StatisticsClient.tsx`](components/statistics/StatisticsClient.tsx) — Sắp hết hạn / Tồn thấp |

#### Tier 4 — Hardening ✅

- Session guard trên catalog/stock-in/usage actions
- Import Excel P1 batch lot cache trong `catalog-import.ts`
- README cập nhật (không còn mô tả localStorage MVP)
- `.env.example` thêm ghi chú `CRON_SECRET`
- RBAC **24 quyền** (+ `inventory_ledger`, `admin_people` gộp users/staff)

**Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD `d8adfa0` · **chưa push** · working tree sạch (trừ `prisma/prisma/` — không commit)

**Lệnh kiểm tra:** `npx tsc --noEmit` pass

### Phiên trước (2026-06-26) — In tem nhãn + Sticky header ✅ (gộp vào `d8adfa0`)

#### In tem nhãn — Danh mục thiết bị (`/equipment/catalog`) ✅ (commit `d8adfa0` · QA browser pending)

| Thành phần | Chi tiết |
|------------|----------|
| **UI chọn & in** | Checkbox từng dòng + select-all visible · nút **In tem nhãn** trên toolbar · disabled khi chưa chọn |
| **Preview modal** | [`EquipmentLabelPreviewModal.tsx`](components/equipment/EquipmentLabelPreviewModal.tsx) — bỏ chọn từng tem · badge kích thước + font |
| **Tem nhãn** | [`EquipmentLabelPrint.tsx`](components/equipment/EquipmentLabelPrint.tsx) + [`equipment-label-print.css`](components/equipment/equipment-label-print.css) — max **7×6cm** · profile ladder 6 mức (8pt→6.3pt) · fit DOM |
| **Mapper** | [`lib/equipment-label-print.ts`](lib/equipment-label-print.ts) — nhãn rút gọn in · 10 trường · `-` khi rỗng |
| **Logo** | [`public/sci-tech-logo.png`](public/sci-tech-logo.png) — watermark opacity 8% · **căn giữa khung** |
| **In** | `window.print()` · `@media print` ẩn UI · grid A4 `repeat(auto-fill, 7cm)` |
| **Shell/Client** | [`EquipmentModuleShell.tsx`](components/equipment/EquipmentModuleShell.tsx) · [`EquipmentCatalogClient.tsx`](components/equipment/EquipmentCatalogClient.tsx) |

**Lệnh kiểm tra:** `npx tsc --noEmit` pass · `npx next build` pass (xóa `.next` nếu cache lỗi)

#### Redeploy Vercel prod 🟡 (cần làm lại từ `d8adfa0`)

- **Project:** `huutai/huutai-lims-m929`
- **Deploy hiện tại (cũ):** `dpl_hA5ZQf4JWL7Bq7uo9zFGRVZ4dJpH` — **chưa có** dashboard thật, staff, ledger, cron
- **URL:** https://huutai-lims-m929.vercel.app
- **Bước tiếp:** push `d8adfa0` → set env `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` → `npx vercel --prod --yes`

**Lưu ý prod:** Notification cần Turso migration `20260626_notifications` — nếu chưa chạy, bell/API có thể lỗi trên prod.

### Phiên trước (2026-06-26) — Notification system + Cột Thông số kỹ thuật TB ✅ (commit `ed32b5b` · pushed)

#### Hệ thống Notification ✅ (code · QA browser + Turso migrate pending)

| Thành phần | Chi tiết |
|------------|----------|
| **Prisma** | `Notification`, `NotificationRead` — migration [`20260626_notifications`](prisma/migrations/20260626_notifications/migration.sql) |
| **Core** | [`lib/notifications/*`](lib/notifications/) — create, query, permissions, entity-map, mark-read |
| **Audit hook** | [`lib/audit.ts`](lib/audit.ts) — `logActivity()` ghi audit + notification song song |
| **API** | `GET/PATCH` [`app/api/notifications/*`](app/api/notifications/) — list, unread-count, mark read, read-all |
| **UI** | [`NotificationBell`](components/notifications/NotificationBell.tsx) Topbar · [`/notifications`](app/notifications/page.tsx) · polling 45s |
| **RBAC** | Admin xem tất cả; user khác lọc theo 23 permission keys (`hasPermission` read) |
| **Actions wired** | ~19 file `lib/actions/*` + `tasks.ts` — thay `writeAuditLog` → `logActivity` |
| **Test** | [`scripts/test-notifications.ts`](scripts/test-notifications.ts) — 8 assertions pass |

**Turso prod (một lần):**
```powershell
npx prisma db execute --file prisma/migrations/20260626_notifications/migration.sql --schema prisma/schema.prisma
```

#### Danh mục thiết bị — cột Thông số kỹ thuật ✅ (code · QA browser pending)

| Thành phần | Chi tiết |
|------------|----------|
| **DB field** | `Equipment.specifications` — **đã có sẵn**, không migration mới |
| **Bảng** | [`EquipmentCatalogClient.tsx`](components/equipment/EquipmentCatalogClient.tsx) — cột sau **Hãng SX**, wrap 250–280px, `-` khi rỗng |
| **Form/Drawer** | Textarea specs sau Hãng SX · label **Thông số kỹ thuật** |
| **Excel** | [`lib/equipment-fields.ts`](lib/equipment-fields.ts) export/import · [`equipment-catalog.ts`](lib/actions/equipment-catalog.ts) bulk import |
| **Seed** | [`prisma/seed-data/equipment-specifications.ts`](prisma/seed-data/equipment-specifications.ts) — 27 mã |
| **Backfill** | [`scripts/backfill-equipment-specifications.ts`](scripts/backfill-equipment-specifications.ts) — idempotent · local đã chạy 27/27 |

**Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD `ed32b5b` (pushed)

### Phiên trước (2026-06-26) — Sticky header only (bỏ pin cột)

#### Bảng desktop — scroll viewport + chỉ cố định tiêu đề ✅ (commit `d8adfa0` · QA pending)

| Thành phần | Chi tiết |
|------------|----------|
| **DataTable** | [`components/DataTable.tsx`](components/DataTable.tsx) — `table-scroll-viewport` · mọi `<th>` `lg:sticky lg:top-0` · **không** pin cột trái/phải |
| **CSS** | [`app/globals.css`](app/globals.css) — `.table-scroll-viewport` |
| **Đã bỏ** | `lib/table-pin.ts`, `useTableColumnPinOffsets.ts`, `pinPreset` trên clients |
| **File sửa** | `DataTable.tsx`, `globals.css`, catalog clients (reorder `storageLocation`) — commit `d8adfa0` |

**Lệnh kiểm tra:** `npx tsc --noEmit` pass

⏳ **QA desktop:** `/chemicals` — cuộn dọc header cố định · cuộn ngang tất cả cột cùng nhau · không overlap  
⏳ **QA mobile 375px:** vuốt ngang OK · không sticky cột body

### Phiên trước (2026-06-26) — Desktop pin cột (đã revert theo feedback user)

Pin cột trái/phải gây chồng chéo nội dung → đã bỏ, chỉ giữ sticky header + scroll viewport.

### Phiên trước (2026-06-26) — Extended seed · Mobile sticky · Turso prod · Vercel redeploy

#### Seed demo liên kết (~20 master/nhóm) ✅ (commit `7e5ff9f` · Turso prod seeded)

| Thành phần | Chi tiết |
|------------|----------|
| **Module seed** | `prisma/seed-data/` — `chemicals.ts`, `standards.ts`, `strains.ts`, `equipment.ts`, `equipment-lifecycle.ts`, `links.ts`, `assets.ts`, `helpers.ts`, `index.ts` |
| **Số lượng sau seed** | ~29 HC · ~26 chuẩn · ~22 chủng · ~27 TB |
| **Cross-links** | PCHEM-0002, PSTD-0005/0006, PMS-0002/0003 · multi-lot · HC/BT/history · spare part links |
| **Ảnh stock** | 16 JPEG trong `public/seed-assets/{chemicals,standards,strains,equipment}/` |
| **Scripts** | `scripts/generate-seed-assets.ts`, `scripts/verify-seed-links.ts` (16 assertions pass) |
| **Wiring** | `prisma/seed.ts` → extended catalog → equipment → `seedStockLotsFromCatalog()` → `seedExtendedPostStockLots()` |
| **Turso prod** | `$env:NODE_ENV="production"; npx tsx prisma/seed.ts` — **không** dùng `db:setup-remote` nếu báo table exists |
| **Local seed** | `npm run db:seed` (`npx tsx prisma/seed.ts`) |

#### Mobile bảng — tắt sticky cột ✅ (commit `ede088c`)

- `components/DataTable.tsx` — default `stickyLeadingColumns` **1 → 0**
- Bỏ `stickyLeadingColumns={2}` khỏi `ChemicalsClient`, `StandardsClient`, `MicrobialStrainsClient`
- ⏳ **QA browser 375px:** vuốt ngang bảng không bị 2 cột cố định che

#### Fix Import Excel catalog — P0 ✅ (commit `e31304b` · QA browser pending)

| Fix | File | Mô tả |
|-----|------|-------|
| **Round-trip trùng mã** | [`lib/stock-in-master.ts`](lib/stock-in-master.ts), [`lib/services/stock-in-match.ts`](lib/services/stock-in-match.ts) | `tryReuseMasterByCode` — mã đã có + identity khớp → reuse master nhập lot; không khớp → message rõ (`Mã X đã tồn tại — không khớp tên/hãng/...`) |
| **Nút kẹt "Đang import..."** | [`components/ExcelImportDialog.tsx`](components/ExcelImportDialog.tsx) | Bỏ `useTransition` lồng nhau → `phase: idle \| preview \| import` + `try/catch/finally`; nút "Đang kiểm tra..." / "Đang import..." |
| **Refresh không block** | 3 catalog client + 2 pha chế | `onImported` callback sau đóng dialog · `void router.refresh()` |
| **Lỗi import đầy đủ** | [`lib/actions/catalog-import.ts`](lib/actions/catalog-import.ts), `ExcelImportDialog` | Trả `{ error, errors }` khi fail · panel vàng hiện từng dòng |
| **Prefix lỗi theo dòng** | [`lib/catalog-import.ts`](lib/catalog-import.ts) | `Dòng X (mã): ...` trên lỗi transaction |

- ✅ Server-side test: round-trip lot mới · preview lot trùng · identity mismatch — pass
- ✅ `npx tsc --noEmit` pass
- ⏳ **QA browser:** Export `/standards` → Import lại · lot trùng dialog · sửa tên Excel khác DB

**P1 chưa làm:** batch preload master/lot · gộp preview+import (1 server action) · xem § Pending Tasks

#### Module Thiết bị — giảm loá sáng khi chuyển submenu ✅ (commit `e31304b`)

- ✅ [`app/equipment/layout.tsx`](app/equipment/layout.tsx) — `EquipmentAppShell` bọc mọi route `/equipment/*` (sidebar + breadcrumb **không remount**)
- ✅ [`app/equipment/loading.tsx`](app/equipment/loading.tsx) — skeleton nhẹ trong layout khi chuyển trang
- ✅ Gỡ `<EquipmentAppShell>` khỏi 11 client `components/equipment/*Client.tsx`
- ⏳ **QA browser:** Dashboard → Danh mục → Lý lịch — so sánh với nhóm Hoá chất - Chuẩn - Chủng

### Phiên trước (2026-06-26) — Excel round-trip · Scroll desktop · QA import (phát hiện lỗi)

#### Export/Import Excel round-trip — 6 trang vật tư ✅ (commit `e31304b`)

| Route | Export | Import |
|-------|--------|--------|
| `/chemicals` | `.xlsx` grouped lot + STT | Master + lot · preview trùng lot DB · confirm cộng tồn |
| `/standards` | `.xlsx` grouped lot + STT | Master + lot (cùng flow) |
| `/microbial-strains` | `.xlsx` grouped lot + STT | Master + lot (cùng flow) |
| `/prepared-chemicals` | `.xlsx` đủ cột | Metadata phiếu · báo trùng mã trong file |
| `/prepared-standards` | `.xlsx` multi-row (STT, thành phần, dung môi) | Group multi-row · component/solvent metadata |
| `/prepared-strains` | `.xlsx` 16 cột (`buildPreparedStrainExportRows`) | Metadata + resolve chủng gốc theo mã |

- ✅ Shared: [`lib/catalog-excel.ts`](lib/catalog-excel.ts), [`lib/catalog-import.ts`](lib/catalog-import.ts), [`lib/excel-import-utils.ts`](lib/excel-import-utils.ts), [`lib/stock-in-master.ts`](lib/stock-in-master.ts)
- ✅ Actions: [`lib/actions/catalog-import.ts`](lib/actions/catalog-import.ts) (+ `preview*Import`, `mergeDuplicates`), [`lib/actions/prepared-import.ts`](lib/actions/prepared-import.ts)
- ✅ Column maps: `*-fields.ts`, [`lib/prepared-excel.ts`](lib/prepared-excel.ts) (`PREPARED_STANDARD_IMPORT_COLUMN_MAP`, …)
- ✅ UI: 6 client + [`ExcelImportDialog`](components/ExcelImportDialog.tsx) (errors panel, ConfirmDialog lot trùng DB)
- ✅ Desktop scroll: [`TouchHorizontalScroll.tsx`](components/TouchHorizontalScroll.tsx), [`app/globals.css`](app/globals.css)
- ✅ `npx tsc --noEmit` pass

**Giới hạn import pha chế (giữ nguyên):** không trừ tồn hoá chất/chuẩn gốc · component/solvent chỉ snapshot/metadata.

#### QA import `/standards` (2026-06-26) — phát hiện lỗi → **đã fix P0** 🟢

- **Triệu chứng ban đầu:** Bấm Import → nút **"Đang import..."** kẹt; panel vàng **`Mã vật tư đã tồn tại`** khi import lại file export.
- **Nguyên nhân (đã phân tích + fix):**
  1. **Kẹt UI:** `useTransition` + `startTransition` lồng nhau sau `await` → `isPending` không reset (React 19) → fix bằng `phase` state tường minh.
  2. **Trùng mã:** `ensureMaster` cố `create` khi mã tồn tại → fix `tryReuseMasterByCode`.
  3. **Chậm (P1 còn lại):** preview + import 2 server actions · N query/dòng — chưa batch.

**File đã sửa:** `lib/stock-in-master.ts`, `lib/catalog-import.ts`, `lib/actions/catalog-import.ts`, `components/ExcelImportDialog.tsx`, catalog/prepared clients.

### Phiên trước (2026-06-26) — Export/Import Excel ban đầu · Account · Blob

#### Export/Import Excel — phiên bản đầu ✅ (đã mở rộng round-trip ở trên)

#### Trang Tài khoản + Vercel Blob + Turso ✅ (đã commit)

- Commit `d183d4d`: `/account`, avatar, JWT session, Topbar, `lib/db.ts` dev routing, migration `avatarUrl`
- Commit `59f4681`: `lib/file-storage.ts` + `@vercel/blob` · refactor `coa-upload`, `equipment-upload`, `avatar-upload` · scripts Turso/QA
- Turso prod: `avatarUrl` applied — `scripts/apply-turso-migration.ps1`
- Redeploy `huutai-lims-m929` (2026-06-26, có Blob code)

### Phiên trước (2026-06-25) — Trang Tài khoản · Fix dev DB · Commit mobile scroll

#### Trang Tài khoản (`/account`) ✅ (commit `d183d4d`)

- ✅ Xóa gợi ý seed trên [`components/auth/LoginForm.tsx`](components/auth/LoginForm.tsx) — placeholder `email@congty.com`, bỏ footer Admin seed
- ✅ Prisma `User.avatarUrl` + migration [`20260625_user_avatar`](prisma/migrations/20260625_user_avatar/migration.sql)
- ✅ JWT/session: `avatarUrl` trong [`lib/auth/jwt.ts`](lib/auth/jwt.ts), [`lib/auth/session.ts`](lib/auth/session.ts) — `refreshSessionCookie()` sau đổi tên/avatar
- ✅ Upload avatar: [`lib/avatar-upload.ts`](lib/avatar-upload.ts) → `public/uploads/avatars/` (local dev OK)
- ✅ Server actions: [`lib/actions/account.ts`](lib/actions/account.ts) — `updateProfile`, `updateAvatar`, `removeAvatar`, `updatePassword`
- ✅ UI: [`app/account/page.tsx`](app/account/page.tsx), [`components/account/AccountClient.tsx`](components/account/AccountClient.tsx) — 3 section: ảnh · thông tin · mật khẩu
- ✅ Topbar: avatar + link `/account` — [`components/Topbar.tsx`](components/Topbar.tsx)
- ✅ Route `/account` không cần RBAC — [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts) `routePermission` → `null`

#### Fix không vào được app (Prisma avatarUrl) ✅

- **Triệu chứng:** `PrismaClientValidationError` / `no such column: main.users.avatarUrl` tại `getSessionUser()` → crash `RootLayout`
- **Nguyên nhân:** `.env` có `TURSO_*` → runtime dev kết nối Turso (thiếu cột) thay vì SQLite local (đã có cột)
- ✅ Fix [`lib/db.ts`](lib/db.ts): dev + `DATABASE_URL=file:` → **bỏ qua Turso**, dùng SQLite
- ✅ `npx prisma generate` + restart dev + xóa `.next` nếu cần
- ✅ **Turso prod:** cột `avatarUrl` đã apply (2026-06-26)

#### Commit branch `cursor/mobile-scroll-vercel-session` ✅ (pushed)

- `e46cfbd`: mobile scroll UX, session fixes, Vercel deploy tooling
- `d183d4d`: account page + dev DB routing
- `59f4681`: Vercel Blob file storage + Turso migration scripts
- `e31304b`: Excel round-trip import + equipment layout shell
- `ede088c`: mobile sticky columns off
- `957cbdf`: fix ArrayBuffer type in test script (Vercel build)
- `7e5ff9f`: extended linked demo seed + stock assets

### Phiên trước (2026-06-25) — Vercel deploy · Mobile scroll UX · Sidebar mobile scroll

#### Deploy Vercel + Turso (project `huutai-lims-m929`) ✅ (code + env)

- **Nguyên nhân login fail:** project `huutai-lims-m929` **thiếu** `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (chỉ có `DATABASE_URL` local)
- ✅ Token Turso mới → cập nhật `.env` local
- ✅ Vercel CLI link `huutai/huutai-lims-m929` · set env Production + Preview: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`
- ✅ `npx vercel --prod` — deploy OK
- ✅ Script tiện ích: [`scripts/set-vercel-turso-env.ps1`](scripts/set-vercel-turso-env.ps1)
- ⏳ **QA user:** login `smartai0101@gmail.com` / `Admin@123456` trên https://huutai-lims-m929.vercel.app

**Lưu ý:** Có 2 project Vercel — `huutai-lims-m929` (prod user) vs `huutai-lims` — đừng nhầm khi set env.

#### Mobile swipe scroll — bảng + filter ✅

- ✅ [`components/TouchHorizontalScroll.tsx`](components/TouchHorizontalScroll.tsx) — scroll ngang + fade mép (mobile)
- ✅ [`components/FilterChipBar.tsx`](components/FilterChipBar.tsx) — filter chips vuốt ngang + snap
- ✅ [`components/DataTable.tsx`](components/DataTable.tsx) — bọc `TouchHorizontalScroll` · `stickyLeadingColumns` (default 1, catalog dùng 2)
- ✅ [`app/globals.css`](app/globals.css) — `.touch-scroll-x`, `.touch-scroll-y`, `.scrollbar-hide`
- ✅ Filter migrated: `StandardsClient`, `ChemicalsClient`, `MicrobialStrainsClient`, `ModuleCrudClient`, 8+ equipment clients

#### Sidebar mobile — vuốt cuộn menu chính ✅

- ✅ [`components/TouchVerticalScroll.tsx`](components/TouchVerticalScroll.tsx) — scroll dọc + fade trên/dưới (`fadeClassName="from-slate-950"`)
- ✅ [`components/Sidebar.tsx`](components/Sidebar.tsx) — shell `flex h-full min-h-0 flex-col` · nav trong `TouchVerticalScroll` · desktop `flex` · mobile drawer scroll · lock `body overflow` khi menu mở

#### Phát hiện — Upload file trên Vercel 🔴 (chưa fix)

- COA / equipment file ghi [`lib/coa-upload.ts`](lib/coa-upload.ts) → `public/uploads/*` — **không chạy trên Vercel** (read-only FS)
- Local dev OK · prod → server error 500 khi đính kèm file
- **Fix phiên sau:** Vercel Blob hoặc S3/R2 · refactor `coa-upload.ts` + `equipment-upload.ts`

### Phiên trước (2026-06-25) — Session/Sidebar fix · Turso seed · Deploy docs

#### Fix sidebar trống (JWT ↔ DB lệch) ✅

- **Triệu chứng:** Sidebar trống · Topbar "User" / "Viewer" giả · middleware cho vào app nhưng `SessionProvider` nhận `null`
- **Nguyên nhân:** Cookie JWT hợp lệ nhưng user không còn trong DB (sau reset/seed)
- ✅ [`lib/auth/session.ts`](lib/auth/session.ts) — `getSessionUser()` **read-only** (không `clearSessionCookie` trong layout — Next.js 16 cấm)
- ✅ [`lib/auth/public-paths.ts`](lib/auth/public-paths.ts) — `/login`, `/access-denied`
- ✅ [`middleware.ts`](middleware.ts) — `x-pathname`; xóa cookie `/login?reason=session` (chặn redirect loop)
- ✅ [`app/layout.tsx`](app/layout.tsx) — redirect protected → `/login?reason=session`
- ✅ [`components/SessionProvider.tsx`](components/SessionProvider.tsx) — `role: null` khi chưa auth
- ✅ [`components/auth/LoginForm.tsx`](components/auth/LoginForm.tsx) — banner phiên hết hạn

#### Deploy Turso + tài liệu ✅

- ✅ [`DEPLOY.md`](DEPLOY.md) · [`scripts/deploy-check.ps1`](scripts/deploy-check.ps1)
- ✅ [`scripts/setup-vercel-db.ts`](scripts/setup-vercel-db.ts) — `prisma migrate diff` + `@libsql/client` (Prisma CLI không push `libsql://`)
- ✅ Turso **seeded:** `libsql://huutai-lims-smartai0101-afk.aws-ap-northeast-1.turso.io`
- ✅ Vercel env + redeploy — xem § Completed Work phiên này

### Phiên trước (2026-06-25) — Auth/RBAC + Phân quyền sidebar + Turso/Vercel

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

#### Phân quyền 1-1 với sidebar (25 quyền) ✅

- ✅ Registry chung [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts) — 3 nhóm · 23 key tiếng Việt
- ✅ Sidebar + middleware + Admin UI dùng cùng registry
- ✅ Role defaults: LM/Analyst write materials+equipment+tasks; QA/QC read+reports; Viewer read-only
- ✅ Checkbox Admin = quyền **bổ sung** (role default không hiển thị tick)

#### Deploy Vercel — Turso adapter ✅ (code)

- ✅ `@libsql/client` + `@prisma/adapter-libsql` — [`lib/db.ts`](lib/db.ts) auto Turso khi có env
- ✅ JWT tách [`lib/auth/jwt.ts`](lib/auth/jwt.ts) — middleware không load Prisma
- ✅ Login try/catch — message rõ khi thiếu DB/SESSION_SECRET
- ✅ `npm run db:setup-remote` · [`.env.example`](.env.example) · [`DEPLOY.md`](DEPLOY.md)
- ✅ Turso DB tạo + seed (phiên session fix) — còn **Vercel env + Redeploy**

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
**Route/middleware:** **24** permission keys — [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts).  
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
| Usage log chưa chọn lot cụ thể | 🟢 | Lot picker bắt buộc khi ≥2 lot (`d8adfa0`) |
| Catalog CRUD sửa quantity trực tiếp | 🟡 | Server guard · UI read-only chưa làm |
| Chưa UI InventoryTransaction / Staff | 🟢 | `/inventory-ledger` + `/admin/people` |
| Container vs catalog tồn kho | 🟡 | Legacy; luồng mới dùng StockLot · deprecate Container chưa làm |
| Chưa commit sticky header + viewport | 🟢 | Commit `d8adfa0` |
| Prisma stale client (Turbopack) | 🟢 | Fix `lib/db.ts` Proxy — restart dev nếu tái phát |
| DetailDrawer che ModalShell | 🟢 | `z-[70]` / `z-[80]` / `z-[90]` |

---

## 8. Pending Tasks

### Ưu tiên 0 — Commit Nhân sự `/admin/people` ✅ (commit `d04f674`)

- [x] Gộp `admin_users` + `admin_staff` → `admin_people` (24 quyền sidebar)
- [x] `/admin/people` — `AdminPeopleClient` + `admin-people.ts`
- [x] FK `User.staffId` · migration `20260626_user_staff_link`
- [x] Redirect `/admin/users`, `/admin/staff` → `/admin/people`
- [x] **Commit** `d04f674`
- [x] **Turso prod:** apply migration `20260626_user_staff_link`
- [ ] **Local:** `npm run db:seed` nếu thiếu permission `admin_people`

### Ưu tiên 1 — Lịch sử pha chế ISO/IEC 17025 ✅ (Phase 1–4 done · QA browser pass 2026-06-27)

> **Plan đầy đủ:** [`PLAN-preparation-iso.md`](PLAN-preparation-iso.md)  
> **Quyết định:** Mở rộng `PreparedChemical`/`PreparedStandard`/`PreparedStrain` — **không** tạo `PreparationBatch` trùng. Dữ liệu cũ backfill `workflowStatus = Approved`.

**Phase 1 — Schema + audit** ✅ (`0d9518f`)
- [x] Migration `20260627_preparation_iso`: workflowStatus, Staff FKs, deletedAt, `PreparationHistory`, `PreparationAuditLog`
- [x] `lib/services/preparation-workflow.ts` + hook `prepared-chemicals.ts`, `prepared-standards.ts`, `modules.ts`
- [x] `scripts/backfill-preparation-history.ts`
- [x] **Turso prod:** apply migration + backfill (12 bản ghi)

**Phase 2 — Workflow UI** ✅ (`0d9518f`)
- [x] FSM Draft→Prepared→Checked→Approved→Cancelled · amendment bắt buộc lý do
- [x] 3 Prepared*Client: tabs Lịch sử / Truy xuất · soft delete · Staff picker
- [x] **Fix soft delete code** (`4bbcb0b`) — `lib/prepared-code-guard.ts` · archive mã ghost
- [x] **QA browser:** Draft → Prepared (trừ tồn) → Checked → Approved (`PCHEM-QA-001`) · xóa mềm + tái sử dụng mã TG2 ✅

**Phase 3 — Traceability** ✅ (`aa305a5`)
- [x] `preparation-traceability.ts` · cây PSTD-0006→PSTD-0005→STD-0007
- [x] Reverse lookup catalog gốc · `/preparation/[type]/[id]`
- [x] Tab **Truy xuất** thay placeholder
- [ ] **QA browser prod/local:** tab Truy xuất · link reverse trên `/standards`

**Phase 4 — Báo cáo** ✅
- [x] `/preparation-history` · export Excel 14 cột · nav `preparation_history`
- [x] Cập nhật `prepared-excel.ts` / import · seed chain trong `links.ts`
- [x] **QA browser:** export Excel 14 cột · toast 26 dòng · filter search `PCHEM-QA-001` ✅

**Turso prod migrate (dùng script — không `prisma db execute` trực tiếp):**

```powershell
$env:NODE_ENV="production"
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260626_user_staff_link/migration.sql
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260627_preparation_iso/migration.sql
npx tsx scripts/backfill-preparation-history.ts
npx tsx scripts/backfill-archived-prepared-codes.ts
```

### Ưu tiên 0 — Prod ops + deploy ✅ (done phiên 2026-06-27)

- [x] **Push branch** `cursor/mobile-scroll-vercel-session` (HEAD `8d21c3a`)
- [x] **Turso prod:** `user_staff_link` + `preparation_iso` + backfill preparation history
- [x] **Turso prod:** backfill specs TB (27 skip — đã có)
- [x] **Redeploy prod:** https://huutai-lims-m929.vercel.app
- [ ] **Vercel env:** `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` (nếu chưa set)
- [ ] **Local seed** nếu thiếu quyền: `npm run db:seed`

### Ưu tiên 0 — QA browser prod 🟡

- [ ] Login prod: `smartai0101@gmail.com` / `Admin@123456`
- [ ] **`/`** — KPI dashboard + alerts (StockLot, không mock)
- [ ] **`/reports`** — export CSV từng loại
- [ ] **`/inventory-ledger`** — filter + export
- [ ] **`/admin/people`** — CRUD nhân sự (user + staff)
- [ ] **`/usage-logs`** — lot picker với vật tư ≥2 lot
- [ ] **`/equipment/catalog`** — in tem nhãn (EQ-AUT-001, EQ-BAL-001)
- [ ] **Notification bell** sau Turso migrate
- [ ] **Sticky header** desktop/mobile trên catalog tables
- [ ] **`/prepared-standards`** — workflow · tab Truy xuất PSTD-0006 · đổi mã TG2 sau xóa mềm

**File đọc khi QA:**

| Mục đích | File |
|----------|------|
| Dashboard | `lib/services/dashboard.ts`, `components/dashboard/DashboardClient.tsx` |
| Reports | `lib/services/reports.ts`, `components/reports/ReportsClient.tsx` |
| Nhân sự | `components/admin/AdminPeopleClient.tsx`, `lib/actions/admin-people.ts` |
| Ledger | `lib/services/inventory-ledger.ts`, `components/inventory-ledger/InventoryLedgerClient.tsx` |
| Cron alerts | `app/api/cron/proactive-alerts/route.ts`, `lib/services/proactive-alerts.ts` |

### Ưu tiên 1 — Tùy chọn / tương lai (chưa làm)

- [ ] **Purity/uncertainty theo StockLot** — migration + UI (plan 2.5)
- [ ] **Deprecate Container model** — migration plan (plan 3.3)
- [ ] **Catalog UI read-only quantity** khi đã có StockLot (server guard đã có)
- [ ] **Turso token rotate** sau go-live
- [ ] **Barcode/QR** trên tem nhãn thiết bị
- [ ] **Import P2:** gộp preview+import · transaction batch lớn hơn

### Ưu tiên 0 — Notification system ✅ (code · QA + Turso pending)

- [x] Prisma `Notification` + `NotificationRead` + migration `20260626_notifications`
- [x] `lib/notifications/*` + `logActivity` wrapper · API 4 route · bell + `/notifications`
- [x] Wire `logActivity` ~19 server actions + tasks
- [x] `scripts/test-notifications.ts` pass · commit `ed32b5b` pushed
- [ ] **Turso prod:** apply migration `20260626_notifications` (xem § Completed Work)
- [x] **Redeploy Vercel** 2026-06-26 (`dpl_hA5ZQf4JWL7Bq7uo9zFGRVZ4dJpH`) — **cần redeploy lại từ `d8adfa0`**
- [ ] **QA browser:** CRUD `/chemicals` → user khác thấy badge · approve disposal → action Approved
- [ ] **QA:** `/notifications` filter module/thời gian · mark read · Viewer không thấy module bị revoke

**File đọc khi sửa:**

| Mục đích | File |
|----------|------|
| Core | `lib/notifications/*`, `lib/audit.ts` |
| API | `app/api/notifications/*` |
| UI | `components/notifications/*`, `components/Topbar.tsx` |
| Route access | `lib/auth/nav-permissions.ts` |

### Ưu tiên 0 — Cột Thông số kỹ thuật TB ✅ (code · QA pending)

- [x] Cột bảng Hãng SX → Thông số kỹ thuật → Bộ phận · wrap text
- [x] Import/export Excel + form · seed 27 mã · backfill script
- [x] Commit `ed32b5b`
- [ ] **QA browser:** `/equipment/catalog` — thứ tự cột · EQ-AUT-001/BAL-001 hiển thị specs
- [ ] **QA:** Export → Import round-trip cột specs · form Thêm/Sửa lưu đúng
- [ ] **Turso/prod backfill:** `npx tsx scripts/backfill-equipment-specifications.ts` (với `NODE_ENV=production` + Turso env)

### Ưu tiên 0 — In tem nhãn thiết bị ✅ (commit `d8adfa0` · QA pending)

- [x] Checkbox chọn + nút In tem nhãn toolbar · preview modal · `window.print()` A4 grid
- [x] Profile ladder 6 mức (7×5cm 8pt → 7×6cm 6.3pt) · nhãn rút gọn · logo căn giữa
- [x] `public/sci-tech-logo.png` · `npx tsc --noEmit` + `next build` pass
- [x] **Commit** `d8adfa0`
- [ ] **QA browser prod:** `/equipment/catalog` — chọn EQ-AUT-001 + EQ-BAL-001 · preview · in Scale 100%
- [ ] **QA:** EQ-AUT-001 không tràn · EQ-BAL-001 font 8pt · logo giữa khung · in nhiều tem A4

**File đọc khi sửa:**

| Mục đích | File |
|----------|------|
| Mapper + profiles | `lib/equipment-label-print.ts` |
| Tem + CSS | `components/equipment/EquipmentLabelPrint.tsx`, `equipment-label-print.css` |
| Preview | `components/equipment/EquipmentLabelPreviewModal.tsx` |
| Catalog wiring | `components/equipment/EquipmentCatalogClient.tsx`, `EquipmentModuleShell.tsx` |
| Logo | `public/sci-tech-logo.png` |

### Ưu tiên 0 — Sticky header + scroll viewport (bỏ pin cột) ✅ (commit `d8adfa0` · QA pending)

> **Bối cảnh:** User feedback — pin cột trái/phải gây chồng chéo. Chỉ giữ sticky `<thead>` + viewport cuộn.

- [x] Refactor [`components/DataTable.tsx`](components/DataTable.tsx) — bỏ pin cột · `lg:sticky lg:top-0` trên mọi `<th>`
- [x] [`.table-scroll-viewport`](app/globals.css) — max-height + overflow auto desktop
- [x] Xóa `lib/table-pin.ts`, `useTableColumnPinOffsets.ts`
- [x] Gỡ `pinPreset` khỏi clients
- [x] Reorder `storageLocation` cuối bảng catalog (giữ thứ tự user chọn)
- [x] `npx tsc --noEmit` pass
- [x] **Commit** `d8adfa0`
- [ ] **QA desktop:** `/chemicals`, `/standards` — cuộn dọc header cố định · cuộn ngang không pin · không overlap
- [ ] **QA mobile 375px:** vuốt ngang · không sticky body

### Ưu tiên 0 — Extended seed demo ✅ (code · QA pending)

- [x] `prisma/seed-data/` — ~20 master/nhóm + cross-links + lifecycle
- [x] 16 ảnh stock `public/seed-assets/`
- [x] `scripts/verify-seed-links.ts` pass
- [x] Turso prod seed 2026-06-26
- [ ] **Local seed** nếu dev DB chưa có data: `npm run db:seed`
- [ ] **QA prod:** PCHEM-0002, PSTD-0005, `/equipment/history` gallery · spare parts

### Ưu tiên 0 — Fix Import Excel catalog ✅ (P0 code xong · QA browser pending)

> **Bối cảnh:** P0 đã implement phiên 2026-06-26. Còn QA thủ công + P1 tối ưu.

- [x] **P0 — UX loading:** `ExcelImportDialog` dùng `phase` state · bỏ `useTransition` lồng nhau · `onImported` → `void router.refresh()`
- [x] **P0 — `ensureMaster` round-trip:** `tryReuseMasterByCode` + message identity rõ
- [x] **P0 — Error propagation:** `bulkImportCatalog` trả `errors[]` · panel vàng đầy đủ
- [x] **P1 — Giảm query:** Batch preload master + `StockLot` trong `importCatalogLotRows` (`d8adfa0`)
- [ ] **P1 — Gộp preview + import:** 1 server action hoặc skip preview sau confirm merge
- [ ] **P2 — Transaction:** Gom nhiều dòng vào ít transaction hơn
- [ ] **QA browser sau fix:**
  - Export `/standards` → Import lại cùng file · lot mới grouped → thành công · nút không kẹt
  - Import lại file · lot trùng DB → dialog cộng tồn
  - Sửa tên/hãng Excel khác DB → message identity rõ
  - Lặp 3 trang catalog gốc + 3 trang pha chế

**File đã sửa (P0):**

| File | Việc |
|------|------|
| [`lib/stock-in-master.ts`](lib/stock-in-master.ts) | `tryReuseMasterByCode` |
| [`lib/services/stock-in-match.ts`](lib/services/stock-in-match.ts) | `existingCodeIdentityMismatchMessage` |
| [`lib/catalog-import.ts`](lib/catalog-import.ts) | Prefix lỗi theo dòng |
| [`lib/actions/catalog-import.ts`](lib/actions/catalog-import.ts) | Trả `errors` khi fail |
| [`components/ExcelImportDialog.tsx`](components/ExcelImportDialog.tsx) | `phase` loading · try/catch/finally |
| Catalog/prepared clients | `onImported` callback |

### Ưu tiên 0 — Module Thiết bị navigation UX ✅ (code · QA pending)

- [x] `app/equipment/layout.tsx` — `EquipmentAppShell` dùng chung
- [x] `app/equipment/loading.tsx` — skeleton khi chuyển route
- [x] Gỡ shell trùng khỏi 11 equipment clients
- [ ] **QA browser:** Chuyển 3–4 submenu Thiết bị lần đầu — không loá sáng · so với `/standards` → `/chemicals`

### Ưu tiên 0 — Export/Import Excel (6 trang) 🟡

- [x] Catalog gốc: Export/Import Excel + round-trip columns + preview trùng lot
- [x] Pha chế: Export multi-row + import metadata/components
- [x] Desktop scrollbar bảng (`TouchHorizontalScroll`)
- [x] Fix import P0 (kẹt loading + round-trip trùng mã)
- [x] `npx tsc --noEmit` pass
- [x] **Commit** Excel + import fix + equipment layout (`e31304b`, `957cbdf`, `ede088c`, `7e5ff9f`) · branch pushed
- [ ] QA local catalog gốc: Export → Import round-trip (6 trang)
- [ ] Viewer không thấy nút Import

### Ưu tiên 0 — Trang Tài khoản 🟡

- [x] UI `/account` — tên, avatar, mật khẩu · Topbar link
- [x] Migration local + Turso `20260625_user_avatar`
- [x] Fix dev DB routing (`lib/db.ts`)
- [x] Commit `d183d4d` + redeploy prod
- [x] Turso prod: apply `avatarUrl`
- [x] Avatar upload code → Vercel Blob (`lib/file-storage.ts`)
- [ ] **QA local:** đổi tên → Topbar · upload avatar · đổi mật khẩu · Viewer vào `/account`
- [ ] **QA prod:** `/account` sau redeploy · avatar upload (cần `BLOB_READ_WRITE_TOKEN`)

### Ưu tiên 0 — Deploy Vercel + Turso 🟡

- [x] Tạo database Turso — `huutai-lims-smartai0101-afk` (ap-northeast-1)
- [x] Local `.env`: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` + `SESSION_SECRET`
- [x] **Redeploy Vercel** 2026-06-26 — `dpl_hA5ZQf4JWL7Bq7uo9zFGRVZ4dJpH` → https://huutai-lims-m929.vercel.app
- [ ] **Turso prod:** migration `20260626_notifications` + backfill specs TB (nếu chưa chạy)
- [ ] **QA login prod** `smartai0101@gmail.com` / `Admin@123456` · sidebar 3 nhóm · in tem nhãn `/equipment/catalog`
- [ ] Rotate Turso token (token đã lộ chat) → token mới → `.env` + Vercel + redeploy

**Redeploy nhanh:** `npx vercel --prod --yes` (project `huutai-lims-m929`)

**Env Vercel** (đã set — rotate token khi cần):

| Biến | Giá trị |
|------|---------|
| `TURSO_DATABASE_URL` | `libsql://huutai-lims-smartai0101-afk.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | (trong `.env` local — **không commit**) |
| `SESSION_SECRET` | (trong `.env` local) |

**Redeploy nhanh:** `npx vercel link --project huutai-lims-m929` → `npx vercel --prod`

### Ưu tiên 0 — Upload file production (Vercel) 🟡

- [x] Chọn storage: **Vercel Blob**
- [x] Refactor [`lib/coa-upload.ts`](lib/coa-upload.ts) + [`lib/equipment-upload.ts`](lib/equipment-upload.ts) + [`lib/avatar-upload.ts`](lib/avatar-upload.ts) → [`lib/file-storage.ts`](lib/file-storage.ts)
- [ ] **Env Vercel:** `BLOB_READ_WRITE_TOKEN` (Storage → Blob → link project `huutai-lims-m929`) → redeploy
- [ ] QA prod: COA `/standards` · upload thiết bị · avatar `/account`

### Ưu tiên 1 — Mobile UX QA 🟡

- [x] Bảng vuốt ngang + filter chips (`TouchHorizontalScroll`, `FilterChipBar`, `DataTable`)
- [x] Sidebar mobile vuốt dọc menu (`TouchVerticalScroll`)
- [ ] **QA desktop sticky header:** `/chemicals`, `/standards` — cuộn dọc header cố định · cuộn ngang không pin cột · không overlap
- [ ] QA thiết bị thật / DevTools 375px: `/chemicals`, `/standards`, `/microbial-strains` — vuốt ngang **không sticky cột** · filter chips · menu hamburger vuốt tới Quản trị
- [ ] QA prod extended seed: `/chemicals`, `/standards`, `/equipment/catalog`, `/equipment/history` — cross-links + ảnh seed
- [ ] (Tuỳ chọn) Migrate filter chips còn lại: `ContainersClient`, `StatisticsClient`, `UsageLogsClient`, `PreparedChemicalsClient`, `PreparedStandardsClient`

### Ưu tiên 0 — Session / Sidebar QA (local)

- [ ] Login Admin local → sidebar đủ 3 nhóm · Topbar "System Admin"
- [ ] Cookie stale: vào `/` với JWT cũ → redirect `/login?reason=session` + banner (không crash cookie)
- [ ] Login Viewer `viewer@demo.local` / `Demo@123456` → sidebar vật tư + thiết bị (không Quản trị)

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
npx tsx scripts/test-notifications.ts
npm run build
# Turso prod notification migrate (một lần):
# npx prisma db execute --file prisma/migrations/20260626_notifications/migration.sql --schema prisma/schema.prisma
# Turso/prod backfill specs TB:
# $env:NODE_ENV="production"; npx tsx scripts/backfill-equipment-specifications.ts
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
npx prisma db execute --file prisma/migrations/20260625_user_avatar/migration.sql --schema prisma/schema.prisma
npx prisma db execute --file prisma/migrations/20260626_notifications/migration.sql --schema prisma/schema.prisma
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

URL: **http://localhost:3000**

**Lưu ý dev:** Nếu `.env` có `TURSO_*`, app dev vẫn dùng SQLite nhờ [`lib/db.ts`](lib/db.ts) — không cần xóa Turso env.

### Port 3000 bị chiếm / EPERM prisma generate

```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
npx prisma generate
npm run dev
```

### Nếu vẫn Runtime Error sau đổi schema

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

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
Đọc HANDOFF.md (§ Ghi chú phiên + § Lịch sử pha chế ISO) và PLAN-preparation-iso.md.
Triển khai Phase 3 ISO (preparation-traceability + tab Truy xuất + reverse lookup catalog).
Hoặc Track A: push branch + Turso migrate (user_staff_link, preparation_iso, notifications) + redeploy prod.
Chỉ đọc file liên quan — không scan toàn repo.
```

**Turso migration preparation ISO (prod — một lần):**

```powershell
npx prisma db execute --file prisma/migrations/20260627_preparation_iso/migration.sql --schema prisma/schema.prisma
npx tsx scripts/backfill-preparation-history.ts
```

**Turso migration notifications (prod — một lần):**

```powershell
npx prisma db execute --file prisma/migrations/20260626_notifications/migration.sql --schema prisma/schema.prisma
$env:NODE_ENV="production"; npx tsx scripts/backfill-equipment-specifications.ts
```

**Turso migration avatarUrl:** ✅ đã apply (2026-06-26) — `scripts/apply-turso-migration.ps1`

**Turso full re-seed (nếu cần):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-check.ps1
npm run db:setup-remote
```

**Vercel env tối thiểu:** `TURSO_DATABASE_URL` · `TURSO_AUTH_TOKEN` · `SESSION_SECRET` · **`CRON_SECRET`** · **`BLOB_READ_WRITE_TOKEN`** → Redeploy.

**Admin seed:** `smartai0101@gmail.com` / `Admin@123456`

---

## Sidebar (cấu trúc hiện tại)

| Nhóm | localStorage | Sub-items |
|------|--------------|-----------|
| **Hoá chất - Chuẩn - Chủng** | `materials-nav-open` | 11 — xem §1 |
| **Thiết bị** | `equipment-nav-open` | 9 — xem § Module Thiết bị |
| **Quản trị** | `admin-nav-open` | 3 — **Nhân sự** · Phân quyền · Giao việc |

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

### Layout shell (navigation UX — 2026-06-26)

- [`app/equipment/layout.tsx`](app/equipment/layout.tsx) — bọc `{children}` bằng `EquipmentAppShell` (AppShell + breadcrumb **giữ nguyên** khi chuyển submenu)
- [`app/equipment/loading.tsx`](app/equipment/loading.tsx) — skeleton `h-40 animate-pulse` trong layout (không remount shell)
- Clients **không** bọc `EquipmentAppShell` nữa — chỉ nội dung trang

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

> **Session thật** — JWT cookie · middleware · **25 quyền sidebar**. Plan: [PLAN-auth-rbac.md](./PLAN-auth-rbac.md)

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
| Quản trị (3) | `admin_people`, `admin_permissions`, `admin_tasks` |

**File đọc khi sửa Auth:**

| Mục đích | File |
|----------|------|
| Nav + route permission | `lib/auth/nav-permissions.ts` |
| Role defaults | `lib/auth/permissions.ts` |
| Session / JWT | `lib/auth/session.ts`, `lib/auth/jwt.ts` |
| Guards | `lib/auth/guards.ts`, `lib/equipment-auth.ts` |
| UI | `components/SessionProvider.tsx`, `components/Sidebar.tsx`, `components/admin/*` |
| Actions | `lib/actions/auth.ts`, `admin-people.ts`, `admin-permissions.ts`, `tasks.ts` |

---

## Deploy Vercel + Turso

SQLite `file:./dev.db` **không** chạy trên Vercel. Production dùng **Turso** (libSQL).

**Turso DB hiện tại:** `libsql://huutai-lims-smartai0101-afk.aws-ap-northeast-1.turso.io` — đã `db:setup-remote`.

**Hướng dẫn đầy đủ:** [`DEPLOY.md`](DEPLOY.md)

### Env Vercel (Settings → Environment Variables)

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `TURSO_DATABASE_URL` | ✅ | `libsql://xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | ✅ | Token từ Turso dashboard |
| `SESSION_SECRET` | ✅ | ≥ 16 ký tự (khuyến nghị ≥ 32) |
| `BLOB_READ_WRITE_TOKEN` | 🟡 | Vercel Blob — cần cho upload COA/thiết bị/avatar prod |
| `SESSION_MAX_AGE` | — | Mặc định 604800 |

### Setup DB remote (một lần, từ local)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-check.ps1
npm run db:setup-remote
```

Script: `prisma migrate diff --from-empty` → SQL apply qua `@libsql/client` → `prisma/seed.ts` (runtime qua `lib/db` + `TURSO_*`).

**Lưu ý:** `prisma db push` với `libsql://` **không** hoạt động (P1012 — sqlite provider cần `file:`). Dùng script trên, không push trực tiếp.

### Runtime

[`lib/db.ts`](lib/db.ts): Production dùng Turso khi có `TURSO_*`. **Dev:** nếu `DATABASE_URL=file:` → SQLite local (bỏ qua `TURSO_*`).

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| Crash `getSessionUser` / `avatarUrl` column | Dev trỏ Turso thiếu cột hoặc Prisma client cũ | Fix `lib/db.ts` dev routing · `prisma generate` · restart dev · xóa `.next` |
| Vercel "server error" khi login | Thiếu `TURSO_*` trên project đúng | Set env `huutai-lims-m929` (không nhầm `huutai-lims`) + redeploy |
| Upload COA/file/avatar 500 trên prod | Thiếu `BLOB_READ_WRITE_TOKEN` hoặc chưa redeploy | Tạo Blob store trên Vercel → set env → redeploy |
| "SESSION_SECRET must be set" | Thiếu env | Set trên Vercel, redeploy |
| Login OK local, fail prod | Chỉ có `dev.db` local / thiếu Turso env | Turso + env Vercel |

**File:** [`.env.example`](.env.example), [`DEPLOY.md`](DEPLOY.md), [`scripts/setup-vercel-db.ts`](scripts/setup-vercel-db.ts), [`scripts/deploy-check.ps1`](scripts/deploy-check.ps1)

---

## Quy tắc cho agent tiếp theo

- Đọc **HANDOFF.md** trước khi code
- **Không** scan toàn bộ repo
- Chỉ đọc file liên quan trực tiếp task
- **Không** revert: … **Plan LIMS** (`d8adfa0` — dashboard, reports, staff, ledger, cron), **In tem nhãn thiết bị**, **Notification system** (`ed32b5b`), **Cột Thông số kỹ thuật TB**, **Trang Tài khoản**, **dev DB routing**, **Vercel Blob** (`lib/file-storage.ts`), **Export/Import Excel catalog** (6 trang), **Fix import P0**, **Equipment layout shell** — trừ khi user yêu cầu
- Không commit trừ khi user yêu cầu
- Sau mỗi task: báo file sửa + `npx tsc --noEmit`

---

## Ghi chú phiên làm việc

- **Phiên kết thúc (2026-06-27 — buổi 2):**
  - **ISO Phase 3:** `aa305a5` — traceability tree · tab Truy xuất · reverse lookup · `/preparation/[type]/[id]`
  - **Prod ops:** Push · Turso migrate (`apply-migration-turso.ts`) · backfill history · Vercel redeploy
  - **Fix TG2:** `4bbcb0b` — `prepared-code-guard.ts` · archive mã soft-deleted · auto-release ghost
  - **Helper:** `a05132c` — `apply-migration-turso.ts` (Prisma CLI + `file:` local ≠ Turso prod)
  - **HANDOFF:** `8d21c3a` + cập nhật phiên này
  - **Kiểm tra:** `npx tsc --noEmit` pass
- **Dev local:** http://localhost:3000 · `DATABASE_URL=file:./dev.db` · TG2 ghost → `TG2__deleted__86e5acb3`
- **Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD **`8d21c3a`** (sau commit HANDOFF mới) · **đã push**
- **Prod:** https://huutai-lims-m929.vercel.app · deploy `4bbcb0b`+ · Turso ISO migrated

### Ưu tiên phiên sau

**Track A — QA browser ISO (ngắn)**
1. Workflow pha chế Draft→Approved · amend · soft delete + tái sử dụng mã
2. Tab Truy xuất PSTD-0006 · reverse STD-0007
3. `/preparation-history` — filter + export Excel 14 cột
3. `/admin/people` · dashboard · reports · notification bell

**Track C — Merge PR**
1. `cursor/mobile-scroll-vercel-session` → `main` · QA prod checklist §8

### Recommended Next Prompt

```
Đọc HANDOFF.md (§ Ghi chú phiên + § Lịch sử pha chế ISO) và PLAN-preparation-iso.md.
QA browser checklist §8 (workflow pha chế · Truy xuất PSTD-0006 · /preparation-history export).
Hoặc merge PR cursor/mobile-scroll-vercel-session → main.
Chỉ đọc file liên quan — không scan toàn repo.
```

### File tham chiếu (ISO pha chế — Phase 1–4 done · QA pending)

| Mục đích | File |
|----------|------|
| **Plan đầy đủ** | [`PLAN-preparation-iso.md`](PLAN-preparation-iso.md) |
| **Traceability** | `lib/services/preparation-traceability.ts`, `components/preparation/PreparationTraceTree.tsx`, `CatalogPreparedDerivatives.tsx` |
| **Soft delete code** | `lib/prepared-code-guard.ts`, `scripts/backfill-archived-prepared-codes.ts` |
| **Turso migrate** | `scripts/apply-migration-turso.ts` |
| Migration | `prisma/migrations/20260627_preparation_iso/migration.sql` |
| Workflow core | `lib/services/preparation-workflow.ts`, `lib/services/preparation-transition-stock.ts` |
| Actions transition | `lib/actions/preparation-workflow.ts` |
| Actions CRUD | `lib/actions/prepared-chemicals.ts`, `prepared-standards.ts`, `modules.ts` |
| History timeline | `lib/services/preparation-history.ts`, `scripts/backfill-preparation-history.ts` |
| History report | `lib/services/preparation-history-report.ts`, `app/preparation-history/page.tsx`, `components/preparation/PreparationHistoryReportClient.tsx` |
| Detail route | `app/preparation/[type]/[id]/page.tsx` |
| UI shared | `components/preparation/*` |
| Seed chain demo | `prisma/seed-data/links.ts` (PSTD-0005→PSTD-0006) |

### File tham chiếu (Nhân sự `/admin/people` — commit `d04f674`)

| Mục đích | File |
|----------|------|
| Route + UI | `app/admin/people/page.tsx`, `components/admin/AdminPeopleClient.tsx` |
| Actions | `lib/actions/admin-people.ts` |
| Schema FK | `prisma/schema.prisma` (`User.staffId`), migration `20260626_user_staff_link` |
| Permissions | `lib/auth/nav-permissions.ts` (`admin_people`), `lib/auth/permissions.ts` |
| Redirect | `app/admin/users/page.tsx`, `app/admin/staff/page.tsx` |
| Seed backfill | `prisma/seed.ts` (`linkUsersToStaffByName`) |

### File tham chiếu (Plan LIMS — `d8adfa0`)

| Mục đích | File |
|----------|------|
| Dashboard | `app/page.tsx`, `lib/services/dashboard.ts`, `lib/services/alerts.ts`, `components/dashboard/DashboardClient.tsx` |
| Reports | `app/reports/page.tsx`, `lib/services/reports.ts`, `components/reports/ReportsClient.tsx` |
| Sổ cái | `app/inventory-ledger/page.tsx`, `lib/services/inventory-ledger.ts`, `components/inventory-ledger/InventoryLedgerClient.tsx` |
| Lot picker | `components/usage-logs/UsageLogsClient.tsx`, `lib/actions/usage-logs.ts` |
| Quantity guard | `lib/catalog-quantity-guard.ts`, `lib/actions/chemicals.ts`, `standards.ts`, `microbial-strains.ts` |
| Cron alerts | `app/api/cron/proactive-alerts/route.ts`, `lib/services/proactive-alerts.ts`, `vercel.json` |
| Legacy redirect | `app/solutions/page.tsx`, `app/transactions/page.tsx`, `app/inventory/page.tsx`, `app/alerts/page.tsx` |
| In tem nhãn | `lib/equipment-label-print.ts`, `components/equipment/EquipmentLabel*.tsx` |
| Sticky header | `components/DataTable.tsx`, `app/globals.css` |

### File tham chiếu (Notification system — `ed32b5b`)

| Mục đích | File |
|----------|------|
| Migration | `prisma/migrations/20260626_notifications/migration.sql` |
| Core | `lib/notifications/*`, `lib/audit.ts` (`logActivity`) |
| API | `app/api/notifications/*` |
| UI | `components/notifications/*`, `components/Topbar.tsx`, `app/notifications/page.tsx` |
| Route access | `lib/auth/nav-permissions.ts` |
| Test | `scripts/test-notifications.ts` |

### File tham chiếu (Cột Thông số kỹ thuật TB — mới `ed32b5b`)

| Mục đích | File |
|----------|------|
| UI bảng/form | `components/equipment/EquipmentCatalogClient.tsx` |
| Excel | `lib/equipment-fields.ts`, `lib/actions/equipment-catalog.ts` |
| Seed map | `prisma/seed-data/equipment-specifications.ts` |
| Backfill | `scripts/backfill-equipment-specifications.ts` |

### File tham chiếu (Extended seed — mới)

| Mục đích | File |
|----------|------|
| Seed modules | `prisma/seed-data/*.ts` |
| Wiring | `prisma/seed.ts` |
| Stock images | `public/seed-assets/`, `prisma/seed-data/assets.ts` |
| Verify links | `scripts/verify-seed-links.ts` |
| Generate placeholders | `scripts/generate-seed-assets.ts` |

### File tham chiếu (Fix import P0 — mới)

| Mục đích | File |
|----------|------|
| Master reuse by code | `lib/stock-in-master.ts`, `lib/services/stock-in-match.ts` |
| Import lot rows | `lib/catalog-import.ts` |
| Server actions | `lib/actions/catalog-import.ts` |
| Dialog loading UX | `components/ExcelImportDialog.tsx` |
| Refresh after import | `StandardsClient`, `ChemicalsClient`, `MicrobialStrainsClient`, prepared clients |

### File tham chiếu (Equipment layout shell — mới)

| Mục đích | File |
|----------|------|
| Shared shell | `app/equipment/layout.tsx`, `components/equipment/EquipmentAppShell.tsx` |
| Route loading | `app/equipment/loading.tsx` |
| Clients (shell removed) | `components/equipment/*Client.tsx` (11 file) |

### File tham chiếu (Export/Import Excel — mới)

| Mục đích | File |
|----------|------|
| Export rows + normalize import | `lib/catalog-excel.ts` |
| Import lot + preview duplicates | `lib/catalog-import.ts` |
| Duplicate helpers | `lib/excel-import-utils.ts` |
| ensureMaster (shared) | `lib/stock-in-master.ts` |
| Server actions catalog | `lib/actions/catalog-import.ts` |
| Server actions pha chế | `lib/actions/prepared-import.ts` |
| Column maps pha chế | `lib/prepared-excel.ts` |
| Column maps catalog | `lib/chemicals-fields.ts`, `lib/standards-fields.ts`, `lib/strains-fields.ts` |
| Dialog UI | `components/ExcelImportDialog.tsx` |
| Infra xlsx | `lib/excel.ts` |

### File tham chiếu (Trang Tài khoản)

| Mục đích | File |
|----------|------|
| Route | `app/account/page.tsx` |
| UI | `components/account/AccountClient.tsx` |
| Actions | `lib/actions/account.ts` |
| Upload local | `lib/avatar-upload.ts` |
| JWT refresh | `lib/auth/session.ts` → `refreshSessionCookie()` |
| Middleware route | `lib/auth/nav-permissions.ts` → `/account` → null |
| Login (đã dọn seed UI) | `components/auth/LoginForm.tsx` |
| Entry Topbar | `components/Topbar.tsx` |
| Migration | `prisma/migrations/20260625_user_avatar/migration.sql` |

### File tham chiếu (Session fix — đã xong)

| Mục đích | File |
|----------|------|
| Read-only session | `lib/auth/session.ts` |
| Public routes | `lib/auth/public-paths.ts` |
| Stale cookie + pathname | `middleware.ts` |
| Redirect no session | `app/layout.tsx` |
| Permission UI | `components/SessionProvider.tsx`, `components/Sidebar.tsx` |
| Login UX | `components/auth/LoginForm.tsx` |

### File tham chiếu (Auth RBAC — đã xong)

| Mục đích | File |
|----------|------|
| Nav registry | `lib/auth/nav-permissions.ts` |
| Session | `lib/auth/session.ts`, `lib/auth/jwt.ts` |
| Middleware | `middleware.ts` |
| Seed auth | `prisma/seed.ts` → `seedAuth()` |
