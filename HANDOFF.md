# Lab Inventory LIMS — HANDOFF

> **Cập nhật:** 2026-07-05 (buổi **25** · PP **Chất phân tích** multi-select + catalog **nhiều PP**/ĐVT/LOD + hiển thị Nền mẫu gọn) · **local uncommitted** · HEAD prod **`a682a5a`** · prod URL https://huutai-lims-m929.vercel.app  
> **Git branch:** `main` · **~95+ file modified + file mới** (buổi 17–25 LIMS ISO + catalog + PP) · **chưa commit / chưa push / chưa Turso prod**  
> **Plan buổi 22:** `.cursor/plans/lims_3_module_plan_c5e8cae0.plan.md` (5 phase — **đã implement local**)  
> **Plan buổi 23:** `.cursor/plans/unified_matrix_catalog_929968bd.plan.md` (catalog nhóm/nền mẫu — **đã implement local**)  
> **Plan buổi 24:** `.cursor/plans/excel_chỉ_tiêu_import_export_f1b57926.plan.md` (import/export Excel chỉ tiêu — **đã implement local**)  
> **Plan buổi 24 (bulk):** `.cursor/plans/bulk_chỉ_tiêu_catalog_ff09f53e.plan.md` (bulk Sửa/Ẩn/Xóa chỉ tiêu — **đã implement local**)  
> **Plan buổi 24–25 (PP):** `.cursor/plans/pp_nền_mẫu_dropdown_405359d5.plan.md` · `.cursor/plans/pp_multi_nền_mẫu_9e8a3263.plan.md` · `.cursor/plans/pp_nền_mẫu_gọn_d6285124.plan.md` (Nền mẫu — **đã implement local**)  
> **Plan buổi 25 (PP):** `.cursor/plans/pp_chất_phân_tích_95429c09.plan.md` (Chất phân tích multi-select — **đã implement local**)  
> **Plan buổi 25 (catalog):** `.cursor/plans/chỉ_tiêu_nhiều_pp_572e7d74.plan.md` (1 chỉ tiêu → nhiều PP · ĐVT/LOD riêng · PP chính — **đã implement local**)  
> **Plan tham chiếu cũ:** buổi 17–21 samples/analysis/delivery/COA — xem §2 lịch sử  
> **Mục đích:** Dùng file này để mở chat mới — **không scan toàn repo**. Đọc **§0** trước, rồi file liên quan trực tiếp.

---

## 0. Công việc phiên tiếp theo (buổi 26) — ƯU TIÊN

> **Trạng thái buổi 25:** PP **Chất phân tích** multi-select từ Danh mục chỉ tiêu ✅ · Catalog chỉ tiêu **nhiều PP** (Mã PP + ĐVT/LOD riêng + **PP chính**) ✅ · PP **Nền mẫu** multi + list gọn theo nhóm ✅ · migrations local **`20260717`–`20260720`** ✅ · `npx tsc --noEmit` ✅ · **chưa commit** · **chưa QA browser đầy đủ** · buổi 22–23 backlog **vẫn pending**

### Bắt buộc (trước deploy)

- [ ] **Dọn catalog nhóm trùng (local)** — backfill tạo nhóm `WATER`/`AIR` từ legacy `groupName`; chạy **Chuẩn hóa thứ tự** trên `/admin/catalog/matrix-groups` · **ẩn/xóa** nhóm nhập nhầm · gộp nền về **ENV (Môi trường)** nếu cần
- [ ] **QA browser form phiếu YC** — `/samples/requests/new`:
  - Chọn nhóm ở header → dropdown nền lọc đúng · toggle "Xem tất cả nền mẫu"
  - Gán nền → panel chỉ tiêu load · tick checkbox danh sách chỉ tiêu
  - SL/ĐVT/Điều kiện nhập được · Nhóm nền read-only (tự động)
  - Lưu nháp / Lưu & gửi · Excel import dòng mẫu
- [ ] **QA Admin catalog** — `/admin/catalog/matrix-groups` · `/admin/catalog/matrices` · `/admin/catalog/test-methods` · `/admin/catalog/mappings`:
  - Sidebar **không biến mất** khi chuyển giữa Nhóm nền / Nền mẫu / Chỉ tiêu / Mapping
  - Nền mẫu: sửa inline · ẩn · xóa (khi chưa dùng)
  - Chỉ tiêu: thêm · sửa · ẩn · xóa · chọn ĐVT từ list · **Export → sửa → Import** round-trip
  - Chỉ tiêu **Phương pháp thử**: gán **nhiều Mã PP** · mỗi PP có **ĐVT + LOD** riêng · đánh dấu **PP chính** (★) · list hiển thị 3 cột đồng bộ
  - Chỉ tiêu **bulk**: tick nhiều dòng → Sửa hàng loạt (chỉ Nhóm) · Ẩn · Xóa (skip khi `usageCount > 0`) · checkbox disabled khi đang sửa inline
  - Mapping: nền mới (vd. Thuốc viên) hiện **toàn bộ** chỉ tiêu · tick → panel phải tóm tắt theo nhóm · Lưu → chỉ tiêu xuất hiện trên phiếu YC
- [ ] **QA Phương pháp phân tích — Nền mẫu** — `/analytical-methods/new` · `/analytical-methods/[id]` · `/analytical-methods/list`:
  - Checkbox **Nền mẫu** · chọn nhiều → list gom nhóm: `Thực phẩm (6): Rau củ, Thịt +3` · hover tooltip đầy đủ
  - Bỏ hết tick → lưu được (0 nền) · search list theo tên nền
- [ ] **QA Phương pháp phân tích — Chất phân tích** — cùng routes:
  - Multi-select từ Danh mục chỉ tiêu · lọc nhóm + tìm mã/tên
  - List cột **Chất phân tích** gom theo nhóm chỉ tiêu (format giống Nền mẫu)
  - Đồng bộ hai chiều với catalog: tick PP trên tab Tổng quan ↔ link hiện trên `/admin/catalog/test-methods`
- [ ] **QA Catalog — chỉ tiêu ↔ PP** — `/admin/catalog/test-methods`:
  - Sửa chỉ tiêu → **+ Thêm PP** · 2 PP khác ĐVT/LOD · chọn **PP chính**
  - Phiếu YC: gán chỉ tiêu có 2 PP → `methodId` = PP chính (`resolvePrimaryMethodForTestMethod`)
- [ ] **Fix `startWorksheetAction` timeout** — Prisma transaction >5000ms (`lib/services/analysis/worksheet.ts`)
- [ ] **`npm run build`** — kill port 3000 trước (EPERM Prisma engine)
- [ ] **Commit + push** buổi 17–25 (~130+ file) — **KHÔNG** commit: `prisma/dev.db`, `.next/`, `public/uploads/coa/*.pdf`
- [ ] **Turso prod** — apply migrations pending (gồm buổi 22 + **`20260716`**–**`20260720`**):
  ```powershell
  $env:NODE_ENV="production"
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260715_lims_workflow_iso/migration.sql
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260716_sample_matrix_groups/migration.sql
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260717_analytical_method_matrix_fk/migration.sql
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260718_analytical_method_matrices/migration.sql
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260719_analytical_method_test_methods/migration.sql
  npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260720_method_test_method_params/migration.sql
  npx tsx scripts/seed-module-permissions-prod.ts
  npx tsx -e "import { db } from './lib/db'; import { seedLimsCatalog } from './prisma/seed-data/catalog/seed-catalog'; seedLimsCatalog(db).finally(() => db.$disconnect())"
  npx tsx scripts/backfill-analytical-method-matrix.ts
  npx tsx scripts/backfill-analytical-method-test-methods.ts
  ```
- [ ] **Redeploy Vercel** · smoke prod: `/samples/requests/new` · `/admin/catalog/test-methods` · `/analytical-methods/list`

### Nên làm (P1)

- [ ] **QA browser E2E buổi 22** — happy path PR → Issue · negative QC/SoD (checklist plan §12)
- [ ] Mở rộng **`scripts/verify-workflow-e2e.ts`** — 1 mẫu full pipeline
- [ ] **`sampleType` per line** — đồng bộ khi đổi nhóm header (đã có cơ bản; QA multi-group trên 1 phiếu)
- [ ] QA **COA SGS** · sidebar desktop scroll · nav **Customer Viewer**
- [ ] Admin catalog: **CRUD nhóm chỉ tiêu** (`TestCategory`) trên cùng trang chỉ tiêu (hiện chỉ chọn từ 7 nhóm seed)
- [ ] Admin catalog: cột **LOQ** trên danh mục chỉ tiêu (schema đã có `loq`)

### Defer (P2)

- [ ] PDF server-side · Email SMTP · Lock `methodVersionId` · Admin CRUD phòng ban/analyst · `BLOB_READ_WRITE_TOKEN`

### Lệnh setup local (chat mới — sau buổi 25)

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
npx prisma generate
npx prisma db push
npx tsx -e "import { db } from './lib/db'; import { seedLimsCatalog } from './prisma/seed-data/catalog/seed-catalog'; seedLimsCatalog(db).finally(() => db.`$disconnect())"
npx tsx scripts/verify-workflow-e2e.ts
npx tsx scripts/backfill-analytical-method-matrix.ts
npx tsx scripts/backfill-analytical-method-test-methods.ts
npx tsc --noEmit
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

**Route smoke buổi 23–25:**

| Khu vực | Route |
|---------|-------|
| Form phiếu YC | `/samples/requests/new` · `/samples/requests/[id]` |
| Admin catalog | `/admin/catalog/matrix-groups` · `/admin/catalog/matrices` · `/admin/catalog/test-methods` · `/admin/catalog/mappings` |
| Admin Quản trị | `/admin/people` · `/admin/permissions` · `/admin/tasks` (sidebar qua `app/admin/layout.tsx`) |
| Ma trận phiếu | `/samples/requests/[id]/matrix` |
| Phương pháp phân tích | `/analytical-methods/new` · `/analytical-methods/list` · `/analytical-methods/[id]` |

**File lõi buổi 25 (PP Chất phân tích + catalog nhiều PP):**

| File | Vai trò |
|------|---------|
| `prisma/migrations/20260719_analytical_method_test_methods/` | Junction M:N PP ↔ chỉ tiêu |
| `prisma/migrations/20260720_method_test_method_params/` | `unit` · `lod` · `loq` · `isPrimary` trên junction |
| `components/analytical-methods/MethodTestMethodMultiSelect.tsx` | Multi-select Chất phân tích (lọc nhóm + search) |
| `components/analytical-methods/MethodAnalyteListCell.tsx` | List gom theo `categoryName` |
| `components/admin/TestMethodMethodLinksEditor.tsx` | Catalog: nhiều PP · ĐVT/LOD · PP chính |
| `components/admin/TestMethodMethodsListCell.tsx` | Catalog list: 3 cột Mã PP / ĐVT / LOD |
| `lib/catalog/test-method-label.ts` | Label helpers Chất phân tích |
| `lib/catalog/test-method-method-label.ts` | Format Mã PP ★ + tooltip |
| `lib/services/catalog/test-methods.ts` | `syncTestMethodMethodLinks` · `resolvePrimaryMethodForTestMethod` |
| `scripts/backfill-analytical-method-test-methods.ts` | Backfill junction từ `analyte` text |

**File lõi buổi 24–25 (PP Nền mẫu):**

| File | Vai trò |
|------|---------|
| `prisma/migrations/20260717_analytical_method_matrix_fk/` | FK `matrixId` → `SampleMatrix` (superseded bởi junction) |
| `prisma/migrations/20260718_analytical_method_matrices/` | Junction M:N `AnalyticalMethodMatrix` |
| `components/analytical-methods/MethodMatrixMultiSelect.tsx` | Checkbox chọn nhiều nền mẫu |
| `lib/services/analytical-methods/methods.ts` | `matrixIds[]` · `syncMethodMatrices` · `testMethodIds[]` · `syncMethodTestMethods` |
| `scripts/backfill-analytical-method-matrix.ts` | Backfill link PP ↔ nền mẫu |

**File lõi buổi 24–25 (PP Nền mẫu gọn):**

| File | Vai trò |
|------|---------|
| `components/analytical-methods/MethodMatrixListCell.tsx` | List gom nhóm · max 3 tên +N |
| `lib/catalog/matrix-label.ts` | `matrixShortLabel` · `formatMatrixGroupLine` |

**File lõi buổi 24 (Admin catalog):**

| File | Vai trò |
|------|---------|
| `app/admin/layout.tsx` | AppShell bọc toàn bộ `/admin/*` — sidebar không mất khi vào catalog |
| `components/admin/CatalogMatricesClient.tsx` | CRUD nền mẫu: sửa inline · ẩn · xóa (`usageCount`) |
| `components/admin/CatalogTestMethodsClient.tsx` | CRUD chỉ tiêu · bulk bar · checkbox · dropdown lọc nhóm · viewport 560px · import/export Excel |
| `components/admin/BulkUpdateTestMethodsModal.tsx` | Modal Sửa hàng loạt — Nhóm · PPT · ĐVT · LOD (từng trường "Không thay đổi") |
| `components/admin/CatalogMappingsClient.tsx` | Mapping nền–chỉ tiêu · load `fetchMatrixMappingEditorAction` · lọc/search · viewport 560px |
| `components/admin/MappingSelectedPanel.tsx` | Panel phải — tóm tắt chỉ tiêu đã tick theo nhóm |
| `components/admin/TestUnitInput.tsx` | ĐVT combobox (datalist + gõ tùy chỉnh) |
| `lib/catalog/common-test-units.ts` | Danh sách ĐVT hay dùng |
| `lib/catalog/test-method-excel.ts` | Cột export + template Excel chỉ tiêu |
| `lib/services/catalog/test-method-import.ts` | Import upsert chỉ tiêu theo `code` |
| `lib/services/catalog/sample-matrices.ts` | `listSampleMatricesWithStats` · soft/hard delete nền |
| `lib/services/catalog/test-methods.ts` | CRUD · `bulkSoftDelete` / `bulkHardDelete` / `bulkUpdate` · validate mã trùng (VN) |
| `lib/actions/catalog.ts` | `fetchMatrixMappingEditorAction` · `bulkHide/HardDelete/UpdateTestMethodsAction` |

**File lõi buổi 23:**

| File | Vai trò |
|------|---------|
| `components/samples/SampleRequestFormClient.tsx` | Orchestrator form · filter nền theo nhóm |
| `components/samples/request/RequestFormLayout.tsx` | 3 vùng + sticky toolbar · full-width |
| `components/samples/request/SampleGrid.tsx` | Bảng mẫu compact · bulk matrix · filter |
| `components/samples/request/SampleDetailPanel.tsx` | Split chỉ tiêu available/selected |
| `lib/services/catalog/sample-matrix-groups.ts` | CRUD nhóm · reindex · import · hard delete |
| `lib/services/catalog/sample-matrices.ts` | Nền mẫu theo `groupId` |
| `prisma/seed-data/catalog/catalog-data.ts` | 7 nhóm · 13 nền · mappings seed |
| `prisma/migrations/20260716_sample_matrix_groups/` | Bảng `sample_matrix_groups` + `groupId` FK |

**File lõi buổi 22:** (giữ nguyên) `workflow-orchestrator.ts` · migration `20260715_lims_workflow_iso/` · xem §2 buổi 22

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
| **Build production** | ✅ `npm run build` pass (2026-06-27 buổi 6) · SSG có prisma warnings nếu `dev.db` thiếu cột migrate |
| **`/prepared-chemicals`, `/prepared-standards`, `/prepared-strains`** | ✅ ISO workflow · tab Lịch sử + **Truy xuất** · **QA CG01 pass** (2026-06-27) · **buổi 8:** nhãn nồng độ lý thuyết/thực tế · cột bảng+drawer+export · form 3 ô cùng hàng (Chuẩn/HC) · **uncommitted** · **QA lưu/sửa `finalConcentration` pending** |
| **`/stock-in` — Nhập kho** | ✅ Identity → cùng mã · cảnh báo lot/đơn vị · quy đổi L/mL/µL · **Nhóm HC/Chuẩn/Chủng creatable** (buổi 7) · **buổi 8:** fix **Mã vật tư** khóa nhưng vẫn lưu được (`lib/stock-in-code.ts` + sync identity) · **uncommitted** |
| **`/containers` → Thống kê** | ✅ Bảng gộp catalog + expand tồn theo lot |
| **`/usage-logs`** | ✅ Ghi theo vật tư gốc; tab Thống kê nhân viên |
| **`/chemicals`, `/standards`, `/microbial-strains`** | ✅ CRUD · bảng theo lot (Excel) · Chuẩn có CAS · **fix filter nhóm động** (local uncommitted) · form/datalist nhóm tùy ý |
| **Mã chuẩn pha theo cấp (PSTD/IST/WSTD)** | ✅ Core + migration local · **uncommitted** · Turso prod pending · seed demo đổi `IST1-*`, `WSTD-*` |
| **Inventory deduction** | ✅ Trừ theo `stockLotId` khi chọn lot; FIFO chỉ khi `ALLOW_FIFO_WITHOUT_LOT=true` |
| **TypeScript / Tests** | ✅ `tsc` · **`verify-results-delivery-seed.ts`** · **`verify-analysis-module-seed.ts`** · **`verify-samples-seed.ts`** · **`test-method-*`**, **`verify-analytical-methods-seed.ts`**, **`test-sample-code-gen.ts`**, **`verify-sample-workflow.ts`** |
| **Module Thiết bị** (`/equipment/*`) | ✅ HC inline · BT/SC UX · Phụ kiện · upload đa file · subtitle EN · Dashboard gọn · **Lý lịch gallery** · **layout shell dùng chung** |
| **Lý lịch thiết bị** (`/equipment/history`) | ✅ Chọn sự kiện timeline → gallery ảnh (nguồn gốc + upload) · carousel prev/next · PDF link riêng |
| **Authentication & RBAC** | ✅ Login/logout · JWT session · middleware · **58+ quyền sidebar** (+ 8 `samples_*` + 9 `analysis_*` + 6 `delivery_*` + role **`CustomerViewer`**) · Admin UI |
| **Session / Sidebar auth** | ✅ Fix sidebar trống (JWT↔DB lệch) · fix cookie crash layout · stale → `/login?reason=session` · **buổi 20:** desktop cuộn menu (`TouchVerticalScroll` `h-full min-h-0` · aside `h-screen overflow-hidden`) |
| **Mobile UX (bảng + filter)** | ✅ `TouchHorizontalScroll` · `FilterChipBar` · **không sticky cột mobile** (`ede088c`) |
| **Deploy Vercel** | ✅ Push **`a682a5a`** (2026-06-29) · prod https://huutai-lims-m929.vercel.app · modules samples/analysis/results-delivery live · **QA browser pending** |
| **Turso prod migrate** | ✅ **`20260629`–`20260714`** applied (2026-06-29) · permissions samples/analysis/delivery seeded · lab departments seeded |
| **Notification system** | ✅ Commit `ed32b5b` — bell + badge · `/notifications` · API 4 route · **đã redeploy prod** · **Turso migrate + QA browser pending** |
| **Danh mục TB — cột Thông số kỹ thuật** | ✅ Commit `ed32b5b` — cột sau Hãng SX · import/export Excel · seed 27 mã · **đã redeploy prod** · **QA browser + Turso backfill pending** |
| **Danh mục TB — In tem nhãn** | ✅ Commit `d8adfa0` — checkbox · preview modal · in A4 grid · profile ladder · logo căn giữa · **QA browser prod pending** |
| **Dashboard `/`** | ✅ KPI Prisma + **LIMS ISO KPI** (chờ phân công, sai lệch, quá hạn, …) · export CSV LIMS · alerts · hoạt động gần đây |
| **Báo cáo `/reports`** | ✅ Commit `d8adfa0` — stats DB + export CSV (tồn lot, nhật ký, nhập kho, sổ cái, audit) · **không còn mock** |
| **Sổ cái tồn `/inventory-ledger`** | ✅ Commit `d8adfa0` — UI `InventoryTransaction` · filter · export CSV |
| **Quản lý nhân sự `/admin/people`** | ✅ Commit `d04f674` · Turso `user_staff_link` applied · **QA browser pending** |
| **Lịch sử pha chế ISO 17025** | ✅ Phase 1–4 done · QA browser pass (2026-06-27) · CG01 filter 8/38 dòng · export 15 cột · plan [`PLAN-preparation-iso.md`](PLAN-preparation-iso.md) |
| **Inventory Transaction Engine** | ✅ Commit `2d22c52` · ledger-first · tab Tồn kho Prepared* · **Turso prod migrated** |
| **Tab Tồn kho — adjust lot (STD-0001)** | ✅ Fix `stockLotId` · tab Tồn kho HC/Chủng/Chuẩn · **QA browser pending** |
| **parentCode + batch lô pha chế** | ✅ Commit `2d22c52` · **QA CG01 local pass** · **Turso backfill done** |
| **ISO 17025 mở rộng (buổi 6)** | ✅ Commit **`18fe925`** · **Turso migrate + redeploy done** |
| **Nhật ký môi trường** | ✅ Commit `18fe925` — `/environment-logs` · permission `environment_logs` · **seed permission + QA browser pending** |
| **Available vs Ledger (STD-0001)** | ✅ Fix local — opening CREATE backfill · reconcile OK · **chạy lại trên Turso prod** |
| **Nhật ký — lot picker** | ✅ Commit `d8adfa0` — bắt buộc chọn lot khi ≥2 lot · `stockLotId` trên deduct |
| **Catalog quantity guard** | ✅ Commit `d8adfa0` — chặn sửa `quantity` master khi đã có StockLot · `lib/catalog-quantity-guard.ts` |
| **Session guard actions** | ✅ Commit `d8adfa0` — catalog/stock-in/usage-logs dùng `requireSessionCanEdit/Manage` |
| **Cảnh báo chủ động (cron)** | ✅ Commit `d8adfa0` — `GET /api/cron/proactive-alerts` · `vercel.json` 7:00 UTC · **cần `CRON_SECRET` trên Vercel** |
| **Thống kê — filter rủi ro** | ✅ Commit `d8adfa0` — filter Sắp hết hạn / Tồn thấp trên `/containers` |
| **Legacy MVP routes** | ✅ Commit `d8adfa0` — `/solutions`→prepared-standards · `/transactions`→usage-logs · `/inventory`→containers · `/alerts`→`/` |
| **List sorting & pagination** | ✅ Buổi 9 local — `lib/list-query` · sort server-side Prisma · URL state · **QA browser pending** · **chưa commit** |
| **Fix `/prepared-standards` crash sorting** | ✅ Buổi 9+10 — `mapPreparedStandardRow()` dùng chung `getPreparedStandards` + `listPreparedStandards` · **uncommitted** |
| **Module Thông tin hóa học** (`/chem-info/*`) | ✅ In commit **`54f4ae3`** on prod · periodic-table v2 · MW parser · compatibility v2 · Dilution v2 · **QA prod pending** |
| **Module Phương pháp phân tích** (`/analytical-methods/*`) | ✅ Commit **`54f4ae3`** on prod · Turso **`20260711`** · **Buổi 24–25 local:** Nền mẫu multi + list gọn · **Chất phân tích** multi-select (`AnalyticalMethodTestMethod`) · migrations **`20260717`–`20260720`** local ✅ · Flowchart Undo/Redo + pan **uncommitted** · **`tsc` pass** · **QA browser pending** · AI extraction **stub only** |
| **Module Tiếp nhận mẫu** (`/samples/*`) | ✅ **Buổi 22** orchestrator + review/reception log · **Buổi 23** form phiếu YC redesign 3 vùng full-width · catalog nhóm/nền thống nhất · **`tsc` pass** · **QA browser pending** · **uncommitted** |
| **Phân công phòng ban** (`/samples/assign`) | ✅ Lab Manager gán nhóm chỉ tiêu → phòng/`AnalysisAssignment` |
| **Module Phân tích** (`/analysis/*`) | ✅ **Buổi 22 uncommitted** · QC gate + Deviation/CAPA · sample prep · worklist complete · raw data upload · TechnicalReview + SoD · **`tsc` pass** · **worksheet start timeout 🟡** |
| **Module Trả kết quả** (`/results-delivery/*`) | ✅ **Buổi 22 uncommitted** · review/revisions pages · cancel report · email delivery log · immutable snapshots · `pdfUrl`=print URL · COA SGS buổi 21 · **QA browser pending** |

**Menu Tiếp nhận mẫu:** Phiếu yêu cầu · **Kiểm tra yêu cầu** · Danh sách mẫu · Tiếp nhận mẫu · Phân công phân tích · Theo dõi trạng thái · Lưu mẫu/Hủy · **Nhật ký tiếp nhận**.  
**Menu Phân tích:** Inbox · Phân công analyst · Worklist · Worksheet · **Chuẩn bị mẫu** · Nhập kết quả · QC · **Sai lệch/CAPA** · Kết quả chờ duyệt.  
**Menu Trả kết quả:** Chờ phát hành · **Soát xét phát hành** · Phiếu kết quả · Lịch sử · Đã trả · **Hiệu chỉnh kết quả**.  
**Portal khách:** `/customer/reports` (role `CustomerViewer` — read-only issued COA).  
**Menu Thông tin hóa học** (nhóm **dưới** Trả kết quả): Bảng tuần hoàn · Tra cứu hóa chất · Máy tính hóa học · Tương thích hóa chất. GHS/SDS trong tab chi tiết `/chem-info/chemicals/[id]`.  
**Menu vật tư** (nhóm **Hoá chất - Chuẩn - Chủng**): Dashboard · Nhập kho · Hoá chất/Chuẩn/Chủng gốc · pha chế · **Lịch sử pha chế** · **Nhật ký môi trường** · Thống kê · Nhật ký · **Sổ cái tồn** · Báo cáo.  
**Menu Phương pháp phân tích** (nhóm **giữa Thiết bị và Quản trị**): Dashboard · Danh sách phương pháp. Chi tiết method có tabs: Tổng quan · Upload SOP · Flowchart · Checklist · QC · Hóa chất/vật tư · Thiết bị · Phiên bản & phê duyệt. Runtime: `/method-executions/[id]`.  
**Menu Quản trị:** **Nhân sự** · Phân quyền · Giao việc.  
**Route `/containers`** giữ URL, label menu **“Thống kê”**. **Nhập kho** → `/stock-in`.

### URL hiện tại

| Môi trường | URL |
|------------|-----|
| **Local dev** | http://localhost:3000 |
| **Vercel (prod)** | https://huutai-lims-m929.vercel.app — **`main`** · commit **`54f4ae3`** (analytical-methods + chem-info + list UX) · pan flowchart **chưa trên prod** |
| **Vercel (alt)** | https://huutai-lims.vercel.app — project `huutai/huutai-lims` (có env riêng, không phải URL chính user dùng) |

### Trạng thái Next.js

- **Version:** 16.2.9 (App Router, Turbopack dev)
- **Kiến trúc:** Server component fetch Prisma → client component → server actions
- **Server Actions upload:** `next.config.ts` → `experimental.serverActions.bodySizeLimit: "32mb"` (restart dev sau đổi config)
- **Module MVP cũ (localStorage):** đã **redirect** sang module Prisma (`d8adfa0`) — không còn ghi localStorage

### Trạng thái Prisma

- **Client:** ✅ Generated — restart dev server nếu `prisma generate` báo EPERM
- **Schema:** ✅ Valid
- **Migrations (22 committed + 3 buổi 6 trong `18fe925`):**
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
  - `20260701_inventory_tx_engine` ← **InventoryTransactionType, inventoryStatus, Rejected, consumeTransactionId** (**Turso prod applied** 2026-06-28)
  - `20260702_prepared_parent_batch` ← **`parentCode`, `batchNumber` trên PreparedChemical/Standard/Strain** (Turso applied + backfill)
  - `20260703_stock_lot_purity` ← **`StockLot.purity`, `StockLot.uncertainty`** (Turso applied)
  - `20260704_environmental_log` ← **`EnvironmentalLog`** (Turso applied)
  - `20260705_preparation_equipment` ← **`equipmentId` FK trên Prepared*** (Turso applied)
  - `20260706_prepared_standard_prepared_date_index` ← **index `PreparedStandard.preparedDate`** (Turso applied)
  - `20260707_chem_info_module` ← **elements, chemical_references, GHS/SDS, compatibility_rules, pubchem_cache** (Turso applied · seed 118 elements)
  - `20260708_chemical_reference_sync` ← syncStatus, lastSyncedAt, extendedData (Turso applied)
  - `20260709_compatibility_rule_operands` ← ruleType, operandA/B (Turso applied)
  - **`20260711_analytical_methods`** ← **15 bảng module Phương pháp phân tích** (**Turso prod applied** 2026-06-28 · migration SQL committed)
  - **`20260629_analysis_assignment`** ← **`LabDepartment`, `DepartmentManager`, `AnalysisAssignment`** (**local `db push` ✅** · **Turso prod pending**)
  - **`20260701_analysis_module`** ← **8 bảng module Phân tích** (task/worklist/worksheet/results/QC) (**local `db push` ✅** · **Turso prod pending**)
  - **`20260712_sample_reception`** ← **10 bảng module Tiếp nhận mẫu** (**local `db push` ✅** · **Turso prod pending**)
  - **`20260713_results_delivery`** ← **`TestReport`, `ReportHistory`, enum `ResultIssued`** (**local `db push` ✅** · **Turso prod pending**)
  - **`20260714_test_report_document`** ← **`TestReport.documentSnapshotJson`** (COA snapshot) (**local `db push` ✅** · **Turso prod pending**)
  - **`20260715_lims_workflow_iso`** ← **`WorkflowEvent`, `Deviation`, `CapaAction`, `TechnicalReview`, `ReportDeliveryLog`, `LimsAttachment`** + mở rộng SampleRequest/Sample/TestReport (**local `db push` ✅** · **Turso prod pending** · script `apply-lims-workflow-turso.ps1`)
  - **`20260716_sample_matrix_groups`** ← **`SampleMatrixGroup`** + `SampleMatrix.groupId` FK (**local `db push` ✅** · **Turso prod pending** · backfill nhóm qua `seedLimsCatalog`)
  - **`20260717_analytical_method_matrix_fk`** ← `AnalyticalMethod.matrixId` FK (**local applied** · superseded bởi junction)
  - **`20260718_analytical_method_matrices`** ← **`AnalyticalMethodMatrix`** M:N PP ↔ nền mẫu (**local applied** · **Turso prod pending**)
  - **`20260719_analytical_method_test_methods`** ← **`AnalyticalMethodTestMethod`** M:N PP ↔ chỉ tiêu (**local applied** · **Turso prod pending**)
  - **`20260720_method_test_method_params`** ← `unit` · `lod` · `loq` · `isPrimary` · `sortOrder` trên junction (**local applied** · **Turso prod pending**)
