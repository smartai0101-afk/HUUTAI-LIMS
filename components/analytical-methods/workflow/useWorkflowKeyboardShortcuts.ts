"use client";

import { useEffect } from "react";
import { handleWorkflowShortcut, type ShortcutHandlers } from "./useWorkflowShortcuts";

type Props = {
  enabled: boolean;
  handlers: ShortcutHandlers;
};

export function useWorkflowKeyboardShortcuts({ enabled, handlers }: Props) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      handleWorkflowShortcut(e, { enabled: true, handlers });
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled, handlers]);
}
