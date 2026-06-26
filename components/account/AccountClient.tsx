"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import {
  removeAvatar,
  updateAvatar,
  updatePassword,
  updateProfile,
  type AccountProfile,
} from "@/lib/actions/account";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AccountClient({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setName(profile.name);
  }, [profile.name, profile.avatarUrl]);

  const initials = useMemo(() => initialsFromName(name || profile.name), [name, profile.name]);

  const saveProfile = () => {
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã cập nhật tên hiển thị", "success");
      router.refresh();
    });
  };

  const onAvatarSelected = (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("avatar", file);
    startTransition(async () => {
      const result = await updateAvatar(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã cập nhật ảnh đại diện", "success");
      router.refresh();
    });
  };

  const onRemoveAvatar = () => {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã xóa ảnh đại diện", "success");
      router.refresh();
    });
  };

  const savePassword = () => {
    const fd = new FormData();
    fd.set("currentPassword", currentPassword);
    fd.set("newPassword", newPassword);
    fd.set("confirmPassword", confirmPassword);
    startTransition(async () => {
      const result = await updatePassword(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Đã đổi mật khẩu", "success");
    });
  };

  const displayAvatar = profile.avatarUrl;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm text-slate-500">Cài đặt</p>
          <h1 className="text-2xl font-semibold text-slate-900">Tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý hồ sơ cá nhân, ảnh đại diện và mật khẩu của bạn.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ảnh đại diện</h2>
          <p className="mt-1 text-sm text-slate-500">JPG, PNG hoặc WebP — tối đa 2MB.</p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-cyan-500 text-2xl font-semibold text-white">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                initials || <User className="h-10 w-10" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onAvatarSelected(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                Tải ảnh lên
              </button>
              {displayAvatar ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onRemoveAvatar}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa ảnh
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h2>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-slate-700">
                Tên hiển thị
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div>
              <label htmlFor="account-email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="account-email"
                value={profile.email}
                readOnly
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">Liên hệ Admin nếu cần đổi email.</p>
            </div>
            <div>
              <label htmlFor="account-role" className="block text-sm font-medium text-slate-700">
                Vai trò
              </label>
              <input
                id="account-role"
                value={profile.role}
                readOnly
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
              />
            </div>
            <button
              type="button"
              disabled={pending || name === profile.name}
              onClick={saveProfile}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Lưu thông tin
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Bảo mật</h2>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-slate-700">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={savePassword}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Đổi mật khẩu
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