- **Dev note:** `migrate deploy` có thể báo P3005 — dùng `db execute --schema prisma/schema.prisma --file …` · parent batch: thêm cột → backfill → unique index · **kill port 3000 trước `prisma generate`** nếu EPERM

### Trạng thái Database

- **Local:** SQLite — `prisma/dev.db` · `DATABASE_URL="file:./dev.db"`
- **Dev routing (`lib/db.ts`):** Khi `NODE_ENV !== production` và `DATABASE_URL` bắt đầu `file:` → **luôn dùng SQLite local**, bỏ qua `TURSO_*` trong `.env` (tránh crash thiếu cột khi Turso chưa migrate)
- **Production (Turso):** `libsql://huutai-lims-smartai0101-afk.aws-ap-northeast-1.turso.io` — migrations **`20260701`–`20260709`** applied 2026-06-28 · chem-info seed (118 elements · 31 rules · 33 refs)
- **Turso migrate prod (2026-06-28):** `npx tsx scripts/apply-turso-migration.ts prisma/migrations/<name>/migration.sql` (loop 28 files) · fix gap ISO columns PreparedStandard · `npx tsx scripts/seed-chem-info-only.ts` · `npx tsx scripts/backfill-prepared-parent-codes.ts`
- **Chưa chạy trên Turso prod:** migrations **`20260629`**–**`20260720`** (gồm buổi 22 workflow ISO · buổi 23 matrix groups · buổi 24–25 PP junctions) · pipeline **`20260706_code_standardization`**
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
| **Lịch sử pha chế** | `/preparation-history` | Báo cáo ISO **15 cột** (thêm **Mã nhóm**) · filter · export Excel |
| **Nhật ký môi trường** | `/environment-logs` | ISO điều kiện pha chế · permission `environment_logs` · commit `18fe925` |
| **Thiết bị** | `/equipment`, `/equipment/catalog`, … | 9 menu sidebar; xem § Module Thiết bị |
| **Quản trị** | `/admin/users`, `/admin/permissions`, `/admin/tasks` | Admin: users + phân quyền; LM/Analyst: giao việc |
| Báo cáo | `/reports`, `/` | ReportsClient / mock dashboard |
| **Login** | `/login` | Public; middleware redirect nếu chưa auth |
| **Tài khoản** | `/account` | Mọi user đã login — tên, avatar, mật khẩu; không cần permission RBAC |
| **Thông báo** | `/notifications` | Mọi user đã login · nội dung lọc theo quyền module · bell Topbar polling 45s |
| **Thông tin hóa học** | `/chem-info/periodic-table`, `/chem-info/chemicals`, `/chem-info/calculators`, `/chem-info/compatibility` | Reference DB tách catalog tồn kho · link CAS → `/chemicals` · PubChem enrich (LabManager+) |
| **Phương pháp phân tích** | `/analytical-methods`, `/analytical-methods/list`, `/analytical-methods/[id]/*`, `/method-executions/[id]` | SOP upload · React Flow **Undo/Redo · pan chuột trái · Shift+kéo chọn vùng** · copy/paste · multi-select · auto-save 15s · checklist · QC · execution |
| **Tiếp nhận mẫu** | `/samples`, `/samples/receive`, `/samples/[id]`, `/samples/[id]/edit`, `/samples/requests/*`, `/samples/requests/review`, `/samples/reception-log`, `/samples/assign`, `/samples/tracking`, `/samples/storage` | ISO 17025 · orchestrator · unified timeline · QR → `/samples/[id]` |
| **Phân tích** | `/analysis/inbox`, `/analysis/assign-analyst`, `/analysis/worklists`, `/analysis/worksheets`, `/analysis/sample-prep`, `/analysis/results`, `/analysis/qc`, `/analysis/deviations`, `/analysis/review` | QC gate · Deviation/CAPA · SoD · raw data upload |
| **Trả kết quả** | `/results-delivery/pending`, `/results-delivery/review`, `/results-delivery/reports`, `/results-delivery/revisions`, `/results-delivery/history`, `/results-delivery/issued`, `/customer/reports` | LM→QA→issue · cancel · email log · revision workflow |

### Các lỗi còn tồn tại

| Vấn đề | Mức | Ghi chú |
|--------|-----|---------|
| **Lot nhập sai đơn vị (vd. mg vs mL)** | 🟡 | Có cảnh báo UI; kiểm tra/sửa lot trong DB nếu nhập nhầm |
| **Product code để trống ≠ bản ghi có code** | 🟡 | Không coi là trùng identity |
| **Purity/uncertainty theo lot** | 🟢 | Buổi 6: `StockLot.purity` / `uncertainty` · form nhập kho · **Turso prod migrate pending** |
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
| **Catalog filter nhóm cố định** | 🟢 | Fix local (uncommitted): dropdown lọc dùng `groupOptions` từ DB — nhóm mới (vd. **BVTV**) không bị thiếu · áp dụng HC/Chuẩn/Chủng |
| Sidebar hydration warning (dev) | 🟡 | Next.js dev overlay; không chặn click sau fix z-index |
| **Import Excel — QA browser round-trip** | 🟡 | Script `test-standards-import-qa.ts` pass · cần QA thủ công 6 trang |
| **Import Excel — tối ưu P1 (batch query)** | 🟢 | Batch lot cache preload trong `catalog-import.ts` (`d8adfa0`) · gộp preview+import vẫn P2 |
| **Desktop sticky header + viewport** | 🟢 | Commit `d8adfa0` · **QA browser pending** |
| **Turso chưa migration Notification** | 🟡 | Prod cần `db execute` migration `20260626_notifications` |
| **Turso/prod chưa backfill specs TB** | 🟡 | Chạy `backfill-equipment-specifications.ts` với `NODE_ENV=production` |
| **Prod chưa deploy `d8adfa0`** | 🟡 | Push branch + `npx vercel --prod` · set `CRON_SECRET` + `BLOB_READ_WRITE_TOKEN` |
| **Seed local — quyền mới** | 🟡 | Chạy `npm run db:seed` nếu thiếu permission `inventory_ledger`, `admin_people`, **`methods_*`**, **`samples_*`** (6 keys) |
| **Module Phương pháp phân tích — Turso prod** | ✅ | **`20260711`** applied · `scripts/seed-methods-prod.ts` (permissions + 2 PP) · full `db:seed` prod **fail** (`stockLotId` drift — dùng seed riêng) |
| **Module Phương pháp phân tích — AI extraction** | 🟡 | Stub only · **chờ chọn LLM provider** |
| **Module Phương pháp phân tích — UX P1** | 🟡 | Picker catalog · auto-layout flowchart · **Undo/Redo ✅** · **pan canvas ✅ local** |
| **Flowchart — edge `conditionJson` mất khi save** | 🟡 | Save luôn ghi `"{}"` — tech debt nếu cần nhánh Condition có metadata |
| **Module Phân tích — worksheet start timeout** | 🔴 | `startWorklistAction`/`startWorksheetAction` — transaction >5s · Prisma `Transaction already closed` · fix buổi 23 |
| **Module Tiếp nhận mẫu — Turso prod** | 🟡 | Chưa apply **`20260712`** + **`20260715`** · chưa redeploy |
| **Module Phân tích — Turso prod** | 🟡 | Chưa apply **`20260629`** + **`20260701`** + **`20260715`** |
| **Module Trả kết quả — Turso prod** | 🟡 | Chưa apply **`20260713`** + **`20260714`** + **`20260715`** |
| **LIMS catalog — nhóm/nền mẫu** | 🟢 | Buổi 23–24: CRUD admin đầy đủ · import Excel nền · **Turso prod pending** · **QA browser pending** |
| **LIMS catalog — chỉ tiêu** | 🟢 | Buổi 24–25: CRUD + import/export Excel · ĐVT combobox · LOD · bulk · **nhiều PP**/ĐVT/LOD riêng · **PP chính** (`isPrimary`) · migrations `20260719`–`20260720` local · **QA browser pending** |
| **LIMS catalog — mapping nền–chỉ tiêu** | 🟢 | Fix load toàn bộ chỉ tiêu (`fetchMatrixMappingEditorAction`) · panel tóm tắt · **QA browser pending** |
| **PP — Nền mẫu metadata** | 🟢 | Buổi 24–25: multi-select junction · list gom nhóm (`MethodMatrixListCell`) · migrations `20260717`–`20260718` local · **Turso prod pending** · **QA browser pending** |
| **PP — Chất phân tích** | 🟢 | Buổi 25: multi-select từ Danh mục chỉ tiêu · junction `AnalyticalMethodTestMethod` · đồng bộ hai chiều catalog ↔ PP · migration `20260719` local · **Turso prod pending** · **QA browser pending** |
| **Form phiếu YC redesign** | 🟢 | Buổi 23: 3 vùng full-width · SampleGrid + DetailPanel · **QA browser pending** · **uncommitted** |
| **Module Trả kết quả — COA SCI-TECH** | 🟡 | Form **SGS đa trang** ✅ local · 2 chữ ký ✅ · phiếu cũ thiếu `cover` → `resolveCoverSnapshot()` fallback · **QA browser in/PDF pending** |
| **Module Trả kết quả — export email/Word/PDF** | 🟡 | In browser + CSV · email/Word/PDF server-side + Blob lưu PDF **defer** |
| **SCI-TECH branding env** | 🟡 | Optional: `SCI_TECH_WEBSITE`, `SCI_TECH_EMAIL`, `SCI_TECH_ACCREDITATION_*` trong `.env` · chưa Admin UI |
| **SampleRequest email/phone khách** | 🟡 | COA dùng placeholder config — chưa cột DB trên `SampleRequest` |
| **Sidebar desktop scroll** | 🟢 | Fix buổi 20 — cuộn wheel trong vùng menu đen · **QA browser pending** |
| **Full seed `npm run db:seed`** | 🟡 | Re-run có thể fail **`PreparedChemical` unique** (`links.ts` L109) — dùng `npx tsx scripts/seed-analysis-only.ts` nếu DB đã có catalog |
| **Build prod sau buổi 17–18** | 🟡 | `npm run build` có thể EPERM nếu dev server đang giữ Prisma engine — kill port 3000 trước |

---

## 2. Completed Work

### Phiên này (2026-07-05 — buổi 25) — PP Chất phân tích + Catalog nhiều PP + Nền mẫu gọn ✅ (local · chưa commit)

> **Plan PP:** `.cursor/plans/pp_chất_phân_tích_95429c09.plan.md` · `.cursor/plans/pp_nền_mẫu_gọn_d6285124.plan.md`  
> **Plan catalog:** `.cursor/plans/chỉ_tiêu_nhiều_pp_572e7d74.plan.md`

#### I. PP — Chất phân tích multi-select

| Hạng mục | Trạng thái |
|----------|------------|
| Junction **`AnalyticalMethodTestMethod`** M:N PP ↔ `TestMethod` | ✅ migration `20260719` |
| Đổi label **Analyte → Chất phân tích** trên Tạo mới · Tổng quan · Danh sách | ✅ |
| `MethodTestMethodMultiSelect` — lọc nhóm + search mã/tên | ✅ |
| `MethodAnalyteListCell` — gom theo `categoryName` (format giống Nền mẫu) | ✅ |
| `syncMethodTestMethods` — diff links · giữ params ĐVT/LOD khi thêm/bớt từ PP | ✅ |
| Seed `testMethodCodes[]` · `scripts/backfill-analytical-method-test-methods.ts` | ✅ |

**File chính:** `components/analytical-methods/MethodTestMethodMultiSelect.tsx` · `MethodAnalyteListCell.tsx` · `lib/catalog/test-method-label.ts` · `lib/services/analytical-methods/methods.ts` · `prisma/migrations/20260719_analytical_method_test_methods/`

#### J. Catalog chỉ tiêu — nhiều PP (Mã PP + ĐVT/LOD riêng)

| Hạng mục | Trạng thái |
|----------|------------|
| Junction mở rộng: `unit` · `lod` · `loq` · `sortOrder` · **`isPrimary`** | ✅ migration `20260720` |
| `TestMethodMethodLinksEditor` — thêm/xóa PP · ĐVT/LOD từng link · chọn **PP chính** (★) | ✅ |
| `TestMethodMethodsListCell` — list 3 cột Mã PP / ĐVT / LOD đồng bộ | ✅ |
| `syncTestMethodMethodLinks` · `syncPrimaryMethodLink` · `resolvePrimaryMethodForTestMethod` | ✅ |
| `defaultMethodId` sync từ PP chính · import Excel tạo primary link | ✅ |
| Phiếu YC: `request-sample-lines.ts` dùng `resolvePrimaryMethodForTestMethod` | ✅ |

**File chính:** `components/admin/TestMethodMethodLinksEditor.tsx` · `TestMethodMethodsListCell.tsx` · `lib/services/catalog/test-methods.ts` · `lib/catalog/test-method-method-label.ts` · `prisma/migrations/20260720_method_test_method_params/`

#### H+. PP — Nền mẫu list gọn (buổi 24–25)

| Hạng mục | Trạng thái |
|----------|------------|
| `MethodMatrixListCell` — gom theo nhóm · max 3 tên + `+N` | ✅ |
| `matrixShortLabel` · `formatMatrixGroupLine` · tooltip đầy đủ | ✅ |
| `DataTable` hỗ trợ `cellClassName` trên cột | ✅ |

**File chính:** `components/analytical-methods/MethodMatrixListCell.tsx` · `lib/catalog/matrix-label.ts` · `components/analytical-methods/MethodListClient.tsx`

#### QA buổi 25

```powershell
npx tsc --noEmit                    # ✅ pass
npx tsx scripts/backfill-analytical-method-test-methods.ts
# Smoke: /admin/catalog/test-methods → sửa chỉ tiêu → 2 PP khác ĐVT/LOD → đánh dấu PP chính
# Smoke: /analytical-methods/new → tick Chất phân tích → list cột gom nhóm
# Smoke: /samples/requests/new → chỉ tiêu 2 PP → methodId = PP chính
```

#### Công việc chuyển buổi 26

→ Xem **§0** (QA browser · commit · Turso · buổi 22 backlog)

---

### Phiên này (2026-07-05 — buổi 24) — Admin catalog + PP Nền mẫu ✅ (local · chưa commit)

> **Plan admin:** `.cursor/plans/excel_chỉ_tiêu_import_export_f1b57926.plan.md` · `.cursor/plans/bulk_chỉ_tiêu_catalog_ff09f53e.plan.md`  
> **Plan PP:** `.cursor/plans/pp_nền_mẫu_dropdown_405359d5.plan.md` · `.cursor/plans/pp_multi_nền_mẫu_9e8a3263.plan.md`

#### A. Fix sidebar Quản trị

| Hạng mục | Trạng thái |
|----------|------------|
| **`app/admin/layout.tsx`** — bọc mọi route `/admin/*` bằng `AppShell` | ✅ |
| Gỡ `<AppShell>` trùng trong `AdminPeopleClient` · `AdminPermissionsClient` · `AdminTasksClient` | ✅ |
| Fix JSX đóng thẻ thừa (build error Tasks/Permissions/People) | ✅ |

**Triệu chứng đã fix:** Vào Nhóm nền mẫu / Nền mẫu / Danh mục chỉ tiêu / Mapping → sidebar biến mất.

#### B. CRUD Nền mẫu (`/admin/catalog/matrices`)

| Hạng mục | Trạng thái |
|----------|------------|
| Sửa inline (Mã · Tên · Nhóm · TT) | ✅ |
| Ẩn (soft delete) · Xóa vĩnh viễn (khi `usageCount === 0`) | ✅ |
| Khóa đổi mã khi đã có phiếu YC / mẫu | ✅ |
| `listSampleMatricesWithStats` · `hardDeleteSampleMatrix` | ✅ |

#### C. CRUD Danh mục chỉ tiêu (`/admin/catalog/test-methods`)

| Hạng mục | Trạng thái |
|----------|------------|
| Form thêm · sửa inline · ẩn · xóa | ✅ |
| Cột: **Phương pháp thử** (trước ĐVT) · **LOD** (sau ĐVT) | ✅ |
| **ĐVT combobox** — chọn list hay dùng hoặc gõ tùy chỉnh (`TestUnitInput`) | ✅ |
| Thông báo lỗi mã trùng: *"Mã chỉ tiêu đã tồn tại, vui lòng dùng mã khác"* | ✅ |
| **Import / Export Excel** · Tải file mẫu · upsert theo `code` | ✅ |
| `importTestMethodsCatalogAction` · parser header EN/VN | ✅ |

**File chính:** `components/admin/CatalogTestMethodsClient.tsx` · `lib/services/catalog/test-methods.ts` · `lib/services/catalog/test-method-import.ts` · `lib/catalog/test-method-excel.ts` · `lib/catalog/common-test-units.ts`

#### E. UX Danh mục chỉ tiêu + bulk actions

| Hạng mục | Trạng thái |
|----------|------------|
| Dropdown **Nhóm chỉ tiêu** thay chip filter (gọn hơn) | ✅ |
| Bảng trong viewport **560px** · sticky header | ✅ |
| Checkbox chọn dòng · chọn tất cả trang hiện tại (indeterminate) · giữ selection khi đổi trang/lọc | ✅ |
| Thanh bulk: **Sửa hàng loạt** · **Ẩn** · **Xóa** · **Bỏ chọn** — disabled khi `editingId !== null` | ✅ |
| `BulkUpdateTestMethodsModal` — Nhóm · PPT · ĐVT · LOD · "Không thay đổi" · confirm trước áp dụng | ✅ |
| Server: `bulkSoftDeleteTestMethods` · `bulkHardDeleteTestMethods` (skip `usageCount > 0`) · `bulkUpdateTestMethods` | ✅ |
| Actions: `bulkHideTestMethodsAction` · `bulkHardDeleteTestMethodsAction` · `bulkUpdateTestMethodsAction` | ✅ |
| **Không** bulk Mã/Tên | ✅ |

**File chính:** `components/admin/BulkUpdateTestMethodsModal.tsx` · `lib/services/catalog/test-methods.ts` · `lib/actions/catalog.ts`

#### F. Fix Mapping nền–chỉ tiêu + panel tóm tắt

| Hạng mục | Trạng thái |
|----------|------------|
| **Root cause:** `fetchTestMethodsAction(matrixId)` chỉ trả chỉ tiêu **đã map** → nền mới list rỗng | ✅ đã xác định |
| `fetchMatrixMappingEditorAction` — load `listTestMethods()` + `mappedIds` riêng | ✅ |
| `CatalogMappingsClient` dùng action mới · lọc nhóm · search · chọn tất cả · viewport 560px | ✅ |
| `MappingSelectedPanel` — cột phải tóm tắt chỉ tiêu đã tick theo nhóm · nút Bỏ | ✅ |
| `saveMatrixMappingsAction` revalidate `/samples/requests/new` | ✅ |

**File chính:** `components/admin/CatalogMappingsClient.tsx` · `components/admin/MappingSelectedPanel.tsx` · `lib/actions/catalog.ts` · `app/admin/catalog/mappings/page.tsx`

#### G. Lưu ý vận hành buổi 24

- Chỉ tiêu mới **chưa hiện trên phiếu YC** cho đến khi gán tại **Mapping nền–chỉ tiêu**
- Import Excel chỉ tiêu: cần `categoryCode` hoặc `categoryName` khớp nhóm seed (7 nhóm) — **không** tự tạo nhóm mới
- Export file dùng header tiếng Việt (Mã, Tên, Mã nhóm, …) — import chấp nhận cả EN và VN

#### QA buổi 24

```powershell
npx tsc --noEmit                    # ✅ pass
# Smoke: /admin/catalog/test-methods → Export → sửa file → Import
# Smoke: chuyển Nhân sự → Nền mẫu → Chỉ tiêu → sidebar luôn hiện
# Smoke bulk: tick 3 dòng → Sửa hàng loạt (chỉ Nhóm) → PPT/ĐVT/LOD giữ nguyên
# Smoke bulk: Ẩn 5 dòng · Xóa (dòng usageCount>0 bị skip + message)
# Smoke mapping: nền mới → tick chỉ tiêu → panel phải → Lưu → /samples/requests/new thấy chỉ tiêu
```

**Chưa QA browser:** round-trip Excel prod · xóa chỉ tiêu đã có phiếu YC · import file lỗi format · bulk trên prod

#### H. PP Phương pháp phân tích — Nền mẫu (dropdown → multi-select)

> **Plan:** `.cursor/plans/pp_nền_mẫu_dropdown_405359d5.plan.md` · `.cursor/plans/pp_multi_nền_mẫu_9e8a3263.plan.md`

| Hạng mục | Trạng thái |
|----------|------------|
| Đổi label **Matrix → Nền mẫu** trên Tạo mới · Tổng quan · Danh sách | ✅ |
| Dropdown từ `listSampleMatrices()` (catalog Quản trị) | ✅ |
| Lưu `matrixId` FK (migration `20260717`) | ✅ (đã migrate sang junction) |
| **Chọn nhiều nền mẫu** — junction `AnalyticalMethodMatrix` | ✅ |
| UI `MethodMatrixMultiSelect` — checkbox list · Bỏ chọn tất cả | ✅ |
| List hiển thị tên nền join `, ` · search theo bất kỳ nền đã gán | ✅ (buổi 25: gom nhóm `MethodMatrixListCell`) |
| Seed PP: `matrixCodes: ["WATER"]` / `["FOOD-VEG"]` | ✅ |

**File chính:** `components/analytical-methods/MethodMatrixMultiSelect.tsx` · `lib/services/analytical-methods/methods.ts` · `types/analytical-methods.ts` · `prisma/migrations/20260718_analytical_method_matrices/`

#### QA buổi 24 (PP)

```powershell
# Smoke: /analytical-methods/new → tick 2–3 nền → tạo PP
# Smoke: /analytical-methods/[id] Tổng quan → thêm/bớt nền → Lưu metadata → refresh
# Smoke: /analytical-methods/list → cột Nền mẫu · search theo tên nền
npx tsx scripts/backfill-analytical-method-matrix.ts   # nếu PP cũ thiếu link
```

#### Công việc chuyển buổi 25

→ Đã làm xong buổi 25 (Chất phân tích · catalog nhiều PP · list gọn) — xem §2 buổi 25 · tiếp tục **§0 buổi 26**

---

### Phiên này (2026-07-05 — buổi 23) — Form phiếu YC + Catalog nền mẫu thống nhất ✅ (local · chưa commit)

> **Plan form UX:** redesign 3 vùng (header · grid mẫu · panel chỉ tiêu) · **Plan catalog:** `.cursor/plans/unified_matrix_catalog_929968bd.plan.md`

#### A. Redesign form Tạo/Sửa phiếu yêu cầu

| Hạng mục | Trạng thái |
|----------|------------|
| Layout 3 vùng full-width (`max-w-[1600px]`) · sticky toolbar | ✅ |
| `SampleGrid` — filter/lọc xem · bulk gán nền · multi-select | ✅ |
| `SampleDetailPanel` — split AvailableTests / SelectedTests | ✅ |
| `BulkApplyTestsModal` + Excel import dòng mẫu | ✅ |
| Fix UX: Nhóm nền read-only badge · SL/ĐVT editable · bỏ `fieldset disabled` | ✅ |
| Fix checkbox chỉ tiêu — bỏ virtual scroll (click ổn định) | ✅ |
| Fix validate submit — tên mẫu dùng `tempCode` khi `sampleName` trống | ✅ |

**File chính:** `components/samples/SampleRequestFormClient.tsx` · `components/samples/request/*` · `components/samples/SampleAppShell.tsx` (auto fullWidth)

#### B. Catalog nhóm / nền mẫu thống nhất

| Hạng mục | Trạng thái |
|----------|------------|
| Model **`SampleMatrixGroup`** + `SampleMatrix.groupId` | ✅ migration `20260716` |
| Gộp **Loại mẫu mặc định** (header) = chọn **nhóm** từ DB (bỏ `SAMPLE_TYPE_OPTIONS` hardcoded trên form) | ✅ |
| Dropdown **Nền mẫu** lọc theo nhóm · toggle "Xem tất cả nền mẫu" | ✅ |
| Seed: **7 nhóm · 13 nền** · 4 packages · test mappings mở rộng | ✅ `catalog-data.ts` |
| Admin **`/admin/catalog/matrix-groups`** — thêm · **sửa** · **thứ tự unique** · **chuẩn hóa 1,2,3…** · **ẩn** · **xóa** (hard delete khi 0 nền) | ✅ |
| Admin **`/admin/catalog/matrices`** — thêm nền · **sửa inline** · **Import Excel/CSV** · ẩn/xóa | ✅ |
| Admin **`/admin/catalog/test-methods`** — CRUD chỉ tiêu · import/export Excel · LOD · ĐVT combobox | ✅ buổi 24 |
| Nav Quản trị: **Nhóm nền mẫu** · **Nền mẫu** · **Danh mục chỉ tiêu** · **Mapping** | ✅ |

**File chính:** `lib/services/catalog/sample-matrix-groups.ts` · `lib/services/catalog/sample-matrices.ts` · `lib/actions/catalog.ts` · `components/admin/CatalogMatrixGroupsClient.tsx` · `components/admin/CatalogMatricesClient.tsx`

#### C. Lỗi / lưu ý vận hành

- **`prisma generate` EPERM** — kill Node trước khi generate sau đổi schema
- **Dev server cần restart** sau `prisma generate` (Prisma client cũ → `Unknown field group`)
- **Nhóm trùng legacy** — backfill từ `groupName` có thể tạo nhóm `WATER`/`AIR` riêng; dùng admin **Chuẩn hóa thứ tự** + **Xóa** nhóm nhập nhầm
- **`migrate deploy` P3005** local — dùng `npx prisma db push`

#### QA buổi 23

```powershell
npx tsc --noEmit                    # ✅ pass
# Seed catalog (nếu DB mới):
npx tsx -e "import { db } from './lib/db'; import { seedLimsCatalog } from './prisma/seed-data/catalog/seed-catalog'; seedLimsCatalog(db).finally(() => db.$disconnect())"
```

**Chưa QA browser:** form full flow · admin import Excel · phiếu cũ với `sampleType` text legacy

#### Công việc chuyển buổi 25

→ Xem **§0** (dọn catalog · QA browser · commit · Turso `20260716` · buổi 22 backlog)

---

### Phiên này (2026-06-30 — buổi 22) — LIMS 3 module ISO/IEC 17025 orchestrator ✅ (local · chưa commit)

> **Plan:** `.cursor/plans/lims_3_module_plan_c5e8cae0.plan.md` — 5 phase · **không sửa plan file**

#### Tóm tắt theo phase

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| **1** | `WorkflowEvent` + `workflow-orchestrator.ts` · FSM sample/request · pages review/reception/edit · QR deep link | ✅ local |
| **2** | QC gate · worklist complete · sample prep · Deviation/CAPA · raw data upload · audit analysis | ✅ local |
| **3** | `TechnicalReview` · delivery review page · immutable snapshots · `pdfUrl` print URL | ✅ local |
| **4** | Unified ISO timeline · revisions · cancel report · dashboard KPIs · Turso script | ✅ local |
| **5** | Notification hooks · email delivery log · CSV export · CustomerViewer portal · REST `/api/lims/*` | ✅ local |

#### Prisma / migration buổi 22

- Enum mới: `WorkflowEntityType`, `DeviationStatus`, `CapaActionStatus`, `TechnicalReviewDecision`, `ReportDeliveryChannel`, `ReportDeliveryStatus`, `CustomerViewer` (UserRole)
- Model: `WorkflowEvent`, `Deviation`, `CapaAction`, `TechnicalReview`, `ReportDeliveryLog`, `LimsAttachment`
- Mở rộng: `SampleRequest` (submitted/reviewed/cancelled) · `Sample.barcodePayload` · `AnalysisWorklist.completedAt/By` · `TestResult.rawDataAttachmentId` · `ReportHistory.documentSnapshotJson`
- Migration: `prisma/migrations/20260715_lims_workflow_iso/migration.sql`

#### Service / action lõi

| File | Vai trò |
|------|---------|
| `lib/services/workflow-orchestrator.ts` | `appendWorkflowEvent`, unified timeline, SoD |
| `lib/services/samples/sample-workflow.ts` | Auto FSM Pass/Fail → WaitingAssignment |
| `lib/services/samples/sample-requests.ts` | review/cancel/complete request · lock edit Draft-only |
| `lib/services/analysis/deviation.ts` | QC fail → Deviation · CAPA |
| `lib/services/analysis/qc-check.ts` | QC gate · block review khi deviation mở |
| `lib/services/analysis/review.ts` | `TechnicalReview` + SoD |
| `lib/services/results-delivery/test-report.ts` | cancel · revisions · snapshots · `pdfUrl` |
| `lib/services/lims-notification-hooks.ts` | Bell: submit request · assign analyst · QC fail · pending issue |
| `lib/services/lims-export.ts` | CSV reception/analysis/delivery |
| `lib/services/lims-email-delivery.ts` | `ReportDeliveryLog` (log-only, chưa SMTP) |

