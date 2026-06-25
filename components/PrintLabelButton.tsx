"use client";

import { Printer } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import {
  POPUP_BLOCKED_MESSAGE,
  printPreparedLabel,
  type LabelTemplate,
  type PrintLabelData,
} from "@/lib/print-label";

interface PrintLabelButtonProps {
  template: LabelTemplate;
  data: PrintLabelData;
  className?: string;
}

export function PrintLabelButton({ template, data, className }: PrintLabelButtonProps) {
  const { addToast } = useToast();

  const handlePrint = () => {
    const result = printPreparedLabel(template, data);
    if (!result.ok) {
      addToast(POPUP_BLOCKED_MESSAGE, "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
      }
    >
      <Printer className="h-4 w-4" />
      In tem nhãn
    </button>
  );
}
