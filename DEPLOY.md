# Deploy Lab Inventory LIMS — Vercel + Turso

> **Dự án:** Next.js 16 · Prisma · Auth JWT · DB production = **Turso (libSQL)**  
> **URL prod hiện có (nếu đã deploy trước):** https://huutai-lims-m929.vercel.app  
> **Build:** `npm run build` · **Output:** `.next` (full-stack, không phải static)

---

## Tổng quan (5 bước)

```text
Turso: tạo DB + lấy URL/token
   ↓
Local: set env → npm run db:setup-remote (schema + seed)
   ↓
Vercel: import repo → thêm 3 env vars → Deploy
   ↓
Mở URL → login Admin → kiểm tra sidebar
   ↓
(C tuỳ chọn) Gắn domain riêng
```

---

## Bước 1 — Turso: tạo database

1. Đăng nhập https://turso.tech/app
2. **Create database** (hoặc chọn DB đã có)
3. Vào database → tab **Connect** / **Database URL**:
   - Copy URL dạng: `libsql://tên-db-org.turso.io`
4. Tab **Tokens** → **Create token** → copy token (chỉ hiện 1 lần — lưu lại)

**Lưu ý:** Free tier đủ cho lab nhỏ (vài user, SQLite-compatible).

---

## Bước 2 — Local: cấu hình env + push schema

### 2.1 Tạo / cập nhật file `.env`

Copy từ [`.env.example`](.env.example). **Production cần:**

```env
# Turso (bắt buộc cho setup remote + Vercel runtime)
TURSO_DATABASE_URL="libsql://YOUR-DB.turso.io"
TURSO_AUTH_TOKEN="YOUR_TOKEN"

# Dùng cho prisma db push / seed từ máy local
DATABASE_URL="libsql://YOUR-DB.turso.io?authToken=YOUR_TOKEN"

# Auth (bắt buộc trên Vercel — dùng CÙNG giá trị khi deploy)
SESSION_SECRET="chuoi-ngau-nhien-it-nhat-32-ky-tu"
SESSION_MAX_AGE=604800
```

Tạo `SESSION_SECRET` nhanh (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### 2.2 Push schema + seed lên Turso (chạy 1 lần, hoặc khi đổi schema)

```powershell
cd C:\Users\admin\Documents\Codex\2026-06-16\lab-inventory-lims

# Nếu chưa set trong .env, set tạm trong session:
# $env:TURSO_DATABASE_URL="libsql://..."
# $env:TURSO_AUTH_TOKEN="..."
# $env:DATABASE_URL="libsql://...?authToken=..."

npm run db:setup-remote
```

Kết quả OK:
- `Pushing schema to remote database...` → thành công
- `Seeding remote database...` → `Seed completed.`

**Tài khoản sau seed:**
| Email | Mật khẩu | Role |
|-------|----------|------|
| `smartai0101@gmail.com` | `Admin@123456` | Admin |
| `viewer@demo.local` | `Demo@123456` | Viewer |

---

## Bước 3 — Vercel: deploy

### Cách A — GitHub (khuyến nghị, tự deploy khi push)

1. Push code lên GitHub (repo private/public đều được)
2. https://vercel.com/new → **Import** repository `lab-inventory-lims`
3. **Framework Preset:** Next.js (tự detect)
4. **Build Command:** `npm run build` (mặc định)
5. **Install Command:** `npm install` (mặc định — có `postinstall: prisma generate`)
6. **Root Directory:** `./` (mặc định)

**Chưa bấm Deploy** — thêm Environment Variables trước:

| Name | Value | Environment |
|------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://xxx.turso.io` | Production, Preview, Development |
| `TURSO_AUTH_TOKEN` | token Turso | Production, Preview, Development |
| `SESSION_SECRET` | **cùng** chuỗi trong `.env` local | Production, Preview, Development |
| `SESSION_MAX_AGE` | `604800` | (tuỳ chọn) |

7. **Deploy**
8. Đợi build xong → mở URL `https://xxx.vercel.app`

### Cách B — Vercel CLI (không cần Git)

```powershell
npm i -g vercel
cd C:\Users\admin\Documents\Codex\2026-06-16\lab-inventory-lims

vercel login
vercel link          # chọn team + project (hoặc tạo mới)

vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add SESSION_SECRET production

vercel --prod
```

### Cập nhật project Vercel đã có (`huutai-lims-m929`)

1. Vercel Dashboard → project **huutai-lims-m929**
2. **Settings → Environment Variables** → thêm / sửa 3 biến trên nếu thiếu
3. **Deployments → Redeploy** (chọn deployment mới nhất → ⋮ → Redeploy)

---

## Bước 4 — Kiểm tra production

1. Mở `https://YOUR-APP.vercel.app/login`
2. Login: `smartai0101@gmail.com` / `Admin@123456`
3. Kiểm tra:
   - Topbar: **System Admin** + nút **Đăng xuất**
   - Sidebar: 3 nhóm (Hoá chất… · Thiết bị · Quản trị)
4. Thử `/stock-in`, `/equipment/catalog` → HTTP 200

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| Login 500 / server error | Chưa seed Turso hoặc thiếu env | Chạy `npm run db:setup-remote` + set env Vercel + Redeploy |
| `SESSION_SECRET must be set` | Thiếu env trên Vercel | Thêm `SESSION_SECRET` ≥ 16 ký tự → Redeploy |
| Sidebar trống | Cookie JWT cũ / session lệch | Đăng xuất hoặc `/login?reason=session` → login lại |
| Build fail trên Vercel | Prisma / TypeScript | Chạy `npm run build` local trước, sửa lỗi, push lại |

---

## Bước 5 — Domain riêng (tuỳ chọn)

1. Vercel → Project → **Settings → Domains** → Add domain (vd. `lims.congty.com`)
2. Vercel hiện DNS cần cấu hình:

**Subdomain** (`lims.congty.com`):
```text
Type: CNAME
Name: lims
Value: cname.vercel-dns.com
```

**Apex** (`congty.com`):
```text
Type: A
Name: @
Value: 76.76.21.21
```

3. Cấu hình tại nhà cung cấp domain (Cloudflare, Namecheap, …)
4. Đợi DNS propagate (5 phút – 48h) → Vercel tự cấp HTTPS

---

## Cập nhật website (phiên bản mới)

### Code thay đổi (không đổi DB)

```powershell
git add .
git commit -m "Mô tả thay đổi"
git push origin main
```

→ Vercel tự build + deploy (nếu đã link GitHub).

Hoặc: `vercel --prod`

### Có thay đổi Prisma schema

```powershell
# Local, env trỏ Turso
npm run db:setup-remote
git push origin main
```

---

## Checklist trước go-live

- [ ] `npm run build` pass trên máy local (tắt `npm run dev` trước nếu EPERM prisma)
- [ ] Turso DB đã `db:setup-remote`
- [ ] Vercel có `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`
- [ ] Login prod OK, sidebar đủ menu
- [ ] **Đổi mật khẩu Admin** sau go-live (trang `/admin/people` hoặc seed lại)

---

## Tại sao Vercel + Turso (không Netlify static / VPS)?

- Next.js 16 + Server Actions + middleware → Vercel native
- SQLite file (`dev.db`) **không** chạy trên serverless → Turso libSQL
- Code đã có adapter trong [`lib/db.ts`](lib/db.ts) và script [`scripts/setup-vercel-db.ts`](scripts/setup-vercel-db.ts)
- Miễn phí tier đủ demo / lab nội bộ