#### UI / routes mới

- `app/samples/requests/review` · `app/samples/reception-log` · `app/samples/[id]/edit`
- `app/analysis/sample-prep` · `app/analysis/deviations`
- `app/results-delivery/review` · `app/results-delivery/revisions`
- `app/customer/reports` · `components/samples/WorkflowTimeline.tsx`
- Wire: `WorklistsClient` complete · `ResultsClient` Gửi QC + raw data · `ReportDetailClient` hủy + email

#### QA buổi 22

```powershell
npx tsc --noEmit                    # ✅ pass
npx tsx scripts/verify-workflow-e2e.ts   # ✅ smoke (count tables only)
```

**Lỗi phát hiện khi dev:** `startWorksheetAction` — Prisma transaction timeout 5s (→ buổi 23)

#### Công việc chuyển buổi 23

→ Đã làm xong buổi 23 (form + catalog) — xem §2 buổi 23 · backlog còn lại ở **§0 buổi 26**

---

### Phiên này (2026-06-29 — buổi 21) — COA form SGS + 2 chữ ký ✅ (local · chưa commit)

> **Plan SGS:** `.cursor/plans/sgs-style_coa_redesign_c2a486cf.plan.md` · **Plan 2 chữ ký:** `.cursor/plans/coa_2_chữ_ký_e46f6d84.plan.md`

#### COA đa trang kiểu SGS (SCI-TECH branding)

| Hạng mục | Trạng thái |
|----------|------------|
| Tách `components/results-delivery/coa/` — PageShell, Header, Footer, Cover, Results, Notes, pagination | ✅ |
| Trang 1 **ANALYSIS REPORT** — khách hàng + SAMPLE INFORMATION song ngữ | ✅ |
| Trang 2..N **TEST RESULT(S)** — bảng 8 cột · nhóm `parameterGroup` | ✅ |
| Trang cuối — Note/Ghi chú · LOD/LOQ · methods · chữ ký | ✅ |
| `sci-tech-lab-config.ts` — màu `#2D5A9E`/`#55C595` · disclaimer · technical notes bilingual | ✅ |
| `build-document-snapshot.ts` — field `cover` · fix `customerAddress` từ TestReport | ✅ |
| `resolveCoverSnapshot()` — fallback phiếu cũ thiếu `cover` | ✅ |
| Không logo ilac/VILAS · không phụ lục ảnh (theo lựa chọn user) | ✅ |

**File chính:** `components/results-delivery/TestReportDocument.tsx` · `test-report-coa.css` · `lib/test-report/build-document-snapshot.ts` · `lib/test-report/coa-format.ts`

#### 2 chữ ký (chỉ UI COA — workflow 5 vai trò giữ nguyên trong DB)

| Vị trí | Nội dung |
|--------|----------|
| **Trái** | Technical Manager / Phụ trách kỹ thuật — tên LM (`labManagerName`) · ngày action `approved` |
| **Phải** | For SCI-TECH / Đại diện công ty — **chỉ tên công ty** · ngày `issued` / `issueDate` |

**File:** `components/results-delivery/coa/CoaNotesPage.tsx` · CSS grid 2 cột trong `test-report-coa.css`

#### Lệnh setup local (chat mới — COA SGS)

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
npx prisma generate
npx prisma db push
npx tsx scripts/seed-analysis-only.ts
npx tsx scripts/verify-results-delivery-seed.ts
npx tsc --noEmit
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Xem COA: `/results-delivery/reports/[id]` (preview) · `/results-delivery/reports/[id]/print` (Ctrl+P → PDF)

Env tùy chọn: `SCI_TECH_WEBSITE`, `SCI_TECH_EMAIL`, `SCI_TECH_ACCREDITATION_*`

#### Công việc cần làm tiếp (ưu tiên)

- [ ] **QA browser COA SGS** — cover + bảng kết quả nhiều trang + 2 chữ ký · watermark NHÁP khi draft · Ctrl+P A4
- [ ] **QA sidebar** — 8 nhóm mở → cuộn wheel xuống menu dưới
- [ ] **QA E2E Trả kết quả** — pending → LM → QA → issue → `/samples/storage`
- [ ] **Re-seed / tạo phiếu mới** nếu snapshot cũ thiếu `cover` (hoặc dùng fallback runtime)
- [ ] **`npm run build`** · **Commit + push** buổi 17–21 · **Turso prod** migrations `20260629`–`20260714`
- [ ] Defer: email COA · PDF server-side · cột email/phone `SampleRequest` · Admin branding · phụ lục ảnh mẫu

---

### Phiên này (2026-06-29 — buổi 20) — COA SCI-TECH + sidebar scroll ✅ (local · chưa commit)

> **Plan:** `.cursor/plans/sci-tech_coa_redesign_5056870f.plan.md` · sidebar: `.cursor/plans/sidebar_scroll_fix_250e074f.plan.md`

#### COA SCI-TECH (ISO/IEC 17025)

| Hạng mục | Trạng thái |
|----------|------------|
| `lib/test-report/sci-tech-lab-config.ts` — branding SCI-TECH, logo, ghi chú ISO, env accreditation | ✅ |
| Migration **`20260714`** — `TestReport.documentSnapshotJson` | ✅ local |
| `lib/test-report/build-document-snapshot.ts` — snapshot khách hàng/mẫu/PP/kết luận/chữ ký | ✅ |
| `components/results-delivery/TestReportDocument.tsx` + `test-report-coa.css` — A4, 11 section | ✅ |
| Detail preview COA + route `/print` (React, bỏ `buildReportPrintHtml`) | ✅ |
| Watermark **NHÁP** khi chưa phát hành · footer `LIMS-TR-FM-001` | ✅ |
| Seed `RPT-SEED-0001` backfill snapshot · verify script | ✅ pass |

**File chính:** `lib/services/results-delivery/test-report.ts` · `lib/mappers/result-delivery.ts` · `types/result-delivery.ts` · `components/results-delivery/ReportDetailClient.tsx`

**Env tùy chọn COA:**

```env
SCI_TECH_WEBSITE=https://...
SCI_TECH_EMAIL=lab@...
SCI_TECH_ACCREDITATION_ENABLED=true
SCI_TECH_ACCREDITATION_NO=VILAS-...
```

#### Sidebar cuộn desktop

| Hạng mục | Trạng thái |
|----------|------------|
| `TouchVerticalScroll` — `h-full min-h-0 overflow-hidden` trên vùng scroll | ✅ |
| `Sidebar` aside — `h-screen overflow-hidden` | ✅ |
| `lib/result-delivery-nav.ts` — tách nav khỏi Prisma (middleware an toàn) | ✅ |

#### Lệnh setup local (sau buổi 20)

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
npx prisma generate
npx prisma db push
npx tsx scripts/seed-analysis-only.ts
npx tsx scripts/verify-results-delivery-seed.ts
npx tsc --noEmit
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Xem COA: `/results-delivery/reports/[id]` → preview · **In / PDF** → `/results-delivery/reports/[id]/print`

#### Công việc cần làm tiếp (ưu tiên)

- [ ] **QA browser** — sidebar mở 8 nhóm → cuộn xuống Thiết bị/PP/Quản trị · COA in A4 (Ctrl+P → PDF)
- [ ] **QA E2E Trả kết quả** — pending → tạo phiếu → LM → QA → phát hành → `/samples/storage`
- [ ] **Commit + push** buổi 17–20 (migrations `20260712`–`20260714` + samples/analysis/results-delivery + sidebar)
- [ ] **Turso prod** — apply `20260629`–`20260714` · seed permissions `delivery_*` · demo reports
- [ ] **`npm run build`** sau kill dev server
- [ ] Defer: email COA · PDF server-side (Puppeteer/Blob) · cột email/phone `SampleRequest` · Admin UI branding

---

### Phiên này (2026-06-29 — buổi 19) — Module Trả kết quả ✅ (local · chưa commit)

> **Workflow mới:** Tiếp nhận → Phân tích → **Trả kết quả** → Lưu mẫu / Hủy mẫu  
> **Gate ISO:** Chỉ `Sample.ResultIssued` mới cho phép lưu/hủy mẫu (không còn `Completed → Stored` trực tiếp)

#### Phạm vi đã code

| Hạng mục | Trạng thái |
|----------|------------|
| Prisma `TestReport`, `ReportHistory`, `SampleStatus.ResultIssued` · migration `20260713` | ✅ local |
| Services + guards QC/approval · draft → LM approve → QA approve → issue/reissue | ✅ local |
| RBAC 4 keys `delivery_*` · sidebar **Trả kết quả** sau Phân tích | ✅ local |
| UI 4 màn: pending · reports (+ detail/print) · history · issued | ✅ local |
| Demo seed `RPT-SEED-0001` (SPL-0001 → `ResultIssued`) | ✅ local |
| `scripts/verify-results-delivery-seed.ts` · `npx tsc --noEmit` | ✅ pass |

#### Lệnh setup local (chat mới — module Trả kết quả)

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
npx prisma generate
npx prisma db push
npx tsx scripts/seed-analysis-only.ts   # incl. demo analysis + reports
npx tsx scripts/verify-results-delivery-seed.ts
npx tsc --noEmit
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Login LabManager/QA → sidebar **Trả kết quả**. Re-seed permissions nếu menu trống: `npm run db:seed` (hoặc chỉ auth seed).

#### Routes

| Màn | URL |
|-----|-----|
| Kết quả chờ phát hành | `/results-delivery/pending` |
| Phiếu kết quả | `/results-delivery/reports` · `/results-delivery/reports/[id]` |
| In COA | `/results-delivery/reports/[id]/print` |
| Lịch sử phát hành | `/results-delivery/history` |
| Kết quả đã trả | `/results-delivery/issued` |

#### Chưa làm / đã chuyển buổi 20

- [x] Module workflow + 4 màn + seed cơ bản (buổi 19)
- [ ] **QA browser E2E** — xem checklist buổi 20
- [ ] **Commit + push** — gom buổi 17–20
- [ ] **Turso prod** — apply migrations + seed
- [ ] Defer: gửi email · xuất Word/PDF server-side · Blob lưu PDF

Chi tiết file/service: `lib/services/results-delivery/*` · `lib/actions/results-delivery.ts` · `components/results-delivery/*`

### Phiên này (2026-06-29 — buổi 18) — Module Phân tích + rewrite `/samples/assign` ✅ (local · chưa commit)

> **Plan:** `.cursor/plans/analysis_module_plan_64f689d8.plan.md`  
> **Quyết định kiến trúc:** Tiếp nhận dừng ở phân công phòng (`AnalysisAssignment`) · Phân tích bắt đầu từ lab tiếp nhận → `AnalysisTask` (1:1 assignment) · **`SampleTest` không dùng** cho phân công lab/analyst (giữ pool chỉ tiêu lúc tiếp nhận + legacy demo)

#### Tóm tắt Phase 0–8 (đã code)

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| 0 | Prisma 8 model + enums · migrations · RBAC 7 keys · sidebar · shell · `analysis-workflow.ts` | ✅ local |
| 1 | `/analysis/inbox` — tiếp nhận/từ chối assignment → task | ✅ local |
| 2 | `/analysis/assign-analyst` · seed 14 analyst (2/phòng) | ✅ local |
| 3 | Worklist CRUD + method/equipment | ✅ local (tạo inline trên list, không route `/new` riêng) |
| 4 | Worksheet từ worklist · HC/chuẩn/CRM · start/complete | ✅ local |
| 5 | Nhập kết quả per-parameter `TestResult` | ✅ local |
| 6 | QC checks · block submit nếu fail | ✅ local |
| 7 | Duyệt · submit/approve/reject · sync `Sample` | ✅ local |
| 8 | Demo seed + verify script | ✅ local |

#### Rewrite `/samples/assign` (buổi 18 cont)

- Lab Manager gán **nhóm chỉ tiêu → phòng ban + quản lý phòng** qua `AnalysisAssignment`
- UI: [`components/samples/SampleAssignClient.tsx`](components/samples/SampleAssignClient.tsx) · service: [`lib/services/samples/analysis-assignment.ts`](lib/services/samples/analysis-assignment.ts)
- Seed phòng: [`prisma/seed-data/lab-departments.ts`](prisma/seed-data/lab-departments.ts) · gợi ý phòng: [`lib/parameter-department-hints.ts`](lib/parameter-department-hints.ts)
- **Đã xóa** luồng cũ analyst/TB/HC trên assign (`sample-assign.ts`)

#### Lệnh setup local (chat mới — module Phân tích)

```powershell
# Bắt buộc tắt dev server trước nếu EPERM
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
npx prisma generate
npx prisma db push
# Full seed có thể fail PreparedChemical duplicate — dùng seed riêng:
npx tsx scripts/seed-analysis-only.ts
npx tsx scripts/verify-analysis-module-seed.ts
npx tsx scripts/smoke-analysis-pages.ts
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Login Admin/LabManager → sidebar **Phân tích**.

#### QA CLI (pass local 2026-06-29)

```powershell
npx tsc --noEmit
npx tsx scripts/verify-analysis-module-seed.ts
npx tsx scripts/smoke-analysis-pages.ts
# Smoke OK mẫu: inbox:5 tasks:1 worklists:2 worksheets:1 results:7 qc:1 review:2
```

#### Demo seed trạng thái (`prisma/seed-data/analysis/demo-analysis.ts`)

| Mẫu / trạng thái | Ghi chú |
|------------------|---------|
| SPL-0002, 0003 | Assignment `assigned` — inbox chờ lab tiếp nhận |
| SPL-0005 | 1 task `lab_accepted` · 1 task `analyst_assigned` + worklist **draft** |
| SPL-0006 | Task `in_analysis` + worklist **running** + worksheet **in_progress** · task vi sinh `result_entered` (QC pending) |
| SPL-0007 | Task `submitted_for_review` |
| SPL-0001 | Tasks `approved` (assignment completed) |

**Chưa làm / phiên tiếp (buổi 18):**

- [ ] **QA browser E2E** — happy path: assign SPL-0003 → inbox → analyst → worklist → worksheet → results → QC → review → `Sample.Completed`
- [ ] **Commit + push** module analysis + assign rewrite + migrations (không commit `dev.db`, `.next/`, uploads lẻ)
- [ ] **Turso prod** — apply `20260629` + `20260701` (+ `20260712` samples) · seed permissions
- [ ] **`npm run build`** sau kill dev server
- [ ] Fix **`npm run db:seed`** duplicate `PreparedChemical` nếu cần re-seed full local
- [ ] Defer: link `MethodExecution` checklist · notification bell · PDF kết quả · admin CRUD analyst/phòng

Chi tiết file/service: § **11. Module Phân tích** (cuối file).

### Phiên này (2026-06-29 — buổi 17) — Module Tiếp nhận mẫu ✅ (local · chưa commit)

> **Plan:** `.cursor/plans/sample_reception_module_69e773b5.plan.md`  
> **Quyết định kiến trúc:** 6 nav permission keys · FSM `sample-workflow.ts` · mã `SPL-/PR-` qua `CodeSequence` · audit kép (`AuditLog` + `SampleAuditLog`)

#### Tóm tắt Phase 1–3 (đã code)

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| 1 | Sidebar · RBAC · danh sách mẫu · form tiếp nhận · sinh mã · FSM · liên kết PP | ✅ local |
| 2 | Phiếu yêu cầu · phân công · cảnh báo quá hạn · tracking · chem-info link | ✅ local |
| 3 | `SampleAuditLog` · chain of custody · lưu/hủy mẫu · in tem QR · báo cáo CSV | ✅ local |

#### Lệnh setup local (chat mới)

```powershell
taskkill /F /IM node.exe 2>$null   # nếu EPERM prisma generate
npx prisma generate
npx prisma db push                 # hoặc migrate SQL 20260712
npm run db:seed                    # full seed incl. 10 PR/10 SPL demo
# hoặc chỉ demo mẫu (sau catalog + PP đã có):
# npx tsx prisma/seed-data/samples/run-seed.ts
npx tsx scripts/verify-samples-seed.ts
npm run dev
```

Mở http://localhost:3000/samples — login Admin/LabManager.

#### QA CLI (pass local)

```powershell
npx tsc --noEmit
npx tsx scripts/test-sample-code-gen.ts
npx tsx scripts/verify-sample-workflow.ts
npx tsx scripts/verify-samples-seed.ts
```

#### Seed demo thực phẩm / thức ăn chăn nuôi ✅ (local)

> **Plan:** `.cursor/plans/sample_demo_seed_11055977.plan.md`

| Hạng mục | Chi tiết |
|----------|----------|
| **Dữ liệu** | 10 phiếu `PR-20260629-0001`…`0010` · 10 mẫu `SPL-20260629-0001`…`0010` |
| **Nguồn mẫu** | Thực phẩm · nguyên liệu TP · thức ăn CN · nguyên liệu TACN · phụ gia TACN |
| **Phân bổ trạng thái** | WA×2 · Assigned×1 · InAnalysis×2 · Stored×4 · Disposed×1 |
| **Liên kết** | `PP-ICP-WAT-001` · `PP-LCMS-PST-001` · TB `EQ-ICP-001`/`EQ-LC-MS-001`/… · HC/Chuẩn theo code |
| **Analyst demo** | `Analyst 01`…`05` (string `assignedTo`) |
| **Lưu/hủy** | 4 mẫu Stored (0001, 0004, 0008, 0009) · 0010 Disposed · `storedBy`/`disposedBy`: **Hữu Tài** |

**Chạy seed (idempotent — chỉ wipe prefix demo):**

```powershell
# Nhanh: chỉ module mẫu (cần catalog + PP đã seed trước)
npx tsx prisma/seed-data/samples/run-seed.ts

