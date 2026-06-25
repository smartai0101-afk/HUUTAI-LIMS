import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function AccessDeniedPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tài khoản của bạn không có quyền xem trang này. Liên hệ Admin để được cấp quyền.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            Về Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
