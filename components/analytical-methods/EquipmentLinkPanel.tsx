"use client";

import { useRouter } from "next/navigation";
import {
  deleteMethodEquipmentAction,
  saveMethodEquipmentAction,
} from "@/lib/actions/method-execution";
import type { MethodEquipmentView } from "@/types/analytical-methods";
import type { EquipmentWarning } from "@/lib/services/analytical-methods/method-equipment-check";

type Props = {
  methodId: string;
  equipment: MethodEquipmentView[];
  warnings: EquipmentWarning[];
  editable: boolean;
};

export function EquipmentLinkPanel({ methodId, equipment, warnings, editable }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {warnings.map((w) => (
            <p key={w.equipmentId}>
              <strong>{w.equipmentCode}</strong> ({w.equipmentName}): {w.warnings.join("; ")}
            </p>
          ))}
        </div>
      ) : null}

      {editable ? (
        <form
          className="rounded-2xl border bg-white p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const result = await saveMethodEquipmentAction(methodId, fd);
            if (result.error) alert(result.error);
            else router.refresh();
            e.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">Liên kết thiết bị</h2>
          <input name="equipmentId" placeholder="Equipment ID (từ danh mục TB)" className="w-full rounded-lg border px-2 py-1" required />
          <input name="role" placeholder="Vai trò (cân, HPLC, GC...)" className="w-full rounded-lg border px-2 py-1" />
          <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white">
            Thêm thiết bị
          </button>
        </form>
      ) : null}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Thiết bị liên quan</h2>
        <ul className="space-y-2 text-sm">
          {equipment.map((e) => (
            <li key={e.id} className="flex justify-between gap-2 border-b pb-2">
              <span>
                {e.equipmentCode} — {e.equipmentName}
                {e.role ? ` (${e.role})` : ""} · HC: {e.calibrationStatus}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await deleteMethodEquipmentAction(methodId, e.id);
                    router.refresh();
                  }}
                >
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
          {equipment.length === 0 ? <li className="text-slate-500">Chưa liên kết thiết bị</li> : null}
        </ul>
      </div>
    </div>
  );
}