# Hoặc full (wipe inventory + seed lại tất cả)
npm run db:seed
npx tsx scripts/verify-samples-seed.ts
```

**Code bổ sung (buổi 17 cont):**

- Prefix phiếu YC: **`PR-`** (thay `REQ-`) trong `lib/sample-code.ts`
- Tracking: `listSamplesForTracking()` giữ `Completed` trên Kanban (chỉ loại Stored/Disposed/Rejected)
- Prefill tiếp nhận: `sampleName` từ `purpose` · `preservationCondition` từ dòng `Bảo quản:` trong `note`

**QA browser smoke (2026-06-29):** `/samples/requests` 10/10 · `/samples/tracking` Kanban có mẫu · `/samples/storage` chọn 4 Stored · **E2E FSM/prefill/QR pending**

```powershell
npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260712_sample_reception/migration.sql
$env:NODE_ENV="production"; npx tsx scripts/seed-samples-prod.ts
# Commit + push + redeploy Vercel
```

**Chưa làm / tiếp theo (buổi 17):**

- [ ] **Commit + push** module samples (~40 file) — **không** commit `prisma/dev.db`, `.next/`, `public/uploads/`
- [ ] **Turso prod** — migrate `20260712` + seed permissions (`seed-samples-prod.ts`)
- [ ] **QA browser** — checklist § Module Tiếp nhận mẫu (cuối file)
- [ ] **`npm run build`** sau kill dev server
- [ ] Defer: khóa `methodVersionId` khi `InAnalysis` · link execution PP ↔ sample · sidebar báo cáo samples

Chi tiết file/service: § **Module Tiếp nhận mẫu** (cuối file).

### Phiên trước (2026-06-28/29 — buổi 16) — Module Phương pháp phân tích ✅ (pushed prod)

> **Plan:** `.cursor/plans/analytical_methods_module_e451daa4.plan.md`  
> **Quyết định kiến trúc:** Version-centric · nested layout · Server Actions · AI stub Phase 3

#### Tóm tắt Phase 1–6

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| 1 | Prisma 15 model · sidebar · RBAC · CRUD · upload SOP | ✅ **`54f4ae3`** |
| 2 | `@xyflow/react` flowchart · save/load · fork version | ✅ prod |
| 3 | AI stub API + banner | ✅ stub |
| 4 | Checklist · reagents/equipment · warnings | ✅ prod |
| 5 | QC · approval FSM | ✅ prod |
| 6 | MethodExecution runtime · CSV export | ✅ prod |

**Kiểm tra:**

```powershell
npx tsc --noEmit                                    # pass
npx next build                                      # pass (nếu EPERM: taskkill node → prisma generate)
npx tsx scripts/test-method-approval.ts             # pass
npx tsx scripts/test-method-workflow.ts             # pass
npx prisma db push                                  # local schema applied
npm run db:seed                                     # permission keys mới
```

**Dependencies mới:** `@xyflow/react`, `zod`

**Deploy prod (2026-06-28):**

- Merge `cursor/mobile-scroll-vercel-session` → **`main`** · push **`54f4ae3`**
- Turso: `20260710_element_applications` + `20260711_analytical_methods` via `apply-turso-migration.ts`
- Seed prod: `npx tsx scripts/seed-methods-prod.ts` (permissions + 2 PP; link equipment/chemical warnings nếu thiếu mã trên prod)

**Chưa làm / tiếp theo (buổi 16):**

- [ ] **Commit + push** pan flowchart (`WorkflowCanvas.tsx`, shortcuts modal) — **local uncommitted**
- [x] **Commit + push** buổi 16 core — **`54f4ae3`** on `main`
- [x] **Turso prod** — migrate 15 bảng + seed methods permissions + 2 PP
- [x] **Vercel prod** — deploy từ `main` (menu PP hiện trên prod)
- [ ] **QA browser** — checklist §8 (Undo/Redo + **pan** + module E2E)
- [ ] **Vercel** — QA upload SOP (`BLOB_READ_WRITE_TOKEN`)
- [ ] **AI Phase 3+** — LLM provider · `extractSop` thật
- [ ] **UX P2** — picker catalog · auto-layout flowchart (dagre)
- [ ] **Tab Tổng quan** — field scope/principle/sample prep

#### Buổi 16 (tiếp) — Seed + Undo/Redo ✅ (in `54f4ae3`)

> **Plan seed:** `.cursor/plans/seed_analytical_methods_81d819d2.plan.md`  
> **Plan Undo/Redo:** `.cursor/plans/flowchart_undo_redo_52b873eb.plan.md`

**Seed 2 phương pháp mẫu** (idempotent theo `methodCode`):

| Mã | Mô tả ngắn |
|----|------------|
| `PP-ICP-WAT-001` | Kim loại nặng trong nước · ICP-OES · 18 nodes · QC condition |
| `PP-LCMS-PST-001` | Acetamiprid rau · QuEChERS/LC-MS/MS · 20 nodes · QC condition |

**Catalog seed bổ sung:** `CHEM-0030` (HNO3) · `STD-0027` (Acetamiprid CRM)

**Bugfix:** `createAnalyticalMethodWithVersion` — tạo `AnalyticalMethod` trước `MethodVersion` (SQLite FK)

**Flowchart editor UX** (`components/analytical-methods/workflow/`):

- History stack `past/present/future` (cap 100) · Undo/Redo toolbar + `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`
- Phím tắt: Save, Delete, Copy/Paste/Duplicate, Select all, Esc, zoom · modal **? Phím tắt**
- Multi-select (Shift/Ctrl+click) · clipboard · bảo vệ `start`/`end`
- Dirty badge + auto-save 15s · viewport trong `layoutJson`

#### Buổi 16 (tiếp 2) — Pan canvas flowchart ✅ (local · chưa commit)

> **Plan:** `.cursor/plans/flowchart_pan_gesture_a6330fe5.plan.md`

**File:** [`WorkflowCanvas.tsx`](components/analytical-methods/workflow/WorkflowCanvas.tsx) · [`WorkflowShortcutsModal.tsx`](components/analytical-methods/workflow/WorkflowShortcutsModal.tsx)

| Thao tác | Hành vi |
|----------|---------|
| Kéo chuột trái (vùng trống) | Pan canvas (`panOnDrag={true}`) |
| **Shift** + kéo | Marquee chọn nhiều bước (`selectionOnDrag`) |
| Chuột giữa / phải + kéo | Pan (luôn) |
| Read-only (Approved) | Chỉ pan, không marquee |

- Track `shiftHeld` qua `keydown`/`keyup`/`blur` · cursor `grab` / `crosshair`
- Viewport pan vẫn lưu qua `onMoveEnd` → `layoutJson` (có thể kích hoạt dirty/auto-save)

**Scripts:**

```powershell
npm run db:seed                                          # gồm seedAnalyticalMethods
npx tsx scripts/seed-analytical-methods.ts               # chỉ 2 PP
npx tsx scripts/verify-analytical-methods-seed.ts        # verify counts
npx tsx scripts/verify-analytical-methods-seed.ts --reset  # xóa + seed lại
npx tsx scripts/test-workflow-history.ts                 # pass
npx tsx scripts/list-method-ids.ts
```

Chi tiết file/service: § **Module Phương pháp phân tích** (cuối file).

### Phiên này (2026-06-28 — buổi 10) — Module Thông tin hóa học 🟡 (local · chưa commit)

> **Plan tham chiếu:** `.cursor/plans/chem_info_module_df54c053.plan.md` (không sửa plan file)  
> **Quyết định kiến trúc:** Nested layout `app/chem-info/**` giống Thiết bị · reference DB tách `Chemical` tồn kho · calculators client-side pure functions

#### Tóm tắt Phase 0–6

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| 0 | Prisma schema + migration · sidebar nhóm mới · 4 permission keys · `ChemInfoAppShell` | ✅ |
| 1 | Bảng tuần hoàn 118 nguyên tố · search · detail panel | ✅ |
| 2 | Tra cứu 30 hóa chất · sort/pagination URL · detail + link kho CAS | ✅ |
| 3 | GHS pictograms · safety profiles · SDS upload/link · tab An toàn | ✅ |
| 4 | 4 máy tính (MW · pha dung dịch · C1V1=C2V2 · đơn vị) + unit tests | ✅ |
| 5 | Compatibility **Engine v2** — 31 rules (8 GROUP) · CHEMICAL/GROUP/HAZARD · tier priority · GROUP tab fix | ✅ |
| 6 | **Unit Converter v2** — 17 loại đơn vị · category-first UI · bridge MW/density/radius | ✅ |
| 6 | PubChem proxy API · cache · nút enrich trên detail | ✅ |

**Kiểm tra:** `npx tsc --noEmit` pass · `npx tsx lib/chem-info/calculators/calculators.test.ts` pass · `npx tsx lib/chem-info/calculators/units/conversion-engine.test.ts` pass · `npx tsx lib/services/chem-info/compatibility-engine.test.ts` pass · QA browser local (periodic-table, chemicals list, calculators, compatibility)

**Seed chem-info (local):**
```powershell
npx tsx prisma/seed-data/chem-info/run-seed.ts
```
Hoặc full: `npm run db:seed` (đã gọi `seedChemInfoModule` cuối seed).

**Fix kèm buổi 9:** `/prepared-standards` crash `row.components.map` — export `mapPreparedStandardRow()` từ `lib/services/prepared-standards.ts` · dùng trong `listPreparedStandards()`.

#### Chưa làm (buổi 10)

- [ ] **QA browser prod** — GHS pictograms · SDS upload (Blob) · PubChem enrich trên prod
- [ ] **Turso prod** — migrate `20260707_chem_info_module` + chạy seed chem-info
- [ ] **Commit** — gộp với buổi 7–9 hoặc tách PR chem-info riêng
- [ ] **Defer:** link từ drawer `/chemicals` → chem-info · gợi ý compatibility khi nhập kho · RDKit 2D client-side

Chi tiết file/service: § **Module Thông tin hóa học** (cuối file).

### Phiên này (2026-06-28 — buổi 11) — Tra cứu HC + Compatibility Engine v2 ✅ (local · chưa commit)

> **Plan:** tra cứu PubChem · filter syncStatus · [`compatibility_rule_engine_v2`](.cursor/plans/)

**Module:** Bảng tuần hoàn · Tra cứu HC · Máy tính · Tương thích (`/chem-info/*`).

**Đã làm:**

- [x] PubChem online (phương án B): `GET /api/chem-info/pubchem/search` + `POST /api/chemicals/search-online` · max 20 · backend proxy
- [x] List HC: server pagination/search/sort · 25/trang · dedup CAS→CID→InChIKey→normalizedName · SDS URL/path only
- [x] Fix PubChem UI error (catch rỗng) · middleware JSON 401
- [x] Fix filter `syncStatus` PrismaClientValidationError · `buildSyncStatusWhere` + `prisma generate`
- [x] **Compatibility Engine v2** — operand `cas|group|hazard` exact · tier CHEMICAL>GROUP>HAZARD · 31 rules · migration `20260709`
- [x] **Compatibility GROUP tab** — 8 GROUP rules · UPPERCASE slugs · `evaluateGroupCompatibility`
- [x] **Unit Converter v2** — module `calculators/units/` · 17 category · 12 test cases pass
- [x] Test CLI pass (xem § handoff cuối file)

**Chưa làm:**

- [ ] QA browser prod (tra cứu + compatibility cặp Formic/Benzoic/HCl+NaOH)
- [ ] Turso migrate `20260707`–`20260709` + seed — **✅ done 2026-06-28**
- [ ] Commit buổi 7–11 + buổi 14
- [ ] UI copy compatibility: đổi sang “Không có quy tắc xung đột được định nghĩa…” (hiện: “Không có dữ liệu tương thích”)
- [ ] Defer: link drawer `/chemicals` · compatibility khi nhập kho · bulk PubChem refresh

Chi tiết: § **Thông tin hóa học — handoff ngắn** (cuối file).

### Phiên này (2026-06-28 — buổi 14) — MW parser v2 + Tra cứu mobile + PubChem tên ✅ (local · chưa commit)

**Module:** Máy tính hóa học (`/chem-info/calculators`) → tab **Khối lượng mol** · Tra cứu hóa chất (`/chem-info/chemicals`).

**Đã làm — Khối lượng mol (parser v2):**

- [x] Module mới [`lib/chem-info/calculators/molecular-formula-parser.ts`](lib/chem-info/calculators/molecular-formula-parser.ts) — case-insensitive · hydrate/solvate/adduct (`.`, `·`, `•`) · hệ số thập phân · clathrate `CH4.5.75H2O`
- [x] Refactor [`molecular-weight.ts`](lib/chem-info/calculators/molecular-weight.ts) — `parts[]` breakdown + aggregated elements
- [x] UI [`MolecularWeightCalculator.tsx`](components/chem-info/MolecularWeightCalculator.tsx) — bảng phần công thức | hệ số | khối lượng + bảng nguyên tố gộp
- [x] Fix: regex capture group (hệ số nguyên tử) · phân biệt **Co** vs **CO₃** (`normalizeElementCase`)

**Nguyên nhân lỗi cũ:** parser chỉ match `[A-Z]` · bỏ qua phần sau dấu `.` · `Co` match nhầm trong `Na2CO3`.

**Parser hỗ trợ:** `h2so4` · `H2SO4.H2O` · `CuSO4.5H2O` · `FeCl3.6CH3OH` · `CaCl2.8NH3` · `NaCl.2H2O.CH3OH` · `(H2O)5` · clathrate best-effort.

**Test CLI pass:**

```powershell
npx tsx lib/chem-info/calculators/molecular-weight.test.ts
```

**Đã làm — Tra cứu mobile (mất chữ khi gõ):**

- [x] Fix race [`useDebouncedListQuery.ts`](lib/hooks/useDebouncedListQuery.ts) — **không sync URL→input khi input đang focus** · debounce 450ms · `commitSearch()` Enter/blur
- [x] [`useListQueryState.ts`](lib/hooks/useListQueryState.ts) — `router.replace(..., { scroll: false })`
- [x] [`ChemicalLookupClient.tsx`](components/chem-info/ChemicalLookupClient.tsx) — `autoCapitalize="none"` · `autoCorrect="off"` · `spellCheck={false}` · `inputMode="search"`

**Nguyên nhân:** `useEffect` ghi đè `inputValue` từ `initialQuery` (URL cũ hơn) khi user gõ nhanh hơn debounce + RSC round-trip.

**Đã làm — PubChem tên hiển thị:**

- [x] [`lib/services/chem-info/display-name.ts`](lib/services/chem-info/display-name.ts) — `pickPubChemDisplayName()` lọc DTXSID/CID/CAS · ưu tiên synonym khớp query
- [x] [`pubchem.ts`](lib/services/chem-info/pubchem.ts) — cache v3 · truyền `query` từ search

**Test CLI pass:** `npx tsx lib/services/chem-info/display-name.test.ts`

**Chưa làm:**

- [ ] QA browser mobile: gõ liên tục `acetamiprid` không mất chữ · search `ethanol`, `h2so4`, `64-17-5`
- [ ] QA tab Khối lượng mol: các công thức hydrate ở trên
- [ ] QA PubChem online: acetamiprid không hiện DTXSID làm tên chính
- [ ] Commit buổi 14 (+ push + redeploy)

Chi tiết: § **5c. Molecular Weight parser v2** (cuối file).

### Phiên này (2026-06-28 — buổi 13) — Dilution Calculator v2 + v2.1 ✅ (commit **`108160b`** · pushed · redeploy prod)

**Module:** Máy tính hóa chất (`/chem-info/calculators`) → tab **Pha loãng C₁V₁=C₂V₂**.

**Đã làm — Pha loãng v2 (3 chế độ):**

- [x] Module [`lib/chem-info/calculators/dilution/`](lib/chem-info/calculators/dilution/) — normalize (reuse `units/conversion-engine`) · validate · single · serial · calibration
- [x] **Pha loãng đơn** — tính V₁/V₂/C₁/C₂ · đơn vị nồng độ · thể tích · MW/mật độ động · hướng dẫn thao tác
- [x] **Pha loãng nối tiếp** — hệ số 2×/5×/10×/tùy chỉnh · bảng Step/Cfinal/V stock/V dung môi/V cuối
- [x] **Chuẩn hiệu chuẩn** — stock + danh sách nồng độ đích · bảng copy được (TSV)
- [x] Validate: C₂≤C₁ · V₁≤V₂ · bridge MW/density · cảnh báo pipet &lt; 10 µL
- [x] UI [`components/chem-info/dilution/`](components/chem-info/dilution/)

**Đã làm — Pha loãng v2.1 (đơn vị + hiển thị thể tích):**

- [x] Nồng độ thêm: **ppb · µg/L · ng/L** · disclaimer aqueous: 1 ppm ≈ 1 mg/L · 1 ppb ≈ 1 µg/L
- [x] Hub normalize aqueous qua **µg/L** (mg/L ↔ ppm ↔ ppb ↔ ng/L cross-convert)
- [x] Dropdown **Hiển thị thể tích bằng** (mL/µL) — Serial + Calibration · bảng copy đúng unit
- [x] Cảnh báo: *Thể tích quá nhỏ, nên pha loãng trung gian.* (&lt; 10 µL) · V stock &gt; V final
- [x] Fix precision: `convertVolumeForDisplay` mL↔µL trực tiếp · `volumeToLiters` fallback qua µL
- [x] Test CLI pass: `npx tsx lib/chem-info/calculators/dilution/dilution.test.ts` (legacy + T1–T8 v2.1 + ppb bridge)

**Chưa làm:**

- [ ] QA browser tab Pha loãng — 3 mode · dropdown mL/µL · µg/L target · cảnh báo pipet (**prod có thể test sau redeploy**)
- [ ] Commit buổi 7–12 + **buổi 14** (chem-info còn lại)

Chi tiết: § **Dilution Calculator v2 / v2.1** (cuối file).

### Phiên này (2026-06-28 — buổi 12) — Unit Converter v2 + Compatibility GROUP tab ✅ (local · chưa commit)

> **Plan:** [`unit_converter_upgrade`](.cursor/plans/) · [`fix_group_compatibility`](.cursor/plans/)

**Module:** Máy tính hóa chất (`/chem-info/calculators`) · Tương thích hóa chất (`/chem-info/compatibility`).

**Đã làm — Quy đổi đơn vị (Unit Converter v2):**

- [x] Module mới [`lib/chem-info/calculators/units/`](lib/chem-info/calculators/units/) — `unit-definitions`, `conversion-engine`, `bridge-rules`, `unit-categories`
- [x] **17 loại đơn vị** UI (category-first dropdown): Khối lượng · Thể tích · Nồng độ mol/khối lượng · Quy đổi mol↔khối lượng · Phần trăm · ppm/ppb · Lượng chất · Normality/Molality · Khối lượng↔thể tích · Nhiệt độ · Áp suất · Mật độ · Độ dẫn · Lưu lượng · Thời gian · Ly tâm
- [x] ~60 unit codes (Phase 1 + Phase 2) · direct + bridge (MW, density, rotor radius)
- [x] UI [`UnitConverter.tsx`](components/chem-info/UnitConverter.tsx) — Loại đơn vị → Từ/Sang filtered · context fields động
- [x] Backward-compat [`unit-convert.ts`](lib/chem-info/calculators/unit-convert.ts) re-export
- [x] Test CLI pass: `npx tsx lib/chem-info/calculators/units/conversion-engine.test.ts` (12 cases)

**Đã làm — Tương thích tab Theo nhóm nguy hiểm:**

- [x] **8 rule GROUP** (từ 1) — OXIDIZER↔REDUCING_AGENT · OXIDIZER↔FLAMMABLE · ACID↔CYANIDE · … · **31 rules** total seed
- [x] Slug **UPPERCASE** (`OXIDIZER`, `REDUCING_AGENT`, `STRONG_ACID`, …) — [`hazard-category-map.ts`](lib/chem-info/hazard-category-map.ts)
- [x] Tab nhóm chỉ match `ruleType=GROUP` — [`evaluateGroupCompatibility()`](lib/services/chem-info/compatibility-engine.ts)
- [x] `subjectFromCategory()` expand alias (STRONG_ACID → ACID)
- [x] Test CLI pass: `npx tsx lib/services/chem-info/compatibility-engine.test.ts`

**Chưa làm:**

- [ ] QA browser: `/chem-info/calculators` tab Quy đổi đơn vị (category dropdown · OXIDIZER+REDUCING_AGENT compatibility)
- [ ] QA browser: `/chem-info/compatibility` tab Theo nhóm nguy hiểm
- [ ] Re-seed prod sau deploy: `npx tsx scripts/seed-chem-info-only.ts`
- [ ] Commit buổi 7–12

Chi tiết: § **Unit Converter v2** · § **Compatibility GROUP tab** (cuối file).

---

### Phiên trước (2026-06-28 — buổi 9) — List sorting & pagination toàn hệ thống 🟡 (local · chưa commit)

> **Plan tham chiếu:** `.cursor/plans/list_sorting_implementation_50213a9a.plan.md`  
> **Quyết định kiến trúc:** RSC `searchParams` (không REST list API) · pagination ưu tiên ledger/usage/prep-history · catalog sort-only

#### Tóm tắt 5 phase

| Phase | Phạm vi | Trạng thái |
|-------|---------|------------|
| 0 | `lib/list-query` · `DataTable` sort · pilot `/equipment/catalog` | ✅ |
| 1 | Catalog gốc + pha chế (6 module) | ✅ |
| 2 | Sổ cái · Nhật ký · Lịch sử pha chế + pagination | ✅ |
| 3 | 8 submodule thiết bị | ✅ |
| 4 | Env logs · Thông báo · Thống kê · Stock-in history · index Prisma | ✅ |

**Kiểm tra:** `npx tsc --noEmit` pass · `npx tsx lib/list-query/parse.test.ts` pass

#### Chưa làm (buổi 9)

- [ ] **QA browser** — checklist § List sorting (cuối HANDOFF)
- [ ] **Commit** — gộp hoặc tách PR riêng sorting · không commit `.next/`, `dev.db`, uploads
- [ ] **Turso** — **✅ `20260706` done** (2026-06-28)
- [ ] **Defer:** pagination catalog/pha chế · sort `itemCode` usage logs · admin people/tasks

Chi tiết file/service: § **List sorting & pagination** (cuối file).

---

### Phiên trước (2026-06-27 — buổi 8) — Pha chế: nhãn/trường nồng độ + hàng lý thuyết/thực tế · Nhập kho mã vật tư 🟡 (local · chưa commit)

> **Plan tham chiếu:**  
> - `.cursor/plans/prepared_form_field_reorder_d108651d.plan.md` (nhãn + thứ tự form/bảng/export — **đã implement**)  
> - `.cursor/plans/concentration_row_layout_b432a338.plan.md` (3 ô nồng độ cùng hàng — **đã implement**)  
> **Git:** chưa commit · HEAD vẫn **`18fe925`**

#### A — Chuẩn hóa nhãn & thứ tự trường pha chế (UI only, không migration DB)

| Cũ | Mới |
|----|-----|
| Nồng độ | **Nồng độ lý thuyết** (`concentration`) |
| Nồng độ sau pha | **Nồng độ thực tế** (`finalConcentration`) |
| Nồng độ gốc | **Ẩn UI** (`originalConcentration` giữ cột DB) |

**Thứ tự form (sau Mã pha/Mã lô):** Cấp (nếu có) → Tên → Công thức → nồng độ → …

| File | Thay đổi |
|------|----------|
| `components/preparation/PreparationIsoFormFields.tsx` | Bỏ Công thức + Nồng độ gốc + Nồng độ thực tế khỏi block ISO |
| `components/prepared-standards/PreparedStandardsClient.tsx` | Form/bảng/drawer: Cấp→Tên→Công thức→nồng độ |
| `components/prepared-chemicals/PreparedChemicalsClient.tsx` | Tương tự (không Cấp) |
| `lib/modules/configs.ts` | `commonPrepared` + `preparedStrain` tableKeys/fields |
| `lib/actions/modules.ts` | Map `finalConcentration` create/update strain |
| `lib/services/modules.ts` | `getPreparedStrains()` trả `finalConcentration`, `level` |
| `lib/prepared-standards-fields.ts` · `lib/prepared-chemicals-fields.ts` · `lib/prepared-excel.ts` | Export/import nhãn đồng bộ |
| `lib/services/preparation-history-report.ts` · `PreparationHistoryReportClient.tsx` | Cột **Nồng độ lý thuyết** / **Nồng độ thực tế** |

**QA browser (2026-06-27):** header bảng + lịch sử pha chế đúng nhãn trên `/prepared-standards`, `/prepared-chemicals`, `/prepared-strains`, `/preparation-history`.

#### B — Gom nồng độ lý thuyết + thực tế trên cùng một hàng

| Module | Layout form |
|--------|-------------|
| Chuẩn + Hoá chất | `Nồng độ lý thuyết` \| `Nồng độ thực tế` \| `Đơn vị nồng độ` (1 đơn vị chung) |
| Chủng | `Nồng độ lý thuyết` \| `Nồng độ thực tế` (2 cột, không `concentrationUnit` trong schema) |

| File | Thay đổi |
|------|----------|
| **`components/preparation/ConcentrationPairFields.tsx`** | **Mới** — component 2/3 cột dùng chung |
| `PreparedStandardsClient.tsx` · `PreparedChemicalsClient.tsx` | Dùng `ConcentrationPairFields`; drawer hiển thị thực tế kèm `concentrationUnit` |
| `ModuleCrudClient.tsx` | Render cặp nồng độ; skip `finalConcentration` trùng |
| `lib/modules/configs.ts` | `formula` → `colSpan: 2` trong `commonPrepared` |

**QA browser (2026-06-27):** modal 3 trang — 3 ô cùng hàng (Chuẩn/HC); Chủng 2 ô cùng hàng; block ISO không còn ô Nồng độ thực tế.

#### C — Nhập kho: fix Mã vật tư khóa nhưng submit báo thiếu

| File | Thay đổi |
|------|----------|
| **`lib/stock-in-code.ts`** | **Mới** — `resolveStockInCode`, `formatStockInCodeFromSequence` |
| `StandardStockInForm.tsx` · `StrainStockInForm.tsx` · `ChemicalStockInForm.tsx` | Sync identity → code; `CodeSequenceInput` |
| `StockInClient.tsx` | `sequenceNumber` state; validate trước submit |
| `lib/stock-in-master.ts` · `lib/actions/stock-in.ts` | `reserveMasterCode`; resolve code từ sequence |

**QA browser (buổi trước trong chat):** nhập mã + lưu pass trên `/stock-in`.

#### Chưa làm (buổi 8)

- [ ] **Commit** gộp buổi 7 + buổi 8 (hoặc tách 2 PR nếu muốn review riêng)
- [ ] **QA lưu/sửa** record pha chế — xác nhận `formula` + `finalConcentration` persist; `originalConcentration` không bắt buộc
- [ ] **Regression** import Excel pha chế với header cũ `"Nồng độ"` (alias vẫn map → `concentration`)
- [ ] **Turso prod** — không cần migrate (chỉ UI); redeploy sau commit

---

### Phiên trước (2026-06-27 — buổi 7) — Chuẩn hóa mã chuẩn pha + Nhập kho creatable group 🟡 (local · chưa commit)

> **Plan tham chiếu:** `.cursor/plans/chuẩn_hóa_mã_chuẩn_pha_e2056806.plan.md` · `.cursor/plans/creatable_group_stock-in_e1eadf04.plan.md`  
> **Git:** chưa commit · HEAD vẫn **`18fe925`**

#### A — Prefix theo cấp chuẩn pha (PreparedStandard)

| Cấp | Prefix mới |
|-----|------------|
| Chuẩn gốc pha | `PSTD` |
| Trung gian 1/2/3 | `IST1` / `IST2` / `IST3` |
| Chuẩn làm việc | `WSTD` |

| Thành phần | Chi tiết |
|------------|----------|
| **Mapping** | `lib/code-prefixes.ts` — `prefixForPreparedStandard` 5 cấp · `isPreparedStandardMasterCode` · `assertPrefixMatchesPreparedStandardLevel` |
| **Chuẩn vi sinh trung gian** | `IST1–3` → **`PST1–3`** (giải phóng IST cho chuẩn pha) · `prefixForPreparedStrain` |
| **Sequence** | `lib/services/code-generator.ts` — `masterCodeExists` tách PreparedStandard vs PreparedStrain |
| **API** | `lib/actions/prepared-standards.ts` — validate prefix khi create · **khóa đổi level** sau tạo |
| **Import** | `lib/actions/prepared-import.ts` — validate prefix khớp level · set `codePrefix`/`sequenceNumber` |
| **UI** | `PreparedStandardsClient` — prefix động theo cấp · khóa level khi sửa/pha lại |

**Migration scripts (local đã chạy PASS):**

```powershell
npx tsx scripts/migrate-strain-prefix-pst.ts              # IST→PST strain (local: 0 row)
npx tsx scripts/migrate-prepared-standard-level-prefix.ts # PSTD→IST/WSTD theo level
npx tsx scripts/backfill-code-snapshots-after-prefix-migration.ts
npx tsx scripts/seed-code-sequences.ts
npx tsx scripts/verify-code-migration.ts                  # PASS
npx tsx scripts/test-code-generator.ts                    # PASS
```

**Ví dụ remap local:** `PSTD-0002-001` → `IST1-0002-001` · `PSTD-0001-001` → `WSTD-0001-001` · backfill 13 snapshot + 21 inventory tx + 15 audit log.

**Seed demo cập nhật:** `prisma/seed.ts` (caffeine chain IST/WSTD) · `prisma/seed-data/links.ts` (`WSTD-0006` thay `PSTD-0006`).

**Turso prod pipeline:** `scripts/apply-prepared-standard-prefix-migration.ps1`

**Chưa làm:** commit · Turso prod chạy pipeline trên · QA browser tạo IST2/WSTD mới · cập nhật doc QA trace (`WSTD-0006` thay `PSTD-0006`)

#### B — Nhập kho: nhóm creatable (HC / Chuẩn / Chủng)

| Thành phần | Chi tiết |
|------------|----------|
| **Page** | `app/stock-in/page.tsx` — load `getChemicalGroups` / `getStandardGroups` / `getStrainGroups` |
| **Client** | `StockInClient.tsx` — truyền `groupOptions` xuống 3 sub-form |
| **Forms** | `ChemicalStockInForm` · `StandardStockInForm` · `StrainStockInForm` — `<select>` → `input` + `datalist` (giống catalog) |
| **Backend** | Không đổi — `lib/stock-in-master.ts` đã lưu chuỗi tùy ý |

**QA cần:** chọn nhóm cũ từ gợi ý · gõ nhóm mới · auto-fill từ master vẫn sửa được trước lưu.

### Phiên trước (2026-06-27 — buổi 4) — Inventory Transaction Engine + fix Available vs Ledger ✅ (commit `2d22c52`)

> **Plan tham chiếu:** `.cursor/plans/inventory_transaction_engine_83298936.plan.md` (không sửa file plan)  
> **Bug fix plan:** `.cursor/plans/fix_available_ledger_bug_0c4e0470.plan.md`  
> **Git:** commit **`2d22c52`** — gộp với buổi 5 parentCode

#### Phase A — Foundation

| Thành phần | Chi tiết |
|------------|----------|
| **Migration** | `prisma/migrations/20260701_inventory_tx_engine` — `InventoryTransactionType`, `inventoryStatus`, `Rejected`, `consumeTransactionId`, fields ledger mở rộng |
| **Engine** | `lib/services/inventory-transaction-engine.ts` — `getAvailableQuantity`, `getInventorySummary`, `postInventoryTransaction`, guard incomplete ledger |
| **Types / lifecycle** | `inventory-transaction-types.ts`, `inventory-lifecycle.ts`, `inventory-transaction-summary.ts` (unit mg/g normalize) |
| **Wrapper** | `lib/inventory-stock.ts` — ghi `transactionType` trên mọi tx |
| **Backfill types** | `scripts/backfill-inventory-transaction-types.ts` |
| **Reconcile** | `scripts/reconcile-inventory-balances.ts` |

#### Phase B — Prep lifecycle (Reject, no restore)

| Thành phần | Chi tiết |
|------------|----------|
| **FSM** | `Rejected` từ Prepared/Checked · lý do bắt buộc |
| **Stock GLP** | Cancel/Reject sau Draft→Prepared **không restore** nguyên liệu |
| **UI** | `PreparationWorkflowPanel` — nút/dialog Reject |
| **Link CONSUME** | `consumeTransactionId` trên ingredients sau Draft→Prepared |
| **CREATE output** | `creditPreparedStandardOutput` khi Approved (PreparedStandard) |

#### Phase C — Discard / Adjust / Expire

| Thành phần | Chi tiết |
|------------|----------|
| **Actions** | `lib/actions/inventory-transactions.ts` — discard, adjust, expire, reverse, fetch summary/tx |
| **UI tab Tồn kho** | `InventoryItemPanel` — Standards, Chemicals, Prepared Standards drawers |
| **Usage logs** | Map IN→CREATE, USE→CONSUME, DISPOSE→DISCARD |

#### Phase D — Cutover UI

| Thành phần | Chi tiết |
|------------|----------|
| **Statistics / StockLotPicker** | `inventory-available-enrichment.ts` — hiển thị **Khả dụng** từ ledger |
| **Sổ cái** | Filter/cột `transactionType`, `reason` |
| **Tests** | `test-inventory-transaction-engine.ts`, `test-prep-reject-no-restore.ts` — **PASS** |

#### Fix Available vs Ledger (STD-0001)

| Vấn đề | Available=0 trong khi history Before→After 9.99→9.98 vì thiếu CREATE mở đầu |
| Fix | `lib/services/inventory-opening-balance.ts` + `scripts/backfill-opening-balance-create.ts` |
| Seed | `prisma/seed.ts` — tự tạo opening CREATE sau seed |
| UI | `InventoryItemPanel` — footnote + cột **Tồn ledger** (running balance) |
| Local verify | STD-0001 available=9.98 = cache · reconcile OK · adjust giảm 0.01 g pass |

**Scripts đã chạy local:**

```powershell
npx tsx scripts/backfill-inventory-transaction-types.ts
npx tsx scripts/backfill-opening-balance-create.ts   # 96 CREATE rows
npx tsx scripts/test-inventory-transaction-engine.ts
npx tsx scripts/reconcile-inventory-balances.ts
```

**Chưa làm phiên này:** ~~commit~~ → **`2d22c52`** · Turso prod migrate · QA browser tab Tồn kho + Reject + adjust · ~~`PreparedChemicalsClient` tab Tồn kho~~ (buổi 6) · scripts `test-discard-residue.ts` / `test-reversal-adjustment.ts` (plan gốc)

### Phiên này (2026-06-27 — buổi 6) — ISO 17025 mở rộng Phase 0–4 ✅ (commit `18fe925`)

> **Plan tham chiếu:** `.cursor/plans/iso_17025_module_expansion_154c3fb1.plan.md` · QA CG01: `.cursor/plans/qa_chuẩn_pha_chế_21eec604.plan.md`  
> **Git:** commit **`18fe925`** — *Add ISO buổi 6 environmental logs, preparation ISO fields, and stock lot purity.* · **đã push**

#### Phase 0 — Hoàn thiện parentCode UX

| Thành phần | Chi tiết |
|------------|----------|
| **Excel label** | `PreparationHistoryReportClient` — **Export Excel (15 cột)** |
| **Excel Mã nhóm** | `prepared-excel.ts`, `prepared-chemicals-fields.ts` |
| **Pha lại** | `PreparedChemicalsClient`, `ModuleCrudClient` (Chủng) — nút **Pha lại** trên Rejected |
| **Tab Tồn kho** | HC + Chủng — drawer `InventoryItemPanel` (giống Chuẩn) |

#### Phase 1 — StockLot purity / uncertainty

| Thành phần | Chi tiết |
|------------|----------|
| **Schema** | `StockLot.purity`, `StockLot.uncertainty` |
| **Migration** | `20260703_stock_lot_purity` |
| **UI** | Form nhập kho + lot panel hiển thị/sửa purity |

#### Phase 2 — Nhật ký môi trường

| Thành phần | Chi tiết |
|------------|----------|
| **Schema** | `EnvironmentalLog` model |
| **Migration** | `20260704_environmental_log` |
| **Route** | `/environment-logs` · `lib/services/environmental-logs.ts` |
| **RBAC** | Permission `environment_logs` (26 quyền sidebar) |
| **Gắn pha chế** | `preparationCondition` / env log picker trong ISO form |

#### Phase 3 — ISO form fields + thiết bị

| Thành phần | Chi tiết |
|------------|----------|
| **Component** | `PreparationIsoFormFields.tsx` — công thức, nồng độ, thiết bị, env log, đính kèm |
| **Upload** | `lib/preparation-upload.ts` |
| **Equipment FK** | `equipmentId` trên Prepared* · migration `20260705_preparation_equipment` |
| **Calibration warn** | Cảnh báo hiệu chuẩn hết hạn khi chọn thiết bị |

#### Phase 4 — Báo cáo, in, alerts

| Thành phần | Chi tiết |
|------------|----------|
| **Print** | Print styles cho form/báo cáo pha chế |
| **Report filter** | `parentCode` filter trên `/preparation-history` |
| **Ledger link** | `InventoryItemPanel` → `?preparationId=` |
| **Alerts** | Prep alerts trong `lib/services/alerts.ts` |

**Scripts / verify local:**

```powershell
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260703_stock_lot_purity/migration.sql
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260704_environmental_log/migration.sql
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260705_preparation_equipment/migration.sql
npx prisma generate
npx tsc --noEmit          # PASS
npx tsx scripts/test-prepared-batch-code.ts   # PASS
npm run build             # PASS 2026-06-27 (SSG warnings nếu dev.db chưa migrate đủ)
```

**Chưa làm phiên này:** Turso prod migrate `20260703`–`20260705` · `db:seed` permission `environment_logs` · redeploy · commit fix filter nhóm catalog (6 file uncommitted)

#### QA browser chuẩn pha chế CG01 (local) — pass 2026-06-27

| Kiểm tra | Kết quả |
|----------|---------|
| **CG01-003** | Form ISO đầy đủ (STD-0001 CAF-2301 10 mg + CHEM-0009 10 mL) · Draft → Prepared → Checked → Approved |
| **Truy xuất CG01-003** | STD-0001 + CHEM-0009 · không lỗi `parentCode` |
| **CG01-004** | Lô 2 cùng nhóm CG01 · Draft |
| **CG02-001** | Chuẩn trung gian từ CG01-003 (1 mL) + CHEM-0009 9 mL · trace 2 tầng OK |
| **`/preparation-history`** | Filter `parentCode=CG01` → **8/38** dòng · có CG01-003/004 |

**Lưu ý QA (không chặn lưu):** Drawer workflow badge lag đến khi đóng/mở lại · form intermediate mặc định ĐVT nguồn `ppm` — cần đổi `mL` · modal picker đôi khi cần CDP click.

### Phiên tiếp (2026-06-27) — Fix filter nhóm catalog 🟡 (local · chưa commit)

| Vấn đề | Dropdown lọc **Nhóm chuẩn** chỉ có CRM/RM/Working — nhóm mới **BVTV** không hiện dù bảng có |
| Nguyên nhân | Filter dùng `STANDARD_GROUP_FILTER_OPTIONS` cố định; form/datalist đã dùng `getStandardGroups()` từ DB |
| Fix | `buildStandardGroupFilterOptions(groupOptions)` — áp dụng `/standards`, `/chemicals`, `/microbial-strains` |
| File | `lib/*-fields.ts` · `StandardsClient.tsx` · `ChemicalsClient.tsx` · `MicrobialStrainsClient.tsx` |

**Phiên tiếp:** commit + push 6 file · reload `/standards` xác nhận BVTV trong dropdown

### Phiên trước (2026-06-27 — buổi 5) — parentCode + batch lô pha chế + fix tab Tồn kho ✅ (commit `2d22c52`)

> **Plan tham chiếu:** `.cursor/plans/prepared_batch_parentcode_b3e62ee3.plan.md` (không sửa file plan)  
> **Git:** commit **`2d22c52`** — *"Add prepared batch parentCode numbering and ledger-first inventory engine."*

#### A — Fix tab Tồn kho: thiếu `stockLotId` khi adjust

| Vấn đề | `/standards` → STD-0001 · Lot CAF-2301 → tab **Tồn kho** → adjust giảm → *"Không chọn lot cụ thể. Hệ thống không cho phép trừ tồn FIFO tự động."* |
| Nguyên nhân | `InventoryItemPanel` không gửi `stockLotId` trong FormData · server fallback FIFO · policy mặc định chặn (`lib/inventory-lot-policy.ts`) |
| Fix | Prop `stockLotId` trên `InventoryItemPanel` · truyền từ `StandardsClient` / `ChemicalsClient` khi drawer mở theo dòng lot |

#### B — parentCode + batchNumber (multi-batch cùng nhóm)

| Thành phần | Chi tiết |
|------------|----------|
| **Schema** | `PreparedChemical`, `PreparedStandard`, `PreparedStrain`: `parentCode String @default("")`, `batchNumber Int @default(1)` · `@@index([parentCode])` · `@@unique([parentCode, batchNumber])` · `code` vẫn unique toàn cục (mã lô đầy đủ, vd. `CG01-003`) |
| **Migration** | `prisma/migrations/20260702_prepared_parent_batch/` — `migration.sql` + `add_columns*.sql` + `backfill_and_index.sql` (SQLite: thêm cột trước, backfill, rồi unique index) |
| **Lib** | `lib/prepared-batch-code.ts` — format/parse, `getNextBatchNumber`, `resolvePreparedBatchIdentity`, `previewNextPreparedBatchCode` |
| **UI grouping** | `lib/prepared-batch-rows.ts` — gộp bảng theo `parentCode` |
| **Server actions** | `prepared-standards.ts`, `prepared-chemicals.ts`, `modules.ts` (Strain), `prepared-import.ts` — create nhập **Mã nhóm** → auto **Mã lô**; update không đổi code/parent/batch |
| **UI form** | `PreparedStandardsClient`, `PreparedChemicalsClient`, `ModuleCrudClient` — field **Mã nhóm** + preview **Mã lô** khi tạo mới |
| **Pha lại** | `PreparedStandardsClient` — nút **Pha lại** trên bản ghi **Rejected** · prefill parentCode + copy ingredients/solvents → lô mới `MAX(batchNumber)+1` |
| **Báo cáo** | `preparation-history-report.ts` — cột **Mã nhóm** + **Mã lô** (15 cột) · traceability node có `parentCode`/`batchNumber` |
| **Backfill local** | `scripts/backfill-prepared-parent-codes.ts` — 3 HC + 13 chuẩn + 3 chủng · legacy (`PSTD-*`, `TG2`) → `parentCode=code`, `batchNumber=1` |
| **Test** | `scripts/test-prepared-batch-code.ts` — **PASS** · `npx tsc --noEmit` — **PASS** |

**Luồng CG01 (sau fix):**

```
CG01 · Caffeine 1000 ppm
 ├─ CG01-001 · Rejected
 └─ CG01-002 · Active
     → Tạo mới Mã nhóm CG01 → auto CG01-003 (Draft)
     → Pha lại từ CG01-001 Rejected → CG01-003
```

**Quyết định thiết kế:** Không tạo bảng `PreparationBatch` riêng · mỗi lô = 1 row Prepared* · lô Rejected giữ số batch (ISO audit) · parse suffix `-NNN` chỉ cho mã không legacy (`^(PSTD|PCHEM|PMS)-` excluded).

**Scripts đã chạy local:**

```powershell
npx prisma db execute --file prisma/migrations/20260702_prepared_parent_batch/add_columns.sql
npx prisma db execute --file prisma/migrations/20260702_prepared_parent_batch/add_columns_remaining.sql
npx tsx scripts/backfill-prepared-parent-codes.ts
npx prisma db execute --file prisma/migrations/20260702_prepared_parent_batch/backfill_and_index.sql
npx tsx scripts/test-prepared-batch-code.ts
npx prisma generate   # restart dev nếu EPERM
```

**Chưa làm phiên này:** ~~commit~~ → **`2d22c52`** · Turso prod migrate + backfill · ~~QA browser CG01~~ ✅ · Excel import/export `parentCode` · ~~Pha lại HC/Chủng~~ (buổi 6) · QA adjust tab Tồn kho sau fix `stockLotId`

### Phiên trước (2026-06-27 — buổi 3) — ISO Phase 4 + QA browser ✅

#### ISO Phase 4 — Báo cáo lịch sử pha chế — commit `16d1efb`

| Thành phần | Chi tiết |
|------------|----------|
| **Service** | `lib/services/preparation-history-report.ts` — 14 cột ISO · expand component/solvent rows |
| **Route** | `/preparation-history` — filter loại/trạng thái/ngày · search |
| **UI** | `PreparationHistoryReportClient.tsx` — DataTable + Export Excel |
| **RBAC** | Permission `preparation_history` (25 quyền sidebar) |
| **Excel** | Cập nhật `prepared-excel.ts` / fields · seed chain `links.ts` |

#### QA browser (local) — pass 2026-06-27

| Kiểm tra | Kết quả |
|----------|---------|
| **FSM Draft→Approved** | `PCHEM-QA-001` · A.Minh → B.Quang → M.Kieu · tab Lịch sử 4 events · trừ tồn OK |
| **Soft delete + tái mã TG2** | Xóa mềm TG2 Caffein · tạo lại mã **TG2** OK · ghost `TG2__deleted__*` |
| **Export Excel 14 cột** | Toast **Đã export 26 dòng Excel** · 14 header · có `PCHEM-QA-001` + 2 dòng TG2 |
| **Filter search** | Search `PCHEM-QA-001` → 1/26 dòng · trạng thái **Đã duyệt** |

**Lưu ý QA:** Drawer workflow không tự refresh sau transition — đóng/mở lại để thấy nút bước tiếp. React hydration warning `Sidebar.tsx` (dev overlay only).

**Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD **`16d1efb`** · **đã push**

**Chưa QA:** tab Truy xuất PSTD-0006 · reverse STD-0007 · amend sau Approved · filter loại/trạng thái/ngày đầy đủ · prod redeploy Phase 4

### Phiên cùng ngày (2026-06-27 — buổi 2) — ISO Phase 3 + Prod ops + fix mã soft delete ✅

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

**Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD **`d0fe44f`** (trước Phase 4)

### Phiên cùng ngày (2026-06-27 — buổi 1) — Nhân sự + ISO pha chế Phase 1+2 ✅

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

- ✅ [`components/TouchVerticalScroll.tsx`](components/TouchVerticalScroll.tsx) — scroll dọc + fade trên/dưới (`fadeClassName="from-slate-950"`) · **buổi 20:** `h-full min-h-0` — desktop wheel scroll
- ✅ [`components/Sidebar.tsx`](components/Sidebar.tsx) — shell `flex h-full min-h-0 flex-col` · nav trong `TouchVerticalScroll` · aside `h-screen overflow-hidden` · mobile drawer scroll · lock `body overflow` khi menu mở

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

#### Quy đổi đơn vị

| Phạm vi | File | Ghi chú |
|---------|------|---------|
| **Máy tính HC (UI)** | [`lib/chem-info/calculators/units/`](lib/chem-info/calculators/units/) · [`UnitConverter.tsx`](components/chem-info/UnitConverter.tsx) | **v2 buổi 12** — 17 loại · ~60 units · category-first |
| **Tồn kho (stock)** | [`lib/inventory-units.ts`](lib/inventory-units.ts) | kg/g/mg · L/mL/µL — **tách biệt**, không gộp với calculator |

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
| Prisma stale client (Turbopack) | 🟢 | Fix `lib/db.ts` Proxy + delegate guard — **restart dev** sau `prisma generate` · lỗi điển hình analysis: `db.analysisWorklist.findMany` undefined |
| **Mapping nền mới — list chỉ tiêu rỗng** | 🟢 | Fix buổi 24: `fetchMatrixMappingEditorAction` thay `listTestMethodsForMatrix` khi edit mapping |
| DetailDrawer che ModalShell | 🟢 | `z-[70]` / `z-[80]` / `z-[90]` |

---

## 8. Pending Tasks

### Ưu tiên 0 — Module Trả kết quả + COA SGS (buổi 19–21 · uncommitted) 🟡

> **Plan SGS:** `.cursor/plans/sgs-style_coa_redesign_c2a486cf.plan.md` · **Plan 2 chữ ký:** `.cursor/plans/coa_2_chữ_ký_e46f6d84.plan.md` · **Sidebar:** `.cursor/plans/sidebar_scroll_fix_250e074f.plan.md`  
> **Migrations:** `20260713_results_delivery` · `20260714_test_report_document` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Prisma `TestReport`, `ReportHistory`, `SampleStatus.ResultIssued` · `documentSnapshotJson`
- [x] Workflow draft → LM approve → QA approve → issue/reissue · gate `ResultIssued` trước lưu/hủy mẫu
- [x] RBAC 4 keys `delivery_*` · sidebar **Trả kết quả** (4 màn) sau Phân tích
- [x] COA **form SGS** đa trang A4 · song ngữ EN/VI · `components/results-delivery/coa/*`
- [x] Snapshot `cover` + fix địa chỉ khách · `resolveCoverSnapshot()` fallback
- [x] **2 chữ ký COA:** LM (Phụ trách kỹ thuật) trái · tên công ty SCI-TECH phải
- [x] Sidebar desktop scroll · `lib/result-delivery-nav.ts`
- [x] Seed `RPT-SEED-0001` · `verify-results-delivery-seed.ts` · `npx tsc --noEmit` pass

**Phiên tiếp (bắt buộc) — cập nhật buổi 22 → xem §0 trước:**

- [ ] **§0 buổi 23** — fix worksheet timeout · build · QA E2E · commit buổi 17–22 · Turso `20260715` + migrations cũ
- [ ] **QA browser COA SGS** — 3+ trang · 2 chữ ký · in PDF A4
- [ ] **QA sidebar** — cuộn wheel 8 nhóm menu
- [ ] **QA E2E** — pending → issue → storage
- [ ] **`npm run build`** — kill dev port 3000 trước
- [ ] **Commit + push** buổi 17–21 — **không** commit `prisma/dev.db`, `.next/`, `public/uploads/coa/` lẻ
- [ ] **Turso prod** — apply migrations + seed:
  ```powershell
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260629_analysis_assignment/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260701_analysis_module/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260712_sample_reception/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260713_results_delivery/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260714_test_report_document/migration.sql
  $env:NODE_ENV="production"; npm run db:seed   # hoặc seed permissions delivery_* riêng
  ```
- [ ] **Redeploy Vercel**

**Defer / follow-up:**

- [ ] Email COA · PDF server-side (Puppeteer/Blob)
- [ ] Cột email/phone `SampleRequest` · Admin UI branding `SCI_TECH_*`
- [ ] Phụ lục ảnh mẫu (chờ upload ảnh trên Sample)
- [ ] Logo ilac/VILAS (user chọn không dùng hiện tại)

### Ưu tiên 0 — Admin catalog LIMS (buổi 23–24 · uncommitted) 🟡

> **Plan:** `.cursor/plans/unified_matrix_catalog_929968bd.plan.md` · `.cursor/plans/excel_chỉ_tiêu_import_export_f1b57926.plan.md` · `.cursor/plans/bulk_chỉ_tiêu_catalog_ff09f53e.plan.md`  
> **Migration:** `20260716_sample_matrix_groups` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] `SampleMatrixGroup` + CRUD admin nhóm/nền mẫu · import Excel nền
- [x] CRUD chỉ tiêu · LOD · ĐVT combobox · import/export Excel
- [x] `app/admin/layout.tsx` — sidebar cố định mọi `/admin/*`
- [x] Bulk chỉ tiêu: Sửa hàng loạt (Nhóm · PPT · ĐVT · LOD) · Ẩn · Xóa (`usageCount` skip)
- [x] UX danh mục: dropdown lọc nhóm · viewport 560px · checkbox + bulk bar
- [x] Fix mapping: `fetchMatrixMappingEditorAction` · `MappingSelectedPanel`
- [x] `npx tsc --noEmit` pass

**Phiên tiếp (bắt buộc) — xem §0:**

- [ ] **QA browser** — checklist §0 (form phiếu YC · admin catalog · bulk · mapping nền mới)
- [ ] **Dọn nhóm trùng** legacy WATER/AIR trên `/admin/catalog/matrix-groups`
- [ ] **`npm run build`** · **commit + push** buổi 17–25
- [ ] **Turso prod** — `20260716_sample_matrix_groups` + `seedLimsCatalog`

**Defer / follow-up (P1):**

- [ ] CRUD **nhóm chỉ tiêu** (`TestCategory`) trên trang chỉ tiêu
- [ ] Cột **LOQ** trên danh mục chỉ tiêu

### Ưu tiên 0 — Module Phương pháp phân tích — Nền mẫu (buổi 24–25 · uncommitted) ✅ local

> **Plan:** `.cursor/plans/pp_nền_mẫu_dropdown_405359d5.plan.md` · `.cursor/plans/pp_multi_nền_mẫu_9e8a3263.plan.md` · `.cursor/plans/pp_nền_mẫu_gọn_d6285124.plan.md`  
> **Migrations:** `20260717_analytical_method_matrix_fk` · `20260718_analytical_method_matrices` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Trường **Nền mẫu** thay text `matrix` tự do — dropdown catalog Quản trị
- [x] Junction **`AnalyticalMethodMatrix`** — chọn **nhiều** nền mẫu / PP
- [x] `MethodMatrixMultiSelect` — Tạo mới + tab Tổng quan
- [x] `MethodMatrixListCell` — list gom nhóm · tooltip
- [x] List/search hiển thị & lọc theo tên nền đã gán
- [x] Seed + `scripts/backfill-analytical-method-matrix.ts`
- [x] `npx tsc --noEmit` pass

**Phiên tiếp (bắt buộc) — xem §0:**

- [ ] **QA browser** — checklist §0 (multi nền · list gọn · lưu trống · search list)
- [ ] **Turso prod** — apply `20260717` + `20260718` · chạy backfill trên prod nếu cần
- [ ] Gộp commit cùng buổi 17–25

### Ưu tiên 0 — Module Phương pháp phân tích — Chất phân tích (buổi 25 · uncommitted) 🟡

> **Plan:** `.cursor/plans/pp_chất_phân_tích_95429c09.plan.md`  
> **Migration:** `20260719_analytical_method_test_methods` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Junction **`AnalyticalMethodTestMethod`** M:N PP ↔ chỉ tiêu
- [x] `MethodTestMethodMultiSelect` · `MethodAnalyteListCell`
- [x] `syncMethodTestMethods` — đồng bộ hai chiều với catalog
- [x] Seed `testMethodCodes[]` · `scripts/backfill-analytical-method-test-methods.ts`
- [x] `npx tsc --noEmit` pass

**Phiên tiếp (bắt buộc) — xem §0:**

- [ ] **QA browser** — multi-select · list gom nhóm · đồng bộ catalog ↔ PP
- [ ] **Turso prod** — apply `20260719` · chạy backfill trên prod nếu cần

### Ưu tiên 0 — Catalog chỉ tiêu — nhiều PP (buổi 25 · uncommitted) 🟡

> **Plan:** `.cursor/plans/chỉ_tiêu_nhiều_pp_572e7d74.plan.md`  
> **Migration:** `20260720_method_test_method_params` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Junction params: `unit` · `lod` · `loq` · `isPrimary` · `sortOrder`
- [x] `TestMethodMethodLinksEditor` · `TestMethodMethodsListCell`
- [x] `resolvePrimaryMethodForTestMethod` — phiếu YC dùng PP chính
- [x] Import Excel tạo primary link · `defaultMethodId` sync
- [x] `npx tsc --noEmit` pass

**Phiên tiếp (bắt buộc) — xem §0:**

- [ ] **QA browser** — 2 PP khác ĐVT/LOD · đổi PP chính · phiếu YC
- [ ] **Turso prod** — apply `20260720`

**Defer (P2):**

- [ ] Chọn PP trên phiếu YC khi có nhiều (hiện chỉ `isPrimary`)
- [ ] Export Excel nhiều cột PP

### Ưu tiên 0 — Module Phân tích (buổi 18 · uncommitted) 🟡

> **Plan:** `.cursor/plans/analysis_module_plan_64f689d8.plan.md`  
> **Migrations:** `20260629_analysis_assignment` · `20260701_analysis_module` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Prisma: `LabDepartment`, `DepartmentManager`, `AnalysisAssignment`, `DepartmentAnalyst`, `AnalysisTask`, `AnalysisWorklist`, `AnalysisWorksheet`, `TestResult`, `QcCheck` + enums
- [x] Rewrite `/samples/assign` → phân công phòng ban (`AnalysisAssignment`)
- [x] Sidebar nhóm **Phân tích** (7 submenu) · 7 permission keys · role defaults
- [x] Routes `/analysis/*` (inbox, assign-analyst, worklists, worksheets, results, qc, review)
- [x] Workflow `syncSampleStatusFromTasks` · code gen `WL-*`/`WS-*` (`lib/analysis-code.ts`)
- [x] Seed 14 analyst + demo assignments/tasks/worklists · verify + smoke scripts pass
- [x] Fix lỗi runtime Prisma stale — regenerate + restart dev

**Phiên tiếp (bắt buộc):**

- [ ] **QA browser E2E** — checklist §11 (happy path + RBAC Analyst/QAQC/Viewer)
- [ ] **`npm run build`** — kill dev server trước
- [ ] **Commit + push** (~80+ file analysis + assign + migrations) — **không** commit `prisma/dev.db`, `.next/`, `public/uploads/coa/` lẻ
- [ ] **Turso prod:**
  ```powershell
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260629_analysis_assignment/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260701_analysis_module/migration.sql
  # + 20260712 samples nếu chưa apply
  $env:NODE_ENV="production"; npm run db:seed   # hoặc seed permissions riêng khi có script
  ```
- [ ] **Redeploy Vercel** · QA prod sidebar **Phân tích**

**Defer / follow-up:**

- [ ] Route `/analysis/worklists/new` (hiện tạo inline trên list)
- [ ] Link `MethodExecution` ↔ worksheet checklist SOP
- [ ] Notification khi assignment mới / QC fail
- [ ] Báo cáo PDF kết quả
- [ ] Admin CRUD phòng ban/analyst (phase 1 dùng seed static)

### Ưu tiên 0 — Module Tiếp nhận mẫu (buổi 17 · uncommitted) 🟡

> **Plan:** `.cursor/plans/sample_reception_module_69e773b5.plan.md`  
> **Migration:** `20260712_sample_reception` · **Turso prod pending**

**Local (đã xong · chưa commit):**

- [x] Prisma 10 model + 4 enum · migration SQL · `db push` local
- [x] Sidebar nhóm **Tiếp nhận mẫu** (6 submenu) · 6 permission keys · role defaults
- [x] Routes: `/samples`, `/receive`, `/[id]`, `/requests/*`, `/assign`, `/tracking`, `/storage`, `/reports`
- [x] FSM trạng thái · sinh mã `SPL-/PR-` · validation Zod · audit (`AuditLog` + `SampleAuditLog`)
- [x] Liên kết: PP · TB · HC/Chuẩn · chem-info · chain of custody · in tem QR
- [x] **Seed demo** 10 PR + 10 SPL · `prisma/seed-data/samples/` · `verify-samples-seed.ts` pass
- [x] Prefix **`PR-`** · tracking Kanban fix · prefill receive (tên mẫu + bảo quản)
- [x] `npx tsc --noEmit` pass · `test-sample-code-gen.ts` · `verify-sample-workflow.ts` pass

**Phiên tiếp (bắt buộc):**

- [ ] **QA browser E2E** — checklist §9 (FSM · prefill · phân công · QR · RBAC Viewer)
- [ ] **`npm run build`** — kill dev server trước nếu EPERM `prisma generate`
- [ ] **Commit + push** (~55 file) — **không** commit `prisma/dev.db`, `.next/`, `public/uploads/coa/` lẻ, `prisma/prisma/`
- [ ] **Turso prod:**
  ```powershell
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260712_sample_reception/migration.sql
  $env:NODE_ENV="production"; npx tsx scripts/seed-samples-prod.ts
  ```
- [ ] **Redeploy Vercel** · QA prod sidebar hiện **Tiếp nhận mẫu**

**Defer / follow-up:**

- [ ] Khóa `methodVersionId` khi chuyển `InAnalysis`
- [ ] Link `MethodExecution` ↔ `Sample` / `SampleTest`
- [ ] Thêm mục sidebar **Báo cáo tiếp nhận** hoặc gộp vào `/reports`
- [ ] Export Excel danh sách mẫu (hiện chỉ CSV `/samples/reports`)
- [ ] Turso prod: seed demo mẫu trên prod (chỉ permissions qua `seed-samples-prod.ts` — **không** full demo PR/SPL trên prod trừ khi chạy migration + seed riêng)

### Ưu tiên 0 — Module Thông tin hóa học (buổi 10–14 · uncommitted) 🟡

> **Plan:** `.cursor/plans/chem_info_module_df54c053.plan.md` · tra cứu HC: `chemical_lookup_upgrade_798b2474.plan.md`  
> **Migration:** `20260707`–`20260709` · **Turso prod ✅ applied 2026-06-28** · seed 118 elements

**Local (đã xong · chưa commit trừ Dilution v2):**

- [x] Phase 0–6: sidebar · routes · Prisma · seed · UI · calculators · PubChem API
- [x] Buổi 11: local + online PubChem · sync DB · POST `/api/chemicals/search-online`
- [x] Buổi 12: Unit Converter v2 (17 loại) · Compatibility GROUP tab (8 rules · 31 total)
- [x] Buổi 13: **Dilution v2/v2.1** — commit **`108160b`** · pushed · redeploy prod
- [x] Buổi 14: MW parser v2 · mobile tra cứu fix · PubChem display name (`display-name.ts` · cache v3)
- [x] Test CLI pass: `molecular-weight.test.ts` · `display-name.test.ts` · `dilution.test.ts` · `conversion-engine.test.ts` · `compatibility-engine.test.ts`

**Phiên tiếp (bắt buộc):**

- [ ] **QA browser** — tab Khối lượng mol (`h2so4`, `H2SO4.H2O`, hydrate) · tab Pha loãng v2 (3 mode · mL/µL · ppb) · tra cứu mobile `acetamiprid` · PubChem không DTXSID · compatibility GROUP
- [ ] **Commit + push** buổi 7–11 + buổi 14 — cân nhắc tách PR chem-info · **không** commit `prisma/dev.db`, `.next/`, uploads ngoài `public/ghs/`
- [ ] **Redeploy Vercel** sau commit chem-info đầy đủ (prod hiện chỉ có Dilution v2 từ `108160b`)
- [ ] **`BLOB_READ_WRITE_TOKEN`** trên Vercel cho SDS PDF prod

**Turso prod (✅ done 2026-06-28):**

```powershell
# Đã apply 20260707–20260709 · seed chem-info
npx tsx scripts/seed-chem-info-only.ts   # re-seed nếu cần sau deploy
```

**Chưa chạy:** code standardization pipeline (`20260706_code_standardization`) — chỉ sau QA, thay đổi master codes.

**Defer / follow-up:**

- [ ] Link drawer `/chemicals` → "Xem thông tin hóa học" khi có CAS
- [ ] Gợi ý compatibility khi chọn vị trí lưu trữ / nhập kho
- [ ] UI copy compatibility (message khi không có rule)
- [ ] ChemSpider/NIST adapters · bulk PubChem refresh · RDKit 2D

### Ưu tiên 0 — List sorting & pagination (buổi 9 · uncommitted) 🟡

> **Plan:** `.cursor/plans/list_sorting_implementation_50213a9a.plan.md` (không sửa plan file)  
> **Kiến trúc:** RSC `searchParams` → service `listX(params)` → Prisma `orderBy` + `skip/take` · **không** sort client-side toàn bộ dataset

**Local (đã xong · chưa commit):**

- [x] Phase 0: `lib/list-query/*` · `SortableTableHeader` · `ListPaginationBar` · `useListQueryState` · pilot `/equipment/catalog`
- [x] Phase 1: Catalog gốc (HC/Chuẩn/Chủng) + pha chế (6 module) — `catalog-lot-list.ts` · `prepared-list.ts`
- [x] Phase 2: Sổ cái tồn · Nhật ký sử dụng · Lịch sử pha chế — pagination 50/trang
- [x] Phase 3: 8 submodule thiết bị (HC/BT/SC, BT, SC đánh giá, phụ tùng, thanh lý)
- [x] Phase 4: Nhật ký môi trường · Thông báo · Thống kê · Lịch sử nhập kho · index Prisma
- [x] `npx tsc --noEmit` pass · `npx tsx lib/list-query/parse.test.ts` pass

**Phiên tiếp (bắt buộc):**

- [ ] **QA browser sorting** — checklist § List sorting bên dưới (ít nhất catalog + ledger + usage-logs + prep-history)
- [ ] **QA combo** — `q` + filter + `sortBy` + `page=2` trên `/inventory-ledger`, `/usage-logs`, `/preparation-history`
- [ ] **QA export** — Excel/CSV giữ đúng thứ tự sort hiện tại (ledger, catalog, prep-history export)
- [ ] **Commit + push** — gộp với buổi 7/8 hoặc tách commit riêng · **không** commit `.next/`, `prisma/dev.db`, `public/uploads/`
- [ ] **Turso prod** — **✅ `20260706`–`20260709` done** (2026-06-28)
- [ ] **Redeploy Vercel** sau push chem-info đầy đủ

**Chưa làm / defer:**

- [ ] Pagination catalog gốc + pha chế (hiện sort-only, load-all) — khi data > ~2000 lot rows
- [ ] Sort cột `itemCode` trên Nhật ký — cần denormalize snapshot hoặc join (defer)
- [ ] Admin `/admin/people`, `/admin/tasks` — chưa migrate sort
- [ ] `loading.tsx` shell khi đổi sort (RSC full reload) — tùy chọn UX

### Ưu tiên 0 — Buổi 7 uncommitted (commit + Turso) 🟡

> **Plans:** chuẩn hóa mã chuẩn pha · creatable group Nhập kho · (kèm) fix filter nhóm catalog

**Local (đã xong · chưa commit):**

- [x] Prefix-by-level: `code-prefixes`, `code-generator`, `prepared-standards`, UI, import validation
- [x] Migration scripts + chạy local PASS (`verify-code-migration`, `test-code-generator`)
- [x] Seed demo codes (`IST1-*`, `WSTD-*`, `WSTD-0006`)
- [x] Stock-in creatable group (3 form + page load groups)
- [x] Filter nhóm catalog động (`build*GroupFilterOptions`) — từ phiên trước, cùng working tree

**Phiên tiếp (bắt buộc):**

- [ ] **`npx tsc --noEmit`** · QA browser `/stock-in` (3 loại nhóm) · QA tạo chuẩn IST2/WSTD prefix mới
- [ ] **Commit + push** (~25 file) — **không** commit `public/uploads/`, `prisma/prisma/dev.db`, `.next/`
- [ ] **Turso prod** — thứ tự:
  1. Migrate `20260701`–`20260705` (nếu chưa)
  2. `scripts/apply-prepared-standard-prefix-migration.ps1` (strain PST → standard IST/WSTD → snapshot → sequence)
  3. Opening balance / inventory backfills nếu chưa chạy prod
- [ ] **Redeploy Vercel** · cập nhật QA doc trace: `WSTD-0006` (không còn `PSTD-0006`)

### Ưu tiên 0 — ISO 17025 mở rộng buổi 6 (commit `18fe925` · prod pending) 🟡

> **Plan:** `.cursor/plans/iso_17025_module_expansion_154c3fb1.plan.md`  
> **Migrations:** `20260703_stock_lot_purity` · `20260704_environmental_log` · `20260705_preparation_equipment`

**Local (đã xong):**

- [x] Phase 0: Excel 15 cột · Mã nhóm export · Pha lại HC/Chủng · tab Tồn kho HC/Chủng
- [x] Phase 1: StockLot purity/uncertainty
- [x] Phase 2: EnvironmentalLog + `/environment-logs` + permission
- [x] Phase 3: PreparationIsoFormFields + equipment FK + upload
- [x] Phase 4: print · parentCode filter · ledger link · prep alerts
- [x] `tsc`, `test-prepared-batch-code.ts`, **`npm run build`**
- [x] **Commit + push** — **`18fe925`** (44 file)
- [x] **Browser QA CG01** — CG01-003 Approved · CG01-004 · CG02-001 · `/preparation-history` filter CG01

**Phiên tiếp:**

- [ ] **Commit + push** fix filter nhóm catalog (6 file) — **không** commit `public/uploads/`, `prisma/prisma/`
- [ ] **Turso prod migrate** `20260703` → `20260704` → `20260705` (sau `20260701`–`20260702`)
- [ ] **`npm run db:seed`** — permission `environment_logs` cho admin
- [ ] **Redeploy Vercel** sau push
- [ ] **QA `/environment-logs`** + gắn env log trên form pha chế

### Ưu tiên 0 — Fix filter nhóm catalog (local · chưa commit) 🟡

> **Bối cảnh:** User tạo nhóm **BVTV** trên `/standards` — hiện trong bảng nhưng không có trong dropdown lọc.

- [x] Fix code: `buildStandardGroupFilterOptions` / `buildChemicalGroupFilterOptions` / `buildStrainGroupFilterOptions`
- [ ] Commit + push 6 file
- [ ] QA browser: `/standards` dropdown có BVTV · filter chỉ hiện dòng BVTV

### Ưu tiên 0 — Inventory Transaction Engine (commit `2d22c52` · prod pending) 🟡

> Migration: `20260701_inventory_tx_engine` · Engine ledger-first · **Reject không hoàn kho**

**Local (đã xong):**

- [x] Schema + migration SQL
- [x] Engine services + inventory actions + tab Tồn kho (Standards/Chemicals/Prepared Standards)
- [x] Reject workflow + no restore on Cancel/Reject after deduct
- [x] Opening balance backfill + seed hook + Available fix
- [x] `tsc`, `test-inventory-transaction-engine`, `test-prep-reject-no-restore`, `reconcile-inventory-balances`

**Commit & push (phiên tiếp):**

- [x] Commit **`2d22c52`** — Inventory TX Engine + opening balance fix + parentCode
- [x] Push branch `cursor/mobile-scroll-vercel-session`
- [ ] Redeploy Vercel prod

**Turso prod (bắt buộc trước QA prod):**

```powershell
$env:NODE_ENV="production"
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260701_inventory_tx_engine/migration.sql
npx tsx scripts/backfill-inventory-transaction-types.ts
npx tsx scripts/backfill-opening-balance-create.ts
npx tsx scripts/reconcile-inventory-balances.ts
```

**QA browser (local + prod sau migrate):**

- [ ] `/standards` → STD-0001 → tab **Tồn kho**: Khả dụng ≈ cache · cột Tồn ledger · adjust giảm 0.01 g OK · **đã fix gửi `stockLotId` — cần QA lại**
- [ ] Prepared standard → **Reject** (Prepared/Checked) — nguyên liệu không restore · `inventoryStatus=Rejected`
- [ ] `/containers` (Thống kê) — cột Khả dụng khớp ledger
- [ ] `/inventory-ledger` — filter theo `transactionType` · thấy `MigrationOpeningBalance` CREATE
- [ ] Workflow Approved → CREATE output PreparedStandard trên sổ cái

**Còn lại từ plan gốc (ưu tiên thấp hơn):**

- [ ] Tab Tồn kho trên `/prepared-chemicals` — **done buổi 6** (`18fe925`)
- [ ] Permissions riêng `inventory_adjust` / `inventory_reverse` (hiện dùng `requireSessionCanEdit/Manage`)
- [ ] Scripts test: `test-discard-residue.ts`, `test-reversal-adjustment.ts`
- [ ] Trace tree: badge Rejected/Expired + node CONSUME tx
- [ ] Deprecate `Container.quantity` (phase 4 cleanup)
- [ ] Xác nhận mục 10 plan: Cancel sau Approved có restore không · thời điểm CREATE output · discard 2 bước

### Ưu tiên 0 — parentCode + batch lô pha chế (commit `2d22c52` · prod pending) 🟡

> **Plan:** `.cursor/plans/prepared_batch_parentcode_b3e62ee3.plan.md`  
> **Migration:** `20260702_prepared_parent_batch`

**Local (đã xong):**

- [x] Schema + migration SQL (add columns → backfill → unique index)
- [x] `lib/prepared-batch-code.ts` + `lib/prepared-batch-rows.ts`
- [x] Server actions create/update/import + preview batch code
- [x] UI Mã nhóm + preview Mã lô (HC, Chuẩn, Chủng via ModuleCrudClient)
- [x] Bảng grouped theo parentCode (HC + Chuẩn)
- [x] Nút **Pha lại** trên PreparedStandard Rejected
- [x] Báo cáo lịch sử 15 cột + traceability labels
- [x] Backfill local + `test-prepared-batch-code.ts` + `tsc` pass

**Commit & push (phiên tiếp):**

- [x] Commit **`2d22c52`** — parentCode/batch + fix `stockLotId` + tab Tồn kho Prepared*
- [x] Push branch
- [ ] Redeploy Vercel prod

**Turso prod (bắt buộc trước QA prod):**

```powershell
$env:NODE_ENV="production"
# Nếu migration.sql trực tiếp fail (unique trên parentCode rỗng), chạy tuần tự:
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260702_prepared_parent_batch/add_columns.sql
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260702_prepared_parent_batch/add_columns_remaining.sql
npx tsx scripts/backfill-prepared-parent-codes.ts
npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260702_prepared_parent_batch/backfill_and_index.sql
```

**QA browser (local + prod sau migrate):**

- [x] **CG01 flow:** CG01-003 Approved · CG01-004 · CG02-001 trung gian · trace 2 tầng · `/preparation-history` filter CG01 (8/38)
- [ ] **Pha lại:** từ CG01-001 Rejected → prefill parentCode + thành phần → lô mới Draft
- [ ] **Tab Tồn kho:** `/standards` STD-0001 · Lot CAF-2301 → adjust giảm OK (sau fix `stockLotId`)
- [ ] **Chủng:** `/prepared-strains` — tạo mới với Mã nhóm · preview batch
- [x] **Báo cáo:** `/preparation-history` — cột Mã nhóm + Mã lô · filter parentCode · export 15 cột (nút có sẵn)

**Còn lại từ plan (ưu tiên thấp hơn):**

- [ ] `lib/prepared-excel.ts` — thêm cột **Mã nhóm** import/export (chưa verify)
- [ ] Nút **Pha lại** trên `PreparedChemicalsClient` + `PreparedStrainsClient` (hiện chỉ chuẩn)
- [ ] Cập nhật docs/plan còn ghi "14 cột" → 15 cột

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

- [x] **Push branch** `cursor/mobile-scroll-vercel-session` (HEAD `16d1efb`)
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
- [x] **`/prepared-standards`** — workflow Draft→Approved (`PCHEM-QA-001`) · soft delete + tái mã TG2 ✅ (local 2026-06-27)
- [ ] **`/preparation-history`** — export Excel 14 cột trên prod (local ✅)
- [ ] **`/prepared-standards`** — tab Truy xuất PSTD-0006 · reverse STD-0007

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
Đọc HANDOFF.md (§ **11. Module Phân tích** + §8 Pending buổi 18).
QA browser E2E: /samples/assign → /analysis/inbox → assign-analyst → worklist → worksheet → results → QC → review → Sample Completed.
Commit buổi 17 (samples) + buổi 18 (analysis + assign rewrite) → Turso 20260629/20260701/20260712 → build → redeploy.
Trước prisma generate: kill process port 3000. Nếu db:seed fail PreparedChemical → seed-analysis-only.ts.
Chỉ đọc file liên quan — không scan toàn repo.
```

**Turso migration chem-info (prod — sau 20260701–20260706):**

```powershell
npx prisma db execute --file prisma/migrations/20260707_chem_info_module/migration.sql --schema prisma/schema.prisma
npx tsx prisma/seed-data/chem-info/run-seed.ts
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
| **Tiếp nhận mẫu** | `samples-nav-open` | 6 — Phiếu YC · Danh sách · Tiếp nhận · Phân công phòng · Tracking · Lưu/Hủy |
| **Phân tích** | `analysis-nav-open` | 7 — Inbox · Analyst · Worklist · Worksheet · Kết quả · QC · Duyệt |
| **Thông tin hóa học** | `chem-info-nav-open` | 4 — Bảng tuần hoàn · Tra cứu HC · Máy tính · Tương thích |
| **Hoá chất - Chuẩn - Chủng** | `materials-nav-open` | 14 — xem §1 |
| **Thiết bị** | `equipment-nav-open` | 9 — xem § Module Thiết bị |
| **Quản trị** | `admin-nav-open` | 7 — **Nhân sự** · Phân quyền · Giao việc · **Nhóm nền mẫu** · **Nền mẫu** · **Danh mục chỉ tiêu** · **Mapping nền–chỉ tiêu** |

**File:** [`components/Sidebar.tsx`](components/Sidebar.tsx) — nav từ [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts).  
**Layout admin:** [`app/admin/layout.tsx`](app/admin/layout.tsx) — `AppShell` cho mọi route `/admin/*` và `/admin/catalog/*`.

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

- **Phiên kết thúc (2026-06-28 — buổi 14):**
  - **MW parser v2:** `molecular-formula-parser.ts` — case-insensitive · hydrate/adduct · clathrate · fix Co/CO₃
  - **Tra cứu mobile:** fix race `useDebouncedListQuery` — không sync URL→input khi focus · debounce 450ms
  - **PubChem tên:** `display-name.ts` · cache v3 · lọc DTXSID
  - **Test pass:** `molecular-weight.test.ts` · `display-name.test.ts`
  - **HEAD:** **`108160b`** · **buổi 14 chưa commit**
- **Phiên kết thúc (2026-06-28 — buổi 13):**
  - **Dilution v2/v2.1:** 3 mode · ppb/µg/L/ng/L · mL/µL display · commit **`108160b`** · pushed · redeploy prod
- **Phiên kết thúc (2026-06-28 — buổi 10):**
  - **Chem-info module:** Phase 0–6 · sidebar nhóm mới (trên Materials) · `app/chem-info/**` · 8 Prisma models reference
  - **Routes:** `/chem-info/periodic-table` · `/chem-info/chemicals` · `/chem-info/calculators` · `/chem-info/compatibility` · detail `/chem-info/chemicals/[id]`
  - **Permissions:** `chem_info_periodic`, `chem_info_lookup`, `chem_info_calculators`, `chem_info_compatibility` — read all roles
  - **Seed:** `prisma/seed-data/chem-info/` — 118 elements · **33** refs · **31** compatibility rules (8 GROUP) · GHS SVG `public/ghs/`
  - **API:** PubChem search-online · chemical-references sync/refresh
  - **Engine:** `compatibility-engine.ts` (v2)
  - **Fix:** `/prepared-standards` — `mapPreparedStandardRow()` shared mapper
  - **Migration:** `20260707_chem_info_module`
  - **HEAD:** vẫn **`18fe925`** · **buổi 7 + 8 + 9 + 10 chưa commit**
- **Phiên kết thúc (2026-06-28 — buổi 9):**
  - **List sorting:** Phase 0–4 · sort server-side Prisma · URL `sortBy`/`sortOrder`/`q`/`page` · ~25+ bảng migrate
  - **Infrastructure:** `lib/list-query` · `SortableTableHeader` · `ListPaginationBar` · `useListQueryState`
  - **Services mới/sửa:** `catalog-lot-list.ts`, `prepared-list.ts`, `equipment-list.ts`, `inventory-ledger.ts`, `usage-logs.ts`, `preparation-history-report.ts`, + equipment submodules, env/stats/stock-in/notifications
  - **Migration:** `20260706_prepared_standard_prepared_date_index`
  - **HEAD:** vẫn **`18fe925`** · **buổi 7 + 8 + 9 chưa commit**
- **Phiên kết thúc (2026-06-27 — buổi 7):**
  - **Chuẩn hóa mã chuẩn pha:** prefix PSTD/IST1–3/WSTD · strain trung gian PST1–3 · migration local PASS · **uncommitted**
  - **Nhập kho creatable group:** input+datalist Nhóm HC/Chuẩn/Chủng · **uncommitted**
  - **Kèm working tree:** fix filter nhóm catalog (6 file từ buổi trước)
  - **HEAD:** `18fe925` · chưa commit buổi 7
- **Phiên kết thúc (2026-06-27 — buổi 6 + QA):**
  - **ISO buổi 6:** commit **`18fe925`** — env logs · ISO form · StockLot purity · equipment FK · 44 file · **đã push**
  - **QA CG01 (browser local):** CG01-003 Approved · CG01-004 · CG02-001 · trace 2 tầng · `/preparation-history` filter 8/38
  - **Fix catalog (uncommitted):** dropdown lọc nhóm động từ DB — BVTV và nhóm tùy ý khác
  - **HEAD:** `18fe925` · branch `cursor/mobile-scroll-vercel-session`
- **Phiên kết thúc (2026-06-27 — buổi 3):**
  - **ISO Phase 4:** `16d1efb` — `/preparation-history` · báo cáo 14 cột · export Excel · nav `preparation_history`
  - **QA browser (local):** FSM `PCHEM-QA-001` · soft delete + tái mã TG2 · export 26 dòng · search filter OK
  - **Push:** `cursor/mobile-scroll-vercel-session` → GitHub · HEAD **`16d1efb`**
  - **Kiểm tra:** `npx tsc --noEmit` pass (trước commit)
- **Phiên kết thúc (2026-06-27 — buổi 2):**
  - **ISO Phase 3:** `aa305a5` — traceability tree · tab Truy xuất · reverse lookup · `/preparation/[type]/[id]`
  - **Prod ops:** Push · Turso migrate (`apply-migration-turso.ts`) · backfill history · Vercel redeploy
  - **Fix TG2:** `4bbcb0b` — `prepared-code-guard.ts` · archive mã soft-deleted · auto-release ghost
  - **Helper:** `a05132c` — `apply-migration-turso.ts` (Prisma CLI + `file:` local ≠ Turso prod)
- **Dev local:** http://localhost:3000 · `DATABASE_URL=file:./dev.db` · QA data: CG01-003/004, CG02-001 (Draft)
- **Git:** branch `cursor/mobile-scroll-vercel-session` · HEAD **`108160b`** (Dilution v2 pushed) · **buổi 7–11 + buổi 14 chưa commit**
- **Prod:** https://huutai-lims-m929.vercel.app · redeploy **`dpl_6riTusAGFeuxuRZ7qZAxCvweuDVG`** · Turso **`20260701`–`20260709`** migrated

### Ưu tiên phiên sau

**Track A — Commit buổi 7–11 + buổi 14 + prod**
1. `npx tsc --noEmit` · `npx tsx lib/chem-info/calculators/molecular-weight.test.ts` · `npx tsx lib/services/chem-info/display-name.test.ts` · `npx tsx lib/chem-info/calculators/dilution/dilution.test.ts` · các test chem-info khác
2. QA chem-info (MW hydrate · mobile tra cứu · Pha loãng v2 · compatibility) + QA sorting buổi 9
3. Commit — cân nhắc tách PR chem-info riêng nếu diff quá lớn
4. Turso: **✅ migrate done** · **chưa** code standardization pipeline
5. Push + redeploy Vercel prod

**Track B — Chem-info defer**
1. Link catalog drawer → chem-info by CAS
2. Compatibility hints on stock-in / storage location
3. Expand reference database · external API providers

**Track C — Sorting defer / follow-up**
1. Pagination catalog + pha chế khi dataset lớn
2. Sort cột `itemCode` Nhật ký (denormalize)
3. Admin people/tasks sort
4. `loading.tsx` khi đổi sort (optional UX)

**Track D — QA còn lại (local/prod)**
1. `/standards` STD-0001 tab Tồn kho adjust · Import Excel 6 trang · sticky header · in tem nhãn TB
2. Notification bell sau Turso migrate notifications

### Recommended Next Prompt

```
Đọc HANDOFF.md (§ **Thông tin hóa học — handoff ngắn** + §5b–5c + §8 Pending).
QA: tab Khối lượng mol (H2SO4.H2O, h2so4) · tra cứu mobile acetamiprid · PubChem không DTXSID · Pha loãng v2 · compatibility GROUP.
Commit buổi 7–11 + buổi 14 → push → redeploy.
Turso migrate done · chưa chạy code standardization pipeline.
Chỉ đọc file liên quan — không scan toàn repo.
```

### File tham chiếu (ISO pha chế — Phase 1–4 done · QA partial pass 2026-06-27)

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
| Seed chain demo | `prisma/seed-data/links.ts` (PSTD-0005→**WSTD-0006**) |

### File tham chiếu (Pha chế — nhãn nồng độ + hàng lý thuyết/thực tế — buổi 8 · uncommitted)

| Mục đích | File |
|----------|------|
| **Plan reorder** | `.cursor/plans/prepared_form_field_reorder_d108651d.plan.md` |
| **Plan hàng nồng độ** | `.cursor/plans/concentration_row_layout_b432a338.plan.md` |
| **Component mới** | `components/preparation/ConcentrationPairFields.tsx` |
| ISO block (không còn nồng độ thực tế) | `components/preparation/PreparationIsoFormFields.tsx` |
| UI Chuẩn / HC | `components/prepared-standards/PreparedStandardsClient.tsx`, `components/prepared-chemicals/PreparedChemicalsClient.tsx` |
| UI Chủng CRUD | `components/modules/ModuleCrudClient.tsx`, `lib/modules/configs.ts` |
| Export / báo cáo | `lib/prepared-standards-fields.ts`, `lib/prepared-chemicals-fields.ts`, `lib/prepared-excel.ts`, `lib/services/preparation-history-report.ts`, `components/preparation/PreparationHistoryReportClient.tsx` |
| Strain data | `lib/services/modules.ts`, `lib/actions/modules.ts` |

### File tham chiếu (Nhập kho mã vật tư — buổi 8 · uncommitted)

| Mục đích | File |
|----------|------|
| Code resolve | `lib/stock-in-code.ts` |
| Forms | `components/stock-in/ChemicalStockInForm.tsx`, `StandardStockInForm.tsx`, `StrainStockInForm.tsx` |
| Client + actions | `components/stock-in/StockInClient.tsx`, `lib/actions/stock-in.ts`, `lib/stock-in-master.ts` |

### File tham chiếu (Chuẩn hóa mã chuẩn pha — buổi 7 · uncommitted)

| Mục đích | File |
|----------|------|
| **Plan** | `.cursor/plans/chuẩn_hóa_mã_chuẩn_pha_e2056806.plan.md` |
| Prefix / validation | `lib/code-prefixes.ts`, `lib/prepared-batch-code.ts` |
| Sequence | `lib/services/code-generator.ts` |
| API | `lib/actions/prepared-standards.ts`, `lib/actions/prepared-import.ts` |
| UI | `components/prepared-standards/PreparedStandardsClient.tsx` |
| Migrate strain | `scripts/migrate-strain-prefix-pst.ts` |
| Migrate standard | `scripts/migrate-prepared-standard-level-prefix.ts` |
| Snapshot backfill | `scripts/backfill-code-snapshots-after-prefix-migration.ts` |
| Turso pipeline | `scripts/apply-prepared-standard-prefix-migration.ps1` |
| Verify | `scripts/verify-code-migration.ts`, `scripts/test-code-generator.ts` |

### File tham chiếu (Nhập kho creatable group — buổi 7 · uncommitted)

| Mục đích | File |
|----------|------|
| **Plan** | `.cursor/plans/creatable_group_stock-in_e1eadf04.plan.md` |
| Page | `app/stock-in/page.tsx` |
| Client | `components/stock-in/StockInClient.tsx` |
| Forms | `components/stock-in/ChemicalStockInForm.tsx`, `StandardStockInForm.tsx`, `StrainStockInForm.tsx` |
| Group services | `lib/services/chemicals.ts` (`getChemicalGroups`), `standards.ts`, `microbial-strains.ts` |

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

### File tham chiếu (Inventory Transaction Engine — buổi 4 · commit `2d22c52`)

| Mục đích | File |
|----------|------|
| **Engine lõi** | `lib/services/inventory-transaction-engine.ts` |
| **Loại tx + opening module** | `lib/services/inventory-transaction-types.ts` |
| **Aggregate available** | `lib/services/inventory-transaction-summary.ts` |
| **Lifecycle status** | `lib/services/inventory-lifecycle.ts` |
| **Opening balance** | `lib/services/inventory-opening-balance.ts` |
| **Enrich available UI** | `lib/services/inventory-available-enrichment.ts` |
| **Server actions UI** | `lib/actions/inventory-transactions.ts` |
| **Prep stock + CREATE output** | `lib/services/preparation-transition-stock.ts` |
| **Workflow Reject** | `lib/actions/preparation-workflow.ts`, `lib/services/preparation-workflow.ts` |
| **Wrapper dual-write** | `lib/inventory-stock.ts`, `lib/stock-lot.ts` |
| **Tab Tồn kho UI** | `components/inventory/InventoryItemPanel.tsx` |
| **Drawer integration** | `StandardsClient`, `ChemicalsClient`, `PreparedStandardsClient` |
| **Ledger UI** | `components/inventory-ledger/InventoryLedgerClient.tsx`, `lib/services/inventory-ledger.ts` |
| **Statistics available** | `lib/services/statistics.ts`, `components/statistics/StatisticsClient.tsx` |
| **Lot picker label** | `lib/stock-lot-selection.ts`, `lib/services/usage-log-options.ts` |
| **Migration** | `prisma/migrations/20260701_inventory_tx_engine/migration.sql` |
| **Backfill types** | `scripts/backfill-inventory-transaction-types.ts` |
| **Backfill opening CREATE** | `scripts/backfill-opening-balance-create.ts` |
| **Reconcile cache vs ledger** | `scripts/reconcile-inventory-balances.ts` |
| **Tests** | `scripts/test-inventory-transaction-engine.ts`, `scripts/test-prep-reject-no-restore.ts` |
| **Turso apply** | `scripts/apply-migration-turso.ts` |

**Công thức Available (ledger-first):**

```
Available = CREATE + ADJUSTMENT_IN + REVERSAL − CONSUME − DISCARD − ADJUSTMENT_OUT
```

**GLP:** Reject / Cancel sau Draft→Prepared → **không restore** nguyên liệu đã CONSUME.

### File tham chiếu (parentCode + batch · buổi 5 · commit `2d22c52`)

| Mục đích | File |
|----------|------|
| **Batch code lib** | `lib/prepared-batch-code.ts` |
| **Grouped table rows** | `lib/prepared-batch-rows.ts` |
| **Schema** | `prisma/schema.prisma` — `parentCode`, `batchNumber` trên Prepared* |
| **Migration** | `prisma/migrations/20260702_prepared_parent_batch/` |
| **Backfill** | `scripts/backfill-prepared-parent-codes.ts` |
| **Test** | `scripts/test-prepared-batch-code.ts` |
| **Standards actions** | `lib/actions/prepared-standards.ts` |
| **Chemicals actions** | `lib/actions/prepared-chemicals.ts` |
| **Strain actions** | `lib/actions/modules.ts` |
| **Import infer batch** | `lib/actions/prepared-import.ts` |
| **UI chuẩn** | `components/prepared-standards/PreparedStandardsClient.tsx` |
| **UI hoá chất** | `components/prepared-chemicals/PreparedChemicalsClient.tsx` |
| **UI chủng** | `components/modules/ModuleCrudClient.tsx` |
| **Báo cáo ISO** | `lib/services/preparation-history-report.ts`, `components/preparation/PreparationHistoryReportClient.tsx` |
| **Traceability** | `lib/services/preparation-traceability.ts` |
| **Fix tab Tồn kho** | `components/inventory/InventoryItemPanel.tsx`, `components/standards/StandardsClient.tsx`, `components/chemicals/ChemicalsClient.tsx` |

**Quy tắc mã lô:**

```
Mã lô (code) = {parentCode}-{batchNumber padded 3 digits}   e.g. CG01-003
Legacy PSTD-/PCHEM-/PMS- → parentCode = code, batchNumber = 1
Lô mới = MAX(batchNumber WHERE parentCode) + 1 (kể cả lô Rejected)
```

### File tham chiếu (ISO 17025 mở rộng · buổi 6 · commit `18fe925`)

| Mục đích | File |
|----------|------|
| **ISO form block** | `components/preparation/PreparationIsoFormFields.tsx` |
| **Upload đính kèm** | `lib/preparation-upload.ts` |
| **Env logs service** | `lib/services/environmental-logs.ts` |
| **Env logs UI** | `app/environment-logs/page.tsx`, `components/environment/` |
| **Prep alerts** | `lib/services/alerts.ts` |
| **Report parentCode filter** | `lib/services/preparation-history-report.ts` |
| **Ledger link** | `components/inventory/InventoryItemPanel.tsx` |
| **StockLot purity** | `prisma/migrations/20260703_stock_lot_purity/` |
| **EnvironmentalLog** | `prisma/migrations/20260704_environmental_log/` |
| **Equipment FK** | `prisma/migrations/20260705_preparation_equipment/` |
| **Plans** | `.cursor/plans/iso_17025_module_expansion_154c3fb1.plan.md` · `.cursor/plans/qa_chuẩn_pha_chế_21eec604.plan.md` |

### File tham chiếu (Filter nhóm catalog · uncommitted)

| Mục đích | File |
|----------|------|
| **Build filter options** | `lib/standards-fields.ts`, `lib/chemicals-fields.ts`, `lib/strains-fields.ts` |
| **UI standards** | `components/standards/StandardsClient.tsx` |
| **UI chemicals / strains** | `components/chemicals/ChemicalsClient.tsx`, `components/microbial-strains/MicrobialStrainsClient.tsx` |
| **Server groups** | `lib/services/standards.ts` → `getStandardGroups()` (đã có sẵn) |

### List sorting & pagination (buổi 9 · list-query)

**Mục tiêu:** Click header cột → sort **server-side** (Prisma `ORDER BY`) · state lưu URL · kết hợp search/filter/pagination.

**Infrastructure dùng chung:**

| Thành phần | File |
|------------|------|
| Types + parse URL | [`lib/list-query/types.ts`](lib/list-query/types.ts), [`parse.ts`](lib/list-query/parse.ts), [`order-by.ts`](lib/list-query/order-by.ts), [`url.ts`](lib/list-query/url.ts) |
| Hook URL state | [`lib/hooks/useListQueryState.ts`](lib/hooks/useListQueryState.ts) |
| UI sort header | [`components/SortableTableHeader.tsx`](components/SortableTableHeader.tsx) |
| UI pagination | [`components/ListPaginationBar.tsx`](components/ListPaginationBar.tsx) |
| Bảng | [`components/DataTable.tsx`](components/DataTable.tsx) — `sortable`, `sortKey`, prop `sort` |
| Unit test | [`lib/list-query/parse.test.ts`](lib/list-query/parse.test.ts) |

**Query params chuẩn (URL):** `sortBy` · `sortOrder` (`asc`/`desc`) · `q` · `page` · `limit` (+ filter riêng module: `group`, `status`, `workflow`, …)

**Sort cycle (3-state):** chưa sort ↕ → asc ↑ → desc ↓ → về default (xóa `sortBy`/`sortOrder` khỏi URL).

#### Module đã migrate

| Nhóm | Route | Service | Pagination |
|------|-------|---------|------------|
| **Catalog gốc** | `/chemicals`, `/standards`, `/microbial-strains` | [`catalog-lot-list.ts`](lib/services/catalog-lot-list.ts) → `listCatalogLotRows` | Sort-only |
| **Pha chế** | `/prepared-chemicals`, `/prepared-standards`, `/prepared-strains` | [`prepared-list.ts`](lib/services/prepared-list.ts) | Sort-only |
| **Vận hành** | `/inventory-ledger` | [`inventory-ledger.ts`](lib/services/inventory-ledger.ts) → `listInventoryLedger` | ✅ 50/trang |
| | `/usage-logs` (tab Nhật ký) | [`usage-logs.ts`](lib/services/usage-logs.ts) → `listUsageLogs` | ✅ |
| | `/preparation-history` | [`preparation-history-report.ts`](lib/services/preparation-history-report.ts) → `listPreparationHistoryReportRows` (1 dòng/batch) | ✅ |
| **Thiết bị** | `/equipment/catalog` | [`equipment-list.ts`](lib/services/equipment-list.ts) | Sort-only |
| | `/equipment/calibration-*`, `/maintenance-*`, `/repair-proposals`, `/spare-parts`, `/disposal` | `equipment-calibration.ts`, `equipment-maintenance.ts`, `equipment-spare-parts.ts`, `equipment-disposal.ts` | Sort-only |
| **Phụ** | `/environment-logs` | [`environmental-logs.ts`](lib/services/environmental-logs.ts) | ✅ |
| | `/containers` (Thống kê) | [`statistics.ts`](lib/services/statistics.ts) → `listInventoryStatistics` | ✅ in-memory |
| | `/stock-in` (bảng lịch sử) | [`stock-in-history.ts`](lib/services/stock-in-history.ts) | ✅ |
| | `/notifications` | [`lib/notifications/query.ts`](lib/notifications/query.ts) + API route | ✅ API sort |

**Export server-side:** [`lib/actions/list-export.ts`](lib/actions/list-export.ts) — dùng cùng filter/sort, không paginate.

**Catalog lot sort:** Query `StockLot` + join master + orphan masters không có lot; merge sort hai luồng; `applyShowMasterFieldsToCatalogRows` sau sort.

**Prep history list:** Bảng chính 1 dòng/batch; export đầy đủ ingredient vẫn qua `getPreparationHistoryReportRows()`.

#### QA browser checklist (sorting)

1. `/chemicals` — click **Mã hóa chất** 3 lần (asc → desc → default) · URL đổi · refresh giữ state
2. `/chemicals?group=…&status=…&q=…&sortBy=expiryDate&sortOrder=desc` — filter + sort đồng thời
3. `/standards`, `/microbial-strains` — sort cột lot, hạn dùng, nhóm
4. `/prepared-standards` — sort parentCode, ngày pha, workflow
5. `/inventory-ledger` — sort + page 2 + filter action
6. `/usage-logs` — tab Nhật ký · sort date · pagination
7. `/preparation-history` — sort + filter loại/trạng thái + page 2
8. `/equipment/catalog` — sort + filter bộ phận/trạng thái
9. Export CSV/Excel sau khi sort — thứ tự khớp bảng

**Prisma index bổ sung:** `PreparedStandard_preparedDate_idx` (`20260706_prepared_standard_prepared_date_index`). `InventoryTransaction.time` và `StockLot.expiryDate` đã có sẵn trong schema.

### Module Thông tin hóa học (buổi 10 · `/chem-info/*`)

**Mục tiêu:** Tra cứu nhanh dữ liệu hóa học, an toàn (GHS/SDS), máy tính lab — **tách biệt** catalog tồn kho `Chemical`.

**Permission keys:** `chem_info_periodic` · `chem_info_lookup` · `chem_info_calculators` · `chem_info_compatibility` — mặc định **read** mọi role nghiệp vụ.

**Routes:**

| Route | Mô tả |
|-------|--------|
| `/chem-info` | redirect → `/chem-info/periodic-table` |
| `/chem-info/periodic-table` | 118 nguyên tố · search · detail panel · **nhóm A/B · ứng dụng · mô hình Bohr** |
| `/chem-info/chemicals` | Local search + **Tra cứu online PubChem** · sync/lưu DB · sort/pagination URL |
| `/chem-info/chemicals/[id]` | Tabs: Thông tin · An toàn GHS/SDS · Liên kết kho (CAS) |
| `/chem-info/calculators` | MW · pha dung dịch · C1V1=C2V2 · **Quy đổi đơn vị v2** (17 loại · category-first) |
| `/chem-info/compatibility` | Checker nhóm / hóa chất |

**Prisma models (reference):** `Element`, `ChemicalReference`, `GhsPictogram`, `ChemicalSafetyProfile`, `SdsDocument`, `CompatibilityRule`, `ChemicalHazardCategory`, `PubChemCache`, `ChemicalReferenceSyncLog`

**Migration:** `20260707_chem_info_module` · `20260708_chemical_reference_sync`

**Seed:**
```powershell
npx tsx prisma/seed-data/chem-info/run-seed.ts
```

**File chính:**

| Layer | Path |
|-------|------|
| Nav + RBAC | [`lib/auth/nav-permissions.ts`](lib/auth/nav-permissions.ts), [`lib/auth/permissions.ts`](lib/auth/permissions.ts), [`components/Sidebar.tsx`](components/Sidebar.tsx) |
| Labels | [`lib/chem-info-labels.ts`](lib/chem-info-labels.ts) |
| Elements data | [`lib/chem-info/elements-data.ts`](lib/chem-info/elements-data.ts) · [`element-groups.ts`](lib/chem-info/element-groups.ts) · [`electron-shell.ts`](lib/chem-info/electron-shell.ts) |
| Calculators | [`lib/chem-info/calculators/*`](lib/chem-info/calculators/) · **units/** [`lib/chem-info/calculators/units/`](lib/chem-info/calculators/units/) |
| Services | [`lib/services/chem-info/elements.ts`](lib/services/chem-info/elements.ts), `chemical-references.ts`, `compatibility.ts`, `inventory-link.ts`, `pubchem.ts`, `pubchem-search-handler.ts`, `chemical-reference-sync.ts` |
| Actions | [`lib/actions/chem-info-sds.ts`](lib/actions/chem-info-sds.ts), [`lib/actions/chem-info-sync.ts`](lib/actions/chem-info-sync.ts) |
| SDS upload | [`lib/sds-upload.ts`](lib/sds-upload.ts) |
| API | `app/api/chem-info/pubchem/*`, `app/api/chem-info/chemical-references/*`, `app/api/chemicals/search-online` |
| UI | [`components/chem-info/*`](components/chem-info/) |
| Pages | `app/chem-info/**` |
| Seed | [`prisma/seed-data/chem-info/`](prisma/seed-data/chem-info/) |
| GHS assets | `public/ghs/GHS01.svg` … `GHS09.svg` |
| Types | [`types/chem-info.ts`](types/chem-info.ts) |

**QA browser checklist (chem-info):**

1. Sidebar — nhóm **Thông tin hóa học** hiện **trên** Hoá chất - Chuẩn - Chủng · 4 submenu
2. `/chem-info/periodic-table` — search "Fe" / "26" · click → detail (khối lượng, **nhóm `13 (IIIA / 3A)` / `8 (VIIIB / 8B)`**, chu kỳ, cấu hình e, **ứng dụng điển hình**, **mô hình Bohr**, điện âm, nóng chảy, sôi)
3. `/chem-info/chemicals` — search CAS/name/formula · sort · pagination · click detail
4. Detail tab **An toàn** — pictograms · H/P statements · SDS links · disclaimer
5. Detail tab **Liên kết kho** — HC catalog cùng CAS (vd. Methanol 67-56-1)
6. `/chem-info/calculators` — 4 tab · validate input · hiển thị công thức · **tab Quy đổi đơn vị:** chọn Loại đơn vị → Từ/Sang filtered · 1 mL→L · OXIDIZER tab compatibility riêng
7. `/chem-info/compatibility` — **Theo nhóm:** OXIDIZER + REDUCING_AGENT → Critical · **Theo HC:** HCl+NaOH → ACID_BASE_HAZARD
8. LabManager+ — upload SDS PDF · **Tra cứu online PubChem** trên list (POST search-online) · refresh/lưu vào DB
9. `/prepared-standards` — không crash sau fix `mapPreparedStandardRow`

---

### Tra cứu hóa chất — PubChem online (buổi 11 · handoff ngắn)

**Luồng:** Local list (`listChemicalReferences` server-side) → nếu empty/user bấm → `POST /api/chemicals/search-online` → preview → `syncFromPubChem` lưu DB.

**API:**

| Method | Route | Ghi chú |
|--------|-------|---------|
| GET | `/api/chem-info/pubchem/search?q=&mode=&limit=` | Tương thích ngược · shared handler |
| POST | `/api/chemicals/search-online` | `{ query, limit?, mode? }` · UI dùng route này |
| POST | `/api/chem-info/chemical-references/sync` | `{ cid }` lưu/merge |
| POST | `/api/chem-info/chemical-references/[id]/refresh` | refresh từ PubChem |

**PubChem flow (server):** name/CAS/formula → CIDs (max 20) → properties + synonyms → parse CAS → cache `pubchem_cache` TTL.

**File chính (buổi 11):**

| Layer | Path |
|-------|------|
| UI list/online | `components/chem-info/ChemicalLookupClient.tsx`, `PubChemSearchPanel.tsx` |
| UI detail | `components/chem-info/ChemicalReferenceDetailClient.tsx` |
| Handler/errors | `lib/services/chem-info/pubchem-search-handler.ts`, `pubchem-errors.ts` |
| PubChem | `lib/services/chem-info/pubchem.ts`, `cas-parser.ts` |
| Sync/dedup | `lib/services/chem-info/chemical-reference-sync.ts` |
| Actions | `lib/actions/chem-info-sync.ts` |
| API | `app/api/chemicals/search-online/route.ts`, `app/api/chem-info/pubchem/search/route.ts` |
| Middleware | `middleware.ts` — `/api/*` JSON 401 |
| Migration | `prisma/migrations/20260708_chemical_reference_sync/migration.sql` |
| Test | `lib/services/chem-info/search-online.test.ts`, `chemical-references-filter.test.ts` |

**Fix filter Trạng thái dữ liệu (PrismaClientValidationError):**

- **Nguyên nhân:** `where.syncStatus` / sort `lastSyncedAt` khi Prisma Client chưa `generate` sau migration `20260708` → Unknown arg.
- **File sửa:** `lib/services/chem-info/chemical-references.ts` (`SYNC_STATUS_FILTER_VALUES`, `buildSyncStatusWhere`), `prisma/seed-data/chem-info/index.ts` (`syncStatus: "local"`), `chemical-references-filter.test.ts`.
- **Mapping filter:**

| UI | URL | Prisma where |
|----|-----|--------------|
| Tất cả | _(none)_ | _(none)_ |
| Nội bộ | `syncStatus=local` | `{ syncStatus: "local" }` |
| Đồng bộ PubChem | `syncStatus=synced` | `{ syncStatus: "synced" }` |
| Nhập thủ công | `syncStatus=manual` | `{ syncStatus: "manual" }` |
| Chưa xác minh | `syncStatus=needs_review` | `{ syncStatus: "needs_review" }` |

- **Test:** load `/chem-info/chemicals` · search `car` · chọn từng filter · sort Nguồn/Cập nhật · page 2 · refresh. CLI: `npx tsx lib/services/chem-info/chemical-references-filter.test.ts`. Nếu vẫn lỗi: `npx prisma generate` + restart dev server.

**Tối ưu dữ liệu:** pagination 25 · không load full DB client · synonyms list ≤20 trên bảng chính · full synonyms trong `extendedData` · SDS chỉ URL/path · không overwrite GHS seed/manual khi sync.

**Test bắt buộc (đã pass CLI):** ethanol · acetone · benzene · caffeine · `64-17-5` · query không tồn tại.

```powershell
npx tsx lib/services/chem-info/search-online.test.ts
npx tsx lib/services/chem-info/compatibility-engine.test.ts
```

### Tương thích hóa chất — Rule Engine v2 + GROUP tab (buổi 12)

**Nguyên nhân false positive (Formic + Benzoic):** engine cũ expand alias (`organic→organic_solvent`, `nitric_acid→acid`) + Cartesian product → rule `acid×organic_solvent` match mọi cặp acid.

**Tab Theo nhóm nguy hiểm (đã sửa buổi 12):** trước đây chỉ 1 rule GROUP (`ACID_BASE_GROUP`); oxidizer+reducer luôn “Không có dữ liệu”. Fix: thêm **8 rule GROUP** · slug UPPERCASE · `evaluateGroupCompatibility()` lọc `ruleType=GROUP` only.

**Engine:** [`lib/services/chem-info/compatibility-engine.ts`](lib/services/chem-info/compatibility-engine.ts)

- Operand: `cas | group | hazard` (exact match · alias expand chỉ `subjectFromCategory`)
- `ruleType`: CHEMICAL > GROUP > HAZARD — chỉ trả tier cao nhất
- **Category tab** → `evaluateGroupCompatibility()` (GROUP rules only)
- **Chemical tab** → `evaluateCompatibility()` (full tier precedence)

**8 rule GROUP (severity):**

| Code | Cặp | Severity |
|------|-----|----------|
| `ACID_BASE_GROUP` | STRONG_ACID ↔ STRONG_BASE | critical |
| `OXIDIZER_REDUCING_AGENT_GROUP` | OXIDIZER ↔ REDUCING_AGENT | critical |
| `OXIDIZER_FLAMMABLE_GROUP` | OXIDIZER ↔ FLAMMABLE_LIQUID | high |
| `OXIDIZER_ORGANIC_GROUP` | OXIDIZER ↔ ORGANIC_SOLVENT | high |
| `ACID_CYANIDE_GROUP` | ACID ↔ CYANIDE | critical |
| `ACID_SULFIDE_GROUP` | ACID ↔ SULFIDE | critical |
| `WATER_REACTIVE_WATER_GROUP` | WATER_REACTIVE ↔ WATER | critical |
| `PYROPHORIC_AIR_GROUP` | PYROPHORIC ↔ AIR | critical |

**Label → code (dropdown):** Chất oxy hóa=`OXIDIZER` · Chất khử=`REDUCING_AGENT` · Acid mạnh=`STRONG_ACID` · … — [`hazard-category-map.ts`](lib/chem-info/hazard-category-map.ts)

**Schema:** migration `20260709_compatibility_rule_operands` — `ruleType`, `operandAKind/Value`, `operandBKind/Value`

**Dữ liệu:** **31 rules** — [`compatibility-rules.ts`](prisma/seed-data/chem-info/compatibility-rules.ts) · hazard CAS UPPERCASE — [`hazard-categories.ts`](prisma/seed-data/chem-info/hazard-categories.ts)

**Test CLI (pass):**

```powershell
npx tsx lib/services/chem-info/compatibility-engine.test.ts
```

Formic+Benzoic → 0 · HCl+NaOH → ACID_BASE_HAZARD · OXIDIZER+REDUCING_AGENT → critical (GROUP) · strong_acid+strong_base → ACID_BASE_GROUP

**Seed:** `npx tsx scripts/seed-chem-info-only.ts`

**Defer:** N↔M equivalence · bleach SKU · gợi ý khi nhập kho

### Unit Converter v2 — Quy đổi đơn vị (buổi 12)

**Trước:** 12 unit flat dropdown · `%w/v` không có logic · không category guard.

**Sau:** module [`lib/chem-info/calculators/units/`](lib/chem-info/calculators/units/)

```
units/
  unit-categories.ts    # 17 loại + label VI
  unit-definitions.ts   # ~60 units · factorToBase · aliases
  conversion-context.ts # MW · density · rotorRadiusCm
  bridge-rules.ts       # cross-dimension + validateConversion
  conversion-engine.ts  # convertUnits()
  conversion-engine.test.ts
```

**UI:** [`UnitConverter.tsx`](components/chem-info/UnitConverter.tsx) — **Loại đơn vị** → Từ/Sang filtered · fields MW/density/radius động.

**Conversion types:**

| Loại | Ví dụ |
|------|-------|
| Direct | mg↔g · mL↔L · °C↔K · atm↔kPa |
| Bridge + MW | M↔mg/L |
| Bridge + density | mg↔mL · % w/w↔mg/mL |
| Bridge + radius | rpm↔RCF |
| Aqueous | ppm↔mg/L · ppb↔µg/L |

**Không convert trực tiếp:** mg→mL (thiếu density) · cross-category qua dropdown (UI lock).

**Tách biệt** [`lib/inventory-units.ts`](lib/inventory-units.ts) — stock kg/g/mg · L/mL/µL không đổi.

**Test CLI (pass — 12 cases):**

```powershell
npx tsx lib/chem-info/calculators/units/conversion-engine.test.ts
npx tsx lib/chem-info/calculators/calculators.test.ts
```

1 mL→L=0.001 · 1000 µL→mL=1 · 1 g→mg=1000 · 1 mg/L→ppm≈1 · 1 M NaCl MW=58.44→58440 mg/L · 25°C→298.15 K · 1 atm→101.325 kPa · rpm→RCF cần radius · 1 % w/v→10 mg/mL · mg→mL error

---

## Thông tin hóa học — handoff ngắn (buổi 11+)

### 1. Module

Inventory LIMS → **Thông tin hóa học** (`/chem-info/*`):

| Phần | Route | Trạng thái |
|------|-------|------------|
| Bảng tuần hoàn | `/chem-info/periodic-table` | ✅ detail v2 — nhóm IUPAC + A/B · ứng dụng · Bohr 2D · **local uncommitted** |
| Tra cứu hóa chất | `/chem-info/chemicals` | ✅ local + PubChem online · **mobile search fix** (buổi 14 · local) |
| Máy tính | `/chem-info/calculators` | ✅ Unit Converter v2 · **Dilution v2/v2.1** (prod `108160b`) · **MW parser v2** (local buổi 14) |
| Tương thích | `/chem-info/compatibility` | ✅ Engine v2 · GROUP tab 8 rules |

### 2. Tra cứu hóa chất

**Quyết định:** không import bulk PubChem · local trước → online · FE→API nội bộ→PubChem · không Google scrape.

| API | Ghi chú |
|-----|---------|
| `GET /api/chem-info/pubchem/search` | Tương thích ngược |
| `POST /api/chemicals/search-online` | UI dùng route này · max **20**/lần |
| `POST /api/chem-info/chemical-references/sync` | Lưu có chọn lọc |

