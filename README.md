# Lab Inventory LIMS

Hệ thống quản lý tồn kho phòng thí nghiệm — hoá chất, chuẩn, chủng vi sinh, pha chế, thiết bị. Next.js 16 App Router + Prisma (SQLite dev / Turso prod) + JWT RBAC.

## Tech stack

- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS 4
- Prisma ORM — SQLite (local) / Turso libSQL (production)
- JWT session + 25 quyền sidebar

## Cài đặt & chạy

```bash
npm install
npx prisma generate
npm run db:seed   # tùy chọn — dữ liệu demo
npm run dev
```

Mở http://localhost:3000 — đăng nhập seed: `smartai0101@gmail.com` / `Admin@123456`

## Routes chính

| Nhóm | Routes |
|------|--------|
| Vật tư | `/`, `/stock-in`, `/chemicals`, `/standards`, `/microbial-strains`, `/prepared-*`, `/containers`, `/usage-logs`, `/inventory-ledger`, `/reports` |
| Thiết bị | `/equipment/*` |
| Quản trị | `/admin/people`, `/admin/permissions`, `/admin/tasks` |

Legacy MVP (`/solutions`, `/transactions`, `/inventory`, `/alerts`) redirect sang module Prisma tương ứng.

## Production

- Deploy: Vercel project `huutai-lims-m929`
- Env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` (cảnh báo chủ động)
- Chi tiết: [DEPLOY.md](DEPLOY.md)

## Kiểm tra

```bash
npx tsc --noEmit
npm run build
```
