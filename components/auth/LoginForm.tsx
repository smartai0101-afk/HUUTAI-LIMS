"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ScanLine } from "lucide-react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <ScanLine className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lab</p>
            <h1 className="text-xl font-semibold text-white">Inventory LIMS</h1>
          </div>
        </div>

        <h2 className="text-lg font-medium text-white">Đăng nhập</h2>
        <p className="mt-1 text-sm text-slate-400">Nhập email và mật khẩu tài khoản lab</p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirect" value={from} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-500"
              placeholder="smartai0101@gmail.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          {state?.error ? (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Admin seed: smartai0101@gmail.com / Admin@123456
        </p>
      </div>
    </div>
  );
}