**List:** server pagination/search/sort · **25**/trang · synonyms lean trên bảng · SDS **URL/path only**.

**Dedup khi lưu:** CAS → PubChem CID → InChIKey → `normalizedName`.

**Nguồn / trạng thái (DB → UI):**

| Khái niệm | DB field | Giá trị / badge |
|-----------|----------|-----------------|
| Nội bộ | `source=seed`, `syncStatus=local` | Seed · Dữ liệu nội bộ |
| PubChem | `source=pubchem`, `syncStatus=synced` | Đồng bộ PubChem |
| Manual | `syncStatus=manual` | Nhập thủ công |
| Chưa xác minh | `syncStatus=needs_review` | Chưa xác minh |

Filter dropdown map → `syncStatus` (không truyền field ảo vào Prisma).

**File chính:** `pubchem.ts`, `pubchem-search-handler.ts`, `chemical-reference-sync.ts`, `chemical-references.ts`, `PubChemSearchPanel.tsx`, migration `20260708`.

### 3. Lỗi đã gặp & fix

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| “Không thể kết nối PubChem” | `catch {}` rỗng FE · HTML login redirect | POST search-online · parse an toàn · JSON 401 middleware |
| Mobile tra cứu mất chữ | `useEffect` sync URL→input khi focus | `useDebouncedListQuery` skip sync khi focused · `commitSearch()` Enter/blur |
| PubChem hiện DTXSID làm tên | Lấy synonym đầu tiên | `pickPubChemDisplayName()` · cache v3 |
| `PrismaClientValidationError` filter trạng thái | `syncStatus` trước `prisma generate` / client stale | `buildSyncStatusWhere` · migrate `20260708` · `prisma generate` + restart dev |
| Compatibility false positive | Engine cũ expand alias + rule `acid×organic` quá rộng | **Engine v2** (§4) |

