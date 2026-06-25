# Lab Inventory LIMS

MVP quản lý tồn kho phòng kiểm nghiệm — hoá chất, chất chuẩn, dung dịch chuẩn. Lấy cảm hứng từ tư duy enterprise LIMS (dashboard, workflow, traceability, audit trail, compliance) với giao diện riêng, không sao chép LabWare.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Lucide React icons
- localStorage (mock data, không backend)

## Cài đặt & chạy

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

Build production:

```bash
npm run build
npm start
```

## Routes

| Route | Mô tả |
|-------|--------|
| `/` | Dashboard — KPI, alerts, compliance, critical inventory |
| `/chemicals` | Quản lý hoá chất |
| `/standards` | Quản lý chất chuẩn (CRM/RM/Working) |
| `/solutions` | Dung dịch chuẩn + workflow duyệt |
| `/transactions` | Nhập/Xuất/Sử dụng/Huỷ |
| `/inventory` | Kiểm kê + QR giả lập |
| `/alerts` | Cảnh báo + View item / Mark reviewed |
| `/reports` | Báo cáo + audit trail |

## Role giả lập

Chọn role ở topbar (user mặc định: **QC Analyst**):

| Role | Quyền |
|------|--------|
| **Admin** | Toàn quyền |
| **Lab Manager** | Toàn quyền quản lý (delete/dispose) |
| **Analyst** | Thêm/sửa inventory, không delete/dispose |
| **QA/QC** | Chỉ xem inventory; xem audit trail & báo cáo |
| **Viewer** | Chỉ xem, không thêm/sửa/xoá |

## Tính năng chính

- Dashboard 6 KPI cards (gồm Dung dịch chuẩn)
- CRUD hoá chất / chất chuẩn / dung dịch với localStorage
- DetailDrawer 2 cột (split/stacked) + tabs COA/SDS/Audit/Label
- Form validation + toast notifications
- Export CSV trên mọi trang danh sách
- Alert panel với View item & Mark reviewed
- Audit trail component
- Label preview với QR placeholder

## Cấu trúc thư mục

```
app/           — Pages (App Router)
components/    — AppShell, Sidebar, Topbar, DetailDrawer, ...
lib/           — data.ts, storage.ts, utils.ts
types.ts       — TypeScript interfaces
```

## Reset dữ liệu

Xoá localStorage keys `lims_*` trong DevTools → Application → Local Storage.
