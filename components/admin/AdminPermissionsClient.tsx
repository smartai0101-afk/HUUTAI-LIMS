"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import {
  saveUserPermissions,
  type PermissionAssignmentView,
} from "@/lib/actions/admin-permissions";

export function AdminPermissionsClient({ assignments }: { assignments: PermissionAssignmentView[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, startTransition] = useTransition();

  const save = (userId: string, form: HTMLFormElement) => {
    const fd = new FormData(form);
    fd.set("userId", userId);
    startTransition(async () => {
      const result = await saveUserPermissions(fd);
      if (result.error) {
        addToast(result.error, "error");
        return;
      }
      addToast("Đã lưu quyền", "success");
      router.refresh();
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Administration</p>
          <h1 className="text-2xl font-semibold text-slate-900">Gán chức năng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quyền mặc định theo role + tick thêm quyền bổ sung (Admin bypass).
          </p>
        </div>

        <div className="space-y-4">
          {assignments.map((item) => (
            <form
              key={item.userId}
              onSubmit={(e) => {
                e.preventDefault();
                save(item.userId, e.currentTarget);
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{item.userName}</p>
                  <p className="text-sm text-slate-500">
                    {item.userEmail} · {item.role}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Lưu
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {item.groups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {group.label}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            name={`perm_${perm.key}`}
                            defaultChecked={perm.granted}
                            className="rounded border-slate-300"
                          />
                          {perm.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </form>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