### 4. Tương thích — Compatibility Rule Engine v2 + GROUP tab

**Lỗi nghiệp vụ (đã sửa buổi 11):** Formic + Benzoic match nhầm Nitric/Perchloric/Chromic do expand `organic→organic_solvent`, `nitric_acid→acid`.

**Lỗi tab Theo nhóm (đã sửa buổi 12):** OXIDIZER + REDUCING_AGENT → “Không có dữ liệu” vì chỉ 1/31 rule dùng `operandKind=group` · tab không lọc GROUP.

**Engine:** [`compatibility-engine.ts`](lib/services/chem-info/compatibility-engine.ts)

```
Subject(cas, groups[], hazards[]) → match exact operand → tier cao nhất
CHEMICAL (3) > GROUP (2) > HAZARD (1) — không cộng dồn cross-tier
Tab nhóm: evaluateGroupCompatibility() — GROUP only
Tab HC:   evaluateCompatibility() — full rules
```

| ruleType | Match | Ví dụ |
|----------|-------|-------|
| CHEMICAL | CAS exact (+ hazard operand) | HNO3 CAS × ORGANIC_SOLVENT |
| GROUP | group id (UPPERCASE) + alias | OXIDIZER × REDUCING_AGENT |
| HAZARD | hazard slug exact (UPPERCASE) | OXIDIZER × FLAMMABLE_LIQUID |

