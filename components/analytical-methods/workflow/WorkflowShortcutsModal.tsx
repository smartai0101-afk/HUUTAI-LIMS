"use client";

import { ModalShell } from "@/components/ModalShell";
import { isMacPlatform } from "./useWorkflowShortcuts";

const mod = isMacPlatform() ? "⌘" : "Ctrl";

const SHORTCUTS = [
  { keys: `${mod}+Z`, description: "Hoàn tác" },
  { keys: `${mod}+Shift+Z`, description: "Làm lại" },
  { keys: `${mod}+Y`, description: "Làm lại" },
  { keys: `${mod}+S`, description: "Lưu workflow" },
  { keys: `${mod}+C`, description: "Copy bước đang chọn" },
  { keys: `${mod}+V`, description: "Dán bước" },
  { keys: `${mod}+D`, description: "Nhân đôi bước" },
  { keys: "Delete / Backspace", description: "Xóa bước hoặc cạnh đang chọn" },
  { keys: `${mod}+A`, description: "Chọn tất cả bước" },
  { keys: `${mod}+0`, description: "Reset zoom 100%" },
  { keys: `${mod}+ +`, description: "Phóng to" },
  { keys: `${mod}+ -`, description: "Thu nhỏ" },
  { keys: "Esc", description: "Bỏ chọn" },
  { keys: "Shift + Click", description: "Thêm vào vùng chọn" },
  { keys: `${mod} + Click`, description: "Bật/tắt chọn bước" },
  { keys: "Kéo vùng", description: "Chọn nhiều bước" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WorkflowShortcutsModal({ open, onClose }: Props) {
  return (
    <ModalShell open={open} onClose={onClose} className="w-full max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Phím tắt flowchart</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Đóng
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Phím</th>
              <th className="pb-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((row) => (
              <tr key={row.keys} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-mono text-xs text-slate-800">{row.keys}</td>
                <td className="py-2 text-slate-600">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}