**Không** dùng `contains("acid")` khi match rule · alias expand chỉ trong `subjectFromCategory`.

**Schema:** migration `20260709` — `ruleType`, `operandAKind/Value`, `operandBKind/Value`.

**Dữ liệu:** **31 rules** (8 GROUP) · 33 HC seed UPPERCASE — `compatibility-rules.ts`, `hazard-categories.ts`, `hazard-category-map.ts`.

**UI kết quả:**

- Có rule → **Không tương thích** (đỏ) + severity Critical/Cao/TB
- Không rule → vàng “Không có dữ liệu tương thích” *(TODO: đổi copy theo spec SDS)*
- **Không** dùng “Không phát hiện xung đột” khi thiếu rule

### 5. Unit Converter v2 (tab Quy đổi đơn vị)

**Route:** `/chem-info/calculators` → tab **Quy đổi đơn vị**

**Files:** [`lib/chem-info/calculators/units/`](lib/chem-info/calculators/units/) · [`UnitConverter.tsx`](components/chem-info/UnitConverter.tsx)

**UI flow:** Loại đơn vị → Giá trị → Từ → Sang → [MW | Mật độ | Bán kính rotor nếu cần]

**17 loại:** MASS · VOLUME · CONCENTRATION_MOLAR · CONCENTRATION_MASS · CONCENTRATION_BRIDGE · PERCENT · PPM_PPB · AMOUNT · NORMALITY_MOLALITY · MASS_VOLUME · TEMPERATURE · PRESSURE · DENSITY · CONDUCTIVITY · FLOW_RATE · TIME · CENTRIFUGATION

### 5b. Dilution Calculator v2 / v2.1 (tab Pha loãng C₁V₁=C₂V₂)

**Route:** `/chem-info/calculators` → tab **Pha loãng C₁V₁=C₂V₂**

**Files:** [`lib/chem-info/calculators/dilution/`](lib/chem-info/calculators/dilution/) · [`components/chem-info/dilution/`](components/chem-info/dilution/)

**3 chế độ UI:**

| Mode | Mô tả |
|------|-------|
| Pha loãng đơn | C₁V₁=C₂V₂ · tính 1 biến · đơn vị + MW/density bridge |
| Pha loãng nối tiếp | Serial dilution · bảng từng bước · dropdown hiển thị mL/µL |
| Chuẩn hiệu chuẩn | Calibration standards · nhiều nồng độ đích · V stock hiển thị mL/µL |

**Đơn vị nồng độ:** M · mM · µM · mg/mL · µg/mL · mg/L · **µg/L · ng/L · ppm · ppb** · % w/v · % w/w · % v/v

**Quy ước aqueous (gần đúng):** 1 ppm ≈ 1 mg/L · 1 ppb ≈ 1 µg/L — constant `AQUEOUS_CONCENTRATION_DISCLAIMER`

**Normalize nồng độ:** align C₁/C₂ qua `concentrationToUnit` → `convertUnits`; aqueous (mg/L · µg/L · ng/L · ppm · ppb) hub qua **µg/L** khi khác nhóm PPM/G_PER_L.

**Normalize thể tích:** tính nội bộ (L) · hiển thị bảng qua `convertVolumeForDisplay` (mL↔µL trực tiếp) · `volumeToLiters` fallback µL khi sub-mL.

**Cảnh báo:** pipet &lt; 10 µL · V stock &gt; V final (warning, không chặn bảng).

**Test CLI (pass):**

```powershell
npx tsx lib/chem-info/calculators/dilution/dilution.test.ts
```

Ví dụ v2.1: 1000 mg/L → 10 mg/L, Vfinal 100 mL → 1 mL / 1000 µL · 1000 mg/L → 1 µg/L → 0.1 µL + cảnh báo · 1000 mg/L → 10 ppb → 1 mL · Serial 10× Vfinal 10 mL → 1 mL / 1000 µL

**QA browser (pending):**

- [ ] Tab Pha loãng đơn: ppb/µg/L · disclaimer aqueous
- [ ] Chuẩn hiệu chuẩn: stock 1000 mg/L · target 1,5,10,20 µg/L · Vfinal 100 mL · toggle mL/µL
- [ ] Serial: 10× · toggle mL/µL · copy bảng TSV

### 5c. Molecular Weight parser v2 (tab Khối lượng mol)

**Route:** `/chem-info/calculators` → tab **Khối lượng mol**

**Files:** [`molecular-formula-parser.ts`](lib/chem-info/calculators/molecular-formula-parser.ts) · [`molecular-weight.ts`](lib/chem-info/calculators/molecular-weight.ts) · [`MolecularWeightCalculator.tsx`](components/chem-info/MolecularWeightCalculator.tsx)

**Dạng công thức hỗ trợ:**

| Dạng | Ví dụ |
|------|-------|
| Không phân biệt hoa/thường | `h2so4`, `nacl`, `cuso4` |
| Hydrate / solvate / adduct | `H2SO4.H2O`, `CuSO4.5H2O`, `FeCl3.6CH3OH`, `CaCl2.8NH3` |
| Nhiều phần | `NaCl.2H2O.CH3OH` |
| Clathrate (best-effort) | `CH4.5.75H2O` → CH₄ + 5.75×H₂O |
| Ngoặc nhóm | `(H2O)5`, `(NH3)8` |
| Phân biệt Co / CO₃ | `Na2CO3` → carbonate · `CoCl2` → cobalt |

**UI:** Bảng phần (công thức · hệ số · g/mol) khi có ≥2 phần · bảng nguyên tố gộp.

**Test CLI (pass):**

```powershell
npx tsx lib/chem-info/calculators/molecular-weight.test.ts
```

| Input | Kỳ vọng (g/mol) |
|-------|-----------------|
| `h2so4` | ~98.072 |
| `H2SO4.H2O` | ~116.087 |
| `CuSO4.5H2O` | ~249.68 |
| `Na2CO3.10H2O` | ~286.14 |
| `CaCl2.2H2O` | ~147.01 |
| `FeCl3.6CH3OH` | ~354.45 |
| `CaCl2.8NH3` | ~247.23 |
| `CH3COOH` | ~60.05 |
| `CH4.5.75H2O` | ~119.63 |

**Tra cứu mobile (buổi 14):** [`useDebouncedListQuery.ts`](lib/hooks/useDebouncedListQuery.ts) · [`ChemicalLookupClient.tsx`](components/chem-info/ChemicalLookupClient.tsx) · PubChem tên: [`display-name.ts`](lib/services/chem-info/display-name.ts)

**QA browser (pending):**

- [ ] Mobile: gõ `acetamiprid` liên tục không mất chữ
- [ ] Desktop: search `ethanol`, `64-17-5`
- [ ] PubChem online: không hiện DTXSID làm tên chính

### 6. Test bắt buộc (CLI pass)

```powershell
npx tsx lib/chem-info/calculators/molecular-weight.test.ts
npx tsx lib/services/chem-info/display-name.test.ts
npx tsx lib/services/chem-info/compatibility-engine.test.ts
npx tsx lib/chem-info/calculators/units/conversion-engine.test.ts
npx tsx lib/chem-info/calculators/dilution/dilution.test.ts
npx tsx lib/chem-info/calculators/calculators.test.ts
npx tsx lib/services/chem-info/search-online.test.ts
npx tsx lib/services/chem-info/chemical-references-filter.test.ts
npx tsx lib/chem-info/element-display.test.ts
```

| Cặp | Kỳ vọng |
|-----|---------|
| B group | `13 (IIIA / 3A)` |
| Sc group | `3 (IIIB / 3B)` |
| Fe group | `8 (VIIIB / 8B)` |
| B applications | ≥5 items (có Flame retardants) |
| Mt applications | empty state |
| Formic + Benzoic | 0 rule |
| Acetic + Acetic (cùng HC) | 0 rule |
| HCl + NaOH | ACID_BASE_HAZARD · critical |
| HNO3 + Acetone | NITRIC_ORGANIC · critical |
| Perchloric + Methanol | PERCHLORIC_ORGANIC · critical |
| H2O2 + Ethanol | H2O2_ORGANIC · high |
| KMnO4 + Methanol | KMnO4_ORGANIC · high |
| Na + Water | REACTIVE_METAL_WATER · critical |
| strong_acid + strong_base (category) | ACID_BASE_GROUP |
| OXIDIZER + REDUCING_AGENT (category) | OXIDIZER_REDUCING_AGENT_GROUP · critical |
| 1 mL → L (unit converter) | 0.001 L |
| 1 M NaCl MW=58.44 → mg/L | 58440 mg/L |

PubChem online: ethanol · acetone · benzene · caffeine · `64-17-5` · query không tồn tại.

### 8. Bảng tuần hoàn — detail v2 (buổi 15 · local · chưa commit)

**Route:** `/chem-info/periodic-table` · 118 nguyên tố · search · detail panel bên phải.

**Đã làm:**

- [x] **Nhóm IUPAC + truyền thống A/B** — [`lib/chem-info/element-groups.ts`](lib/chem-info/element-groups.ts)
  - Nhóm chính A: 1, 2, 13–18 → `IA/1A` … `VIIIA/8A`
  - Kim loại chuyển tiếp: 3–12 → `IIIB/3B` … `IIB/2B` · nhóm 8–10 → `VIIIB/8B`
  - f-block (La–Lu, Ac–Lr, `group: null`) → `—` (không gán A/B sai)
- [x] **Ứng dụng điển hình** — `ELEMENT_APPLICATIONS` trong [`elements-data.ts`](lib/chem-info/elements-data.ts) · **47 nguyên tố** có data
  - DB cột `elements.applications` (JSON `string[]`) · migration `20260710_element_applications`
  - Runtime fallback: DB rỗng → constant map ([`elements.ts`](lib/services/chem-info/elements.ts) `mapElement()`)
- [x] **Mô hình electron Bohr 2D** — [`electron-shell.ts`](lib/chem-info/electron-shell.ts) · SVG [`BohrModelDiagram.tsx`](components/chem-info/BohrModelDiagram.tsx)
- [x] **UI** — [`ElementDetailPanel.tsx`](components/chem-info/ElementDetailPanel.tsx): thông tin cơ bản · nhóm · cấu hình e · ứng dụng (bullet/empty) · Bohr
- [x] **Seed d-block IUPAC** — Sc→Zn, Y→Cd, Hf→Hg, Rf→Cn có `group` 3–12 trong seed
- [x] Test CLI pass: `npx tsx lib/chem-info/element-display.test.ts`

**Luồng dữ liệu ứng dụng:**

```
ELEMENT_APPLICATIONS (constant)
  → seed: JSON.stringify → elements.applications (DB)
  → runtime: parseApplications(DB) || getElementApplications(symbol)
  → ElementDetailPanel: element.applications
```

**Lỗi đã gặp & fix:**

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| Mọi nguyên tố hiện "Chưa có dữ liệu ứng dụng" | `mapElement()` chỉ đọc DB; DB `[]` nếu chưa re-seed | Fallback runtime sang `ELEMENT_APPLICATIONS` |
| Fe chỉ hiện `8` không có B | Map nhóm B chưa có | Thêm nhãn 3–12 trong `element-groups.ts` |
| Prisma generate EPERM | Dev server lock `query_engine-windows.dll.node` | Kill port 3000 · restart dev sau `prisma generate` |

**Mapping nhóm (tóm tắt):**

| IUPAC | Traditional |
|-------|-------------|
| 1, 2 | IA/1A, IIA/2A |
| 3–7 | IIIB/3B … VIIB/7B |
| 8, 9, 10 | VIIIB/8B |
| 11, 12 | IB/1B, IIB/2B |
| 13–18 | IIIA/3A … VIIIA/8A |

**File chính (buổi 15):**

| Layer | Path |
|-------|------|
| Data | `lib/chem-info/elements-data.ts`, `element-groups.ts`, `electron-shell.ts` |
| Service | `lib/services/chem-info/elements.ts` |
| UI | `components/chem-info/ElementDetailPanel.tsx`, `BohrModelDiagram.tsx` |
| Schema | `prisma/schema.prisma` — field `applications` |
| Migration | `prisma/migrations/20260710_element_applications/` |
| Seed | `prisma/seed-data/chem-info/index.ts` |
| Test | `lib/chem-info/element-display.test.ts` |

**QA browser (pending):**

- [ ] Click **B** → nhóm `13 (IIIA / 3A)` · 5 ứng dụng · Bohr shell `2, 3`
- [ ] Click **Sc** → nhóm `3 (IIIB / 3B)` · 4 ứng dụng
- [ ] Click **Fe** → `8 (VIIIB / 8B)` · **Cu** `11 (IB / 1B)` · **Zn** `12 (IIB / 2B)`
- [ ] Click **C, O, Na** → có ứng dụng
- [ ] Click **Mt** hoặc lantanoid → empty state ứng dụng hợp lệ

**Seed local (sau sửa data):**

```powershell
npx tsx prisma/seed-data/chem-info/run-seed.ts
```

## 8. Module Phương pháp phân tích — handoff chi tiết (buổi 16–25)

### Kiến trúc

- **Identity:** `AnalyticalMethod` (methodCode unique)
- **Nền mẫu:** M:N qua `AnalyticalMethodMatrix` → `SampleMatrix` (catalog Quản trị) · UI checkbox multi-select · list gom nhóm (`MethodMatrixListCell`)
- **Chất phân tích:** M:N qua `AnalyticalMethodTestMethod` → `TestMethod` (Danh mục chỉ tiêu) · UI multi-select lọc nhóm · đồng bộ hai chiều với catalog
- **Chỉ tiêu ↔ PP (catalog):** cùng junction `AnalyticalMethodTestMethod` với `unit` · `lod` · `loq` · **`isPrimary`** · `sortOrder` — mỗi chỉ tiêu có thể gán nhiều Mã PP với ĐVT/LOD riêng
- **Artifact theo version:** `MethodVersion` + documents/workflow/QC/reagents/equipment/executions
- **Workflow:** `MethodWorkflow` 1:1 `MethodVersion` · React Flow (`WorkflowEditor.tsx` + `workflow/*`) · **Undo/Redo · pan chuột · Shift+marquee · phím tắt · copy/paste · auto-save**
- **Approval FSM:** Draft → Review → Approved → Obsolete · template từ `preparation-workflow` · separation of duties trong `method-approval.ts`
- **Execution:** chỉ `MethodVersion.status = Approved` (trừ Admin override flag — chưa implement) · snapshot checklist → `MethodExecutionStep`
- **Upload SOP:** `lib/sop-upload.ts` → `public/uploads/sop/` hoặc Vercel Blob · không lưu binary DB
- **AI:** stub — `extractSopStub()` ghi `MethodAIExtractionLog` status Failed · API `POST /api/analytical-methods/[id]/extract-sop`

### Routes

| Route | Mô tả |
|-------|--------|
| `/analytical-methods` | Dashboard KPI (draft/review/approved counts) |
| `/analytical-methods/list` | Danh sách + search |
| `/analytical-methods/new` | Tạo method + v1 Draft + **chọn nhiều Nền mẫu** + **Chất phân tích** |
| `/analytical-methods/[id]` | Overview metadata — **Nền mẫu** + **Chất phân tích** multi checkbox |
| `/analytical-methods/[id]/documents` | Upload SOP PDF/DOCX |
| `/analytical-methods/[id]/workflow` | Flowchart editor (@xyflow/react) |
| `/analytical-methods/[id]/checklist` | Preview checklist từ workflow |
| `/analytical-methods/[id]/qc` | QC + acceptance + safety checks |
| `/analytical-methods/[id]/reagents` | Reagents + calculator số mẫu |
| `/analytical-methods/[id]/equipment` | Equipment links + calibration warnings |
| `/analytical-methods/[id]/approvals` | Approval + fork version + start execution |
| `/method-executions/[id]` | Runtime tick steps + export CSV |

### RBAC

| Key | Route guard |
|-----|-------------|
| `methods_dashboard` | `/analytical-methods` (exact) |
| `methods_list` | `/analytical-methods/list`, `/analytical-methods/[id]/*`, `/method-executions/*` |

Role defaults (`lib/auth/permissions.ts`): Admin/LabManager/Analyst **write** cả hai · QAQC **read** · Viewer **read** dashboard+list.

### Prisma models (mới)

`AnalyticalMethod`, `AnalyticalMethodMatrix`, `AnalyticalMethodTestMethod`, `MethodVersion`, `MethodDocument`, `MethodWorkflow`, `WorkflowNode`, `WorkflowEdge`, `MethodReagent`, `MethodEquipment`, `MethodQCRequirement`, `MethodAcceptanceCriteria`, `MethodSafetyNote`, `MethodApproval`, `MethodAIExtractionLog`, `MethodExecution`, `MethodExecutionStep`

FK: `AnalyticalMethodMatrix` → `SampleMatrix` · `AnalyticalMethodTestMethod` → `TestMethod` (+ `unit`/`lod`/`isPrimary` trên junction) · `MethodReagent` → `Chemical`/`Standard` · …

### File chính

| Layer | Path |
|-------|------|
| Schema | `prisma/schema.prisma` (cuối file — enums + 15 models) |
| Labels | `lib/analytical-methods-labels.ts` |
| Upload | `lib/sop-upload.ts` |
| Types | `types/analytical-methods.ts` |
| Mappers | `lib/mappers/analytical-methods.ts` |
| Services | `lib/services/analytical-methods/*.ts` (8 files) |
| Actions | `lib/actions/analytical-methods.ts`, `method-workflow.ts`, `method-execution.ts` |
| Nav/RBAC | `lib/auth/nav-permissions.ts`, `lib/auth/permissions.ts`, `components/Sidebar.tsx` |
| Layout | `app/analytical-methods/layout.tsx`, `components/analytical-methods/AnalyticalMethodsAppShell.tsx` |
| Pages | `app/analytical-methods/**`, `app/method-executions/[id]/page.tsx` |
| Components | `components/analytical-methods/*.tsx` · **`MethodMatrixMultiSelect.tsx`** · **`MethodMatrixListCell.tsx`** · **`MethodTestMethodMultiSelect.tsx`** · **`MethodAnalyteListCell.tsx`** · **`components/analytical-methods/workflow/*`** (11 files) |
| Seed demo | `prisma/seed-data/analytical-methods/*` · wired trong `prisma/seed.ts` |
| API | `app/api/analytical-methods/[id]/extract-sop/route.ts` |
| Tests | `scripts/test-method-approval.ts`, `test-method-workflow.ts`, **`test-workflow-history.ts`**, **`verify-analytical-methods-seed.ts`**, **`seed-analytical-methods.ts`** |

### Seed demo phương pháp

Sau `npm run db:seed` (hoặc `npx tsx scripts/seed-analytical-methods.ts`):

| methodCode | technique | nodes | ghi chú |
|------------|-----------|-------|---------|
| `PP-ICP-WAT-001` | ICP-OES | 18 | nền **`WATER`** · Pb,Cd,As,… |
| `PP-LCMS-PST-001` | LC-MS/MS | 20 | nền **`FOOD-VEG`** (có thể gán thêm nền qua UI) |

- Idempotent: skip nếu `methodCode` đã tồn tại
- SOP metadata (scope/principle/sample prep) lưu trong `MethodVersion.changeLog` (markdown) — **chưa có field UI riêng trên tab Tổng quan**

### Flowchart editor — phím tắt & pan

| Phím / chuột | Hành động |
|--------------|-----------|
| **Kéo trái (vùng trống)** | Di chuyển canvas (pan) |
| **Shift + kéo vùng** | Chọn nhiều bước (marquee) |
| **Chuột giữa / phải + kéo** | Di chuyển canvas (luôn) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Lưu workflow |
| `Ctrl+C/V/D` | Copy / Paste / Duplicate |
| `Delete` / `Backspace` | Xóa selection |
| `Ctrl+A` | Chọn tất cả node |
| `Ctrl+0/+/-` | Zoom |
| `Esc` | Bỏ chọn |
| `Shift/Ctrl + Click` | Multi-select từng bước |

- History cap 100 · auto-save 15s · toolbar **? Phím tắt**
- **Prod:** pan chưa deploy — cần commit + push sau buổi này

### Luồng nghiệp vụ

```
Tạo method (Draft v1)
  → Upload SOP (documents)
  → Chỉnh flowchart (workflow, isDraft=true)
  → Cấu hình QC / reagents / equipment
  → Gửi duyệt (Review) → Phê duyệt (Approved, isDraft=false)
  → [Optional] Fork version mới nếu sửa bản Approved
  → Tạo execution (N mẫu) → Tick từng bước → Export CSV
```

**Quy tắc an toàn AI:** AI chỉ đề xuất · không auto-approve · banner “Kết quả AI cần kiểm tra theo SOP gốc” · không ghi đè SOP gốc.

### Setup local (chat mới)

```powershell
# Kill dev server nếu EPERM prisma generate
taskkill /F /IM node.exe 2>$null
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Mở http://localhost:3000/analytical-methods — login Admin/LabManager.

### Turso prod

- [x] **`20260711_analytical_methods`** — applied 2026-06-28 (`prisma/migrations/20260711_analytical_methods/migration.sql`)
- [x] **`20260710_element_applications`** — applied
- [x] Seed: `npx tsx scripts/seed-methods-prod.ts` (an toàn hơn full `db:seed` trên prod)
- [ ] Full `npm run db:seed` prod — **blocked** schema drift `PreparedStandardComponent.stockLotId`

### QA browser checklist (pending)

**Module cơ bản:**

- [ ] Sidebar hiện nhóm **Phương pháp phân tích** (Admin/LabManager/Analyst)
- [ ] Danh sách hiển thị **2 seed** (`PP-ICP-WAT-001`, `PP-LCMS-PST-001`) hoặc method tự tạo
- [ ] Upload SOP PDF → link mở được
- [ ] Flowchart: thêm Step, nối edge, lưu, reload giữ layout + viewport
- [ ] Checklist sinh đúng thứ tự
- [ ] Reagent: thêm + tính 10 mẫu → cảnh báo tồn (nếu link chemicalId)
- [ ] Equipment: cảnh báo HC quá hạn (seed `EQ-ICP-001` Maintenance)
- [ ] QC: blank/CCV · safety check (HNO3 CAS trong chem-info)
- [ ] Approval: Draft→Review→Approved · separation of duties
- [ ] Execution: tạo từ Approved · tick Done · export CSV
- [ ] Fork version từ Approved → edit workflow trên Draft mới
- [ ] Nút AI extract → message stub (không crash)

**Nền mẫu + Chất phân tích (buổi 24–25):**

- [ ] Tạo mới PP → tick **2–3 Nền mẫu** → list gom nhóm `Thực phẩm (N): … +M`
- [ ] Tab Tổng quan → thêm/bớt nền · bỏ hết tick → lưu OK
- [ ] Multi-select **Chất phân tích** · lọc nhóm · search mã/tên
- [ ] List cột Chất phân tích gom theo nhóm chỉ tiêu
- [ ] Catalog `/admin/catalog/test-methods` ↔ PP tab Tổng quan đồng bộ link
- [ ] Catalog: chỉ tiêu 2 PP khác ĐVT/LOD · đổi **PP chính** (★)

**Flowchart UX (buổi 16 tiếp + pan):**

- [ ] **Pan:** kéo trái trên nền grid → canvas di chuyển · minimap cập nhật
- [ ] **Shift+kéo** → khung chọn nhiều node
- [ ] **Undo/Redo:** thêm/xóa/sửa/kéo node · Ctrl+Z/Y · copy/paste
- [ ] Reload → viewport đã pan được khôi phục
- [ ] Read-only version → pan OK · không marquee

**Flowchart Undo/Redo (buổi 16 tiếp):**

- [ ] Thêm node → `Ctrl+Z` → node mất → `Ctrl+Y` → quay lại
- [ ] Xóa node có edge → Undo khôi phục node + edges
- [ ] Kéo node → Undo về vị trí cũ (1 bước, không 50 bước)
- [ ] Sửa label → blur → Undo → label cũ
- [ ] Copy/paste → ID node mới, không trùng `nodeKey`
- [ ] `Ctrl+D` multi-select → duplicate + internal edges
- [ ] `Ctrl+S` → dirty badge tắt
- [ ] Focus input label + `Ctrl+Z` → text undo native, graph không đổi
- [ ] Reload tab khi dirty → browser cảnh báo
- [ ] `start`/`end` không xóa được bằng Delete

### Việc tiếp theo (global)

- [ ] **Commit + push** module Tiếp nhận mẫu + seed demo (buổi 17) → Turso `20260712` → redeploy prod
- [ ] **Commit + push** pan flowchart (`WorkflowCanvas.tsx`, `WorkflowShortcutsModal.tsx`) → redeploy prod
- [ ] **QA browser E2E** module Tiếp nhận mẫu (§9 — FSM · prefill · QR · RBAC)
- [ ] **QA browser** module Phương pháp phân tích (§8 checklist — pan + Undo/Redo + **Nền mẫu multi** + **Chất phân tích** + E2E)
- [ ] **Tab Tổng quan** — field SOP summary (scope/principle/sample prep)
- [ ] **AI extraction** — LLM provider · `extractSop` thật
- [ ] **UX P2** — picker catalog · auto-layout flowchart (dagre)
- [ ] **Fix** edge `conditionJson` mất khi save workflow
- [ ] Turso prod: fix schema drift `stockLotId` → full re-seed nếu cần
- [ ] QA chem-info prod (periodic-table v2 · calculators · compatibility · mobile search)
- [ ] Turso: **code standardization** pipeline (`20260706_code_standardization`) chưa chạy prod
- [ ] Vercel env: `BLOB_READ_WRITE_TOKEN` · `CRON_SECRET` · QA upload SOP prod
- [ ] Defer: link drawer kho · compatibility stock-in · RDKit 2D · align SolutionPrep units · mở rộng ứng dụng 118 nguyên tố

---

## 9. Module Tiếp nhận mẫu — handoff chi tiết (buổi 17 + 23)

### Catalog nền mẫu & chỉ tiêu (buổi 23–24)

- **Nhóm (`SampleMatrixGroup`):** dùng cho **Loại mẫu mặc định** trên phiếu · admin `/admin/catalog/matrix-groups`
- **Nền (`SampleMatrix`):** gán từng dòng mẫu · quyết định chỉ tiêu khả dụng · admin `/admin/catalog/matrices` (CRUD + import Excel) · mapping `/admin/catalog/mappings`
- **Chỉ tiêu (`TestMethod`):** admin `/admin/catalog/test-methods` — CRUD · LOD · Phương pháp thử mặc định · import/export Excel · **bulk Sửa/Ẩn/Xóa** · dropdown lọc nhóm · sau đó gán nền tại Mapping
- **Mapping:** `fetchMatrixMappingEditorAction` load **toàn bộ** chỉ tiêu + `mappedIds` — không dùng `listTestMethodsForMatrix` khi edit · panel phải `MappingSelectedPanel`
- **Thứ tự dropdown:** `sortOrder` unique per group · nút **Chuẩn hóa thứ tự** trên admin nhóm
- **Legacy:** `SampleRequest.sampleType` vẫn là **string tên nhóm** (tương thích filter cũ) · không FK

### Kiến trúc

- **Identity:** `Sample.sampleCode` unique · sinh `SPL-YYYYMMDD-0001` qua `CodeSequence` prefix theo ngày (`lib/sample-code.ts`)
- **Phiếu YC:** `SampleRequest` + `SampleRequestTest` + `SampleRequestMethod` · mã `PR-YYYYMMDD-0001`
- **Phép thử:** `SampleTest` + junction `SampleTestChemical` / `SampleTestStandard`
- **FSM:** `lib/services/samples/sample-workflow.ts` — `SAMPLE_TRANSITIONS` · validate hoàn thành cần PP + assignee
- **Audit:** `SampleAuditLog` (entity-scoped) + `writeAuditLog()` global trên mutations
- **Chain of custody:** `SampleCustodyEvent` — Received / Transferred / Stored / Disposed
- **Cảnh báo:** `sample-warnings.ts` — TB quá hạn HC · HC/Chuẩn hết hạn/tồn thấp

### Routes

| Route | Permission key | Mô tả |
|-------|----------------|--------|
| `/samples` | `samples_list` | Danh sách + filter + overdue |
| `/samples/receive` | `samples_receive` | Form tiếp nhận 5 nhóm |
| `/samples/[id]` | `samples_list` | Chi tiết · FSM · audit · custody · QR |
| `/samples/requests` | `samples_requests` | Danh sách phiếu YC |
| `/samples/requests/new`, `/samples/requests/[id]` | `samples_requests` | Form phiếu YC — **buổi 23:** 3 vùng · chọn nhóm → lọc nền · panel chỉ tiêu split |
| `/admin/catalog/matrix-groups` | `catalog_matrices` | CRUD nhóm nền mẫu |
| `/admin/catalog/matrices` | `catalog_matrices` | CRUD nền mẫu · sửa inline · import Excel · ẩn/xóa |
| `/admin/catalog/test-methods` | `catalog_test_methods` | CRUD chỉ tiêu · LOD · import/export Excel · **bulk Sửa/Ẩn/Xóa** |
| `/admin/catalog/mappings` | `catalog_test_methods` | Mapping nền ↔ chỉ tiêu · `fetchMatrixMappingEditorAction` · panel tóm tắt |
| `/samples/assign` | `samples_assign` | **Phân công phòng ban** — nhóm chỉ tiêu → `AnalysisAssignment` (Lab Manager) |
| `/samples/tracking` | `samples_tracking` | Kanban trạng thái |
| `/samples/storage` | `samples_storage` | Lưu mẫu / hủy mẫu (QA approve) |
| `/samples/reports` | `samples_list` | Export CSV (chưa sidebar) |

### RBAC (6 keys)

| Key | Role defaults (tóm tắt) |
|-----|-------------------------|
| `samples_*` (all 6) | Admin · LabManager: **write** |
| `samples_list`, `samples_receive`, `samples_tracking` | Analyst: **write** |
| `samples_requests`, `samples_assign`, `samples_storage` | Analyst: **read** |
| all | QAQC: **read** · `samples_tracking` + `samples_storage`: **write** |
| all | Viewer: **read** |

Guard hành vi (`lib/actions/samples.ts`): phân công → `requireSessionCanManage` · hủy mẫu → `requireSessionCanApprove` · sửa mã mẫu → `requireSessionCanApprove`

### Prisma models (mới)

`SampleRequest`, `SampleRequestTest`, `SampleRequestMethod`, `Sample`, `SampleTest`, `SampleTestChemical`, `SampleTestStandard`, `SampleAuditLog`, `SampleStorageRecord`, `SampleCustodyEvent`

FK cross-module: `Sample`/`SampleTest` → `AnalyticalMethod`/`MethodVersion` · `SampleTest` → `Equipment` · junction → `Chemical`/`Standard` · `Sample` → `ChemicalReference`

### File chính

| Layer | Path |
|-------|------|
| Schema | `prisma/schema.prisma` (block Sample Reception) |
| Migration | `prisma/migrations/20260712_sample_reception/migration.sql` |
| Labels | `lib/sample-labels.ts` |
| Code gen | `lib/sample-code.ts` |
| Types | `types/samples.ts` |
| Mappers | `lib/mappers/samples.ts` |
| Validators | `lib/validators/samples.ts` |
| Services | `lib/services/samples/*.ts` (10 files) |
| Actions | `lib/actions/samples.ts` |
| Nav/RBAC | `lib/auth/nav-permissions.ts`, `lib/auth/permissions.ts`, `components/Sidebar.tsx` |
| Layout | `app/samples/layout.tsx`, `components/samples/SampleAppShell.tsx` |
| Pages | `app/samples/**` (11 routes) |
| Components | `components/samples/*.tsx` (12 files) |
| Tests | `scripts/test-sample-code-gen.ts`, `scripts/verify-sample-workflow.ts`, `scripts/verify-samples-seed.ts` |
| Demo seed | `prisma/seed-data/samples/sample-definitions.ts`, `seed-samples.ts`, `resolvers.ts`, `run-seed.ts` |
| Prod seed | `scripts/seed-samples-prod.ts` (permissions only) |

### Luồng nghiệp vụ

```
[Tùy chọn] Tạo phiếu YC (Draft → Submitted)
  → Tiếp nhận mẫu (sinh SPL-*) — liên kết PP / chem-info
  → Received → WaitingAssignment
  → Lab Manager: /samples/assign → AnalysisAssignment (phòng ban)
  → /analysis/inbox: lab tiếp nhận → AnalysisTask
  → /analysis/*: analyst → worklist → worksheet → results → QC → review
  → Sample: InAnalysis → WaitingReview → Completed (sync từ tasks)
  → Stored / Disposed (QA)
Từ chối: Received → Rejected (bắt buộc conditionNote)
```

### Setup local (chat mới)

```powershell
taskkill /F /IM node.exe 2>$null   # nếu EPERM prisma generate
npx prisma generate
npx prisma db push                 # hoặc migrate SQL 20260712
npm run db:seed                    # full seed incl. 10 PR/10 SPL demo
# hoặc: npx tsx prisma/seed-data/samples/run-seed.ts
npx tsx scripts/verify-samples-seed.ts
npm run dev
```

Mở http://localhost:3000/samples — login Admin/LabManager.

### Seed demo (`PR-20260629-*` / `SPL-20260629-*`)

| SPL | Tên | Trạng thái | Ghi chú |
|-----|-----|------------|---------|
| 0001 | Gạo trắng | Stored | Lưu mẫu · Aflatoxin + kim loại |
| 0002 | Bột mì | WaitingAssignment | Kanban · quá hạn |
| 0003 | Dầu ăn | WaitingAssignment | Phiếu Submitted |
| 0004 | Cá đông lạnh | Stored | -20°C |
| 0005 | Rau cải xanh | Assigned | NeedConfirmation |
| 0006 | Thịt gà tươi | InAnalysis | LC-MS + vi sinh |
| 0007 | TA viên heo | InAnalysis | Dinh dưỡng + độc tố |
| 0008 | Bột cá | Stored | Lưu mẫu |
| 0009 | Premix khoáng | Stored | Phiếu Completed · ICP |
| 0010 | Bắp hạt | Disposed | Hủy — ẩm mốc |

**Kanban:** 5 mẫu active (0002, 0003, 0005, 0006, 0007). **Storage picker:** 4 Stored (0001, 0004, 0008, 0009).

### Turso prod

- [ ] **`20260712_sample_reception`** — pending
  ```powershell
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260712_sample_reception/migration.sql
  $env:NODE_ENV="production"; npx tsx scripts/seed-samples-prod.ts
  ```

### QA browser checklist (smoke ✅ · E2E pending)

**Tiếp nhận cơ bản:**

- [x] Sidebar hiện nhóm **Tiếp nhận mẫu** (Admin/LabManager/Analyst)
- [ ] Tạo mẫu mới → mã `SPL-YYYYMMDD-0001` tăng tuần tự (test ngoài demo prefix)
- [ ] Từ chối/Không đạt không có lý do → validation error
- [x] Danh sách hiển thị 10 mẫu demo + liên kết PP

**Phiếu YC & phân công:**

- [x] `/samples/requests` — 10 phiếu PR-20260629-*
- [ ] Prefill từ phiếu (`/samples/receive?requestId=`) — tên mẫu + bảo quản
- [x] `/samples/assign` — chọn mẫu WA/Assigned
- [ ] Cảnh báo TB/HC quá hạn trên phân công
- [ ] Filter **Mẫu quá hạn** trên danh sách

**FSM & ISO:**

- [ ] Chuyển trạng thái sai FSM → bị chặn
- [ ] Hoàn thành khi thiếu PP/assignee → bị chặn
- [ ] Audit trail + chain of custody trên detail
- [x] `/samples/storage` — 4 mẫu Stored selectable
- [ ] In tem QR

**Kanban & RBAC:**

- [x] `/samples/tracking` — cột WA/Assigned/InAnalysis có mẫu (không toàn 0)
- [ ] Viewer: read-only · Analyst/LabManager workflow đầy đủ

---

## 11. Module Phân tích — handoff chi tiết (buổi 18)

### Kiến trúc

- **Tiếp nhận:** Lab Manager phân công phòng → `AnalysisAssignment` (status `assigned`)
- **Phân tích:** Lab tiếp nhận → `AnalysisTask` (1:1 assignment) · chuỗi worklist → worksheet → `TestResult` → `QcCheck` → review
- **`SampleTest`:** pool chỉ tiêu lúc tiếp nhận + legacy demo — **không** dùng phân công analyst/TB/HC ở `/samples/assign`
- **Sync Sample:** `lib/services/analysis/analysis-workflow.ts` — `syncSampleStatusFromTasks()` (InAnalysis / WaitingReview / Completed)
- **Code gen:** `lib/analysis-code.ts` — `WL-YYYYMMDD-0001`, `WS-YYYYMMDD-0001`

### Luồng trạng thái (tóm tắt)

| Sự kiện | Assignment | Task | Sample |
|---------|------------|------|--------|
| Lab tiếp nhận | `department_received` | `lab_accepted` | `InAnalysis` |
| Phân analyst | — | `analyst_assigned` | giữ |
| Vào worklist | — | `in_worklist` | giữ |
| Worksheet start | `department_processing` | `in_analysis` | giữ |
| Nhập kết quả | — | `result_entered` | giữ |
| QC đạt | — | `qc_checked` | giữ |
| Gửi duyệt | — | `submitted_for_review` | `WaitingReview` |
| Duyệt (all tasks) | — | `approved` | `Completed` |

### Routes

| Route | Permission key | Mô tả |
|-------|----------------|--------|
| `/analysis/inbox` | `analysis_inbox` | Assignment `assigned` — tiếp nhận / từ chối |
| `/analysis/assign-analyst` | `analysis_assign_analyst` | Task `lab_accepted` → gán analyst |
| `/analysis/worklists` | `analysis_worklist` | List + tạo worklist (inline form) |
| `/analysis/worklists/[id]` | `analysis_worklist` | Chi tiết worklist |
| `/analysis/worksheets` | `analysis_worksheet` | List worksheet |
| `/analysis/worksheets/[id]` | `analysis_worksheet` | Start/complete · HC/chuẩn/CRM |
| `/analysis/results` | `analysis_results` | Nhập kết quả theo chỉ tiêu |
| `/analysis/qc` | `analysis_qc` | QC checks |
| `/analysis/review` | `analysis_review` | Submit / duyệt / trả về |

### RBAC (7 keys)

| Role | Quyền gợi ý |
|------|-------------|
| Admin / LabManager | all `analysis_*` **write** |
| Analyst | inbox + assign-analyst **read** · worklist/worksheet/results **write** |
| QAQC | qc + review **write** · còn lại **read** |
| Viewer | all **read** |

### Prisma models (mới)

`LabDepartment`, `DepartmentManager`, `AnalysisAssignment`, `DepartmentAnalyst`, `AnalysisTask`, `AnalysisWorklist`, `AnalysisWorklistTask`, `AnalysisWorksheet`, `WorksheetChemical`, `WorksheetStandard`, `WorksheetCrm`, `TestResult`, `QcCheck`

Migrations:

- `prisma/migrations/20260629_analysis_assignment/migration.sql`
- `prisma/migrations/20260701_analysis_module/migration.sql`

### File chính

| Layer | Path |
|-------|------|
| Schema | `prisma/schema.prisma` (block Analysis) |
| Labels | `lib/analysis-labels.ts` |
| Code gen | `lib/analysis-code.ts` |
| Types | `types/analysis.ts` |
| Mappers | `lib/mappers/analysis.ts` |
| Validators | `lib/validators/analysis.ts` |
| Services | `lib/services/analysis/*.ts` (8 files) |
| Assign (samples) | `lib/services/samples/analysis-assignment.ts` |
| Actions | `lib/actions/analysis.ts` |
| Nav/RBAC | `lib/auth/nav-permissions.ts`, `lib/auth/permissions.ts`, `components/Sidebar.tsx` |
| Layout | `app/analysis/layout.tsx`, `components/analysis/AnalysisAppShell.tsx` |
| Pages | `app/analysis/**` (10 routes) |
| Components | `components/analysis/*.tsx` |
| Seed | `prisma/seed-data/lab-departments.ts`, `analysis-analysts.ts`, `analysis/demo-analysis.ts` |
| Scripts | `scripts/seed-analysis-only.ts`, `verify-analysis-module-seed.ts`, `smoke-analysis-pages.ts` |

### Setup local (chat mới)

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
npx prisma generate
npx prisma db push
npx tsx scripts/seed-analysis-only.ts
npx tsx scripts/smoke-analysis-pages.ts
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

### QA browser checklist (CLI smoke ✅ · E2E pending)

**Phân công & tiếp nhận:**

- [ ] `/samples/assign` — Lab Manager gán nhóm chỉ tiêu SPL-0003 → phòng ban
- [ ] `/analysis/inbox` — quản lý phòng tiếp nhận → task `lab_accepted`
- [ ] Từ chối inbox — bắt buộc lý do · không tạo task

**Chuỗi phân tích:**

- [ ] Phân analyst → tạo worklist (method `PP-ICP-WAT-001` + TB `EQ-ICP-001`)
- [ ] Worksheet start → nhập HC/chuẩn → complete
- [ ] Nhập kết quả → QC pass → gửi duyệt → duyệt
- [ ] `/samples/[id]` — status `Completed` · section phân công + tracking cập nhật

**RBAC & lỗi thường gặp:**

- [ ] Viewer: read-only trên `/analysis/*`
- [ ] QAQC: write trên QC + review
- [ ] Nếu `analysisWorklist undefined` → kill node · `prisma generate` · xóa `.next` · restart

### Turso prod

- [ ] **`20260629_analysis_assignment`** + **`20260701_analysis_module`** — pending
  ```powershell
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260629_analysis_assignment/migration.sql
  npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260701_analysis_module/migration.sql
  ```
- [ ] Seed permissions + demo (chưa có `seed-analysis-prod.ts` riêng — cần tạo hoặc mở rộng seed prod)

---

## 12. Recommended Next Prompt (archive chem-info)

```
Đọc HANDOFF.md (§ **Thông tin hóa học — handoff ngắn** + §5b–5c + §8 Pending).
QA: tab Khối lượng mol · tra cứu mobile · Pha loãng v2 · compatibility GROUP.
Commit buổi 7–11 + buổi 14 → push → redeploy.
Chỉ đọc file liên quan — không scan toàn repo.
```
