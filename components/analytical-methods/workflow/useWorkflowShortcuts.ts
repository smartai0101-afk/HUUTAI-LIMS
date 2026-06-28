export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function isModKey(e: KeyboardEvent): boolean {
  return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

export type ShortcutHandlers = {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
};

export type ShortcutOptions = {
  enabled?: boolean;
  handlers: ShortcutHandlers;
};

export function handleWorkflowShortcut(e: KeyboardEvent, options: ShortcutOptions): boolean {
  if (!options.enabled) return false;
  if (isEditableTarget(e.target)) return false;

  const mod = isModKey(e);

  if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    options.handlers.onUndo?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "z" && e.shiftKey) {
    e.preventDefault();
    options.handlers.onRedo?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "y") {
    e.preventDefault();
    options.handlers.onRedo?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "s") {
    e.preventDefault();
    options.handlers.onSave?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "c") {
    e.preventDefault();
    options.handlers.onCopy?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "v") {
    e.preventDefault();
    options.handlers.onPaste?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "d") {
    e.preventDefault();
    options.handlers.onDuplicate?.();
    return true;
  }
  if (mod && e.key.toLowerCase() === "a") {
    e.preventDefault();
    options.handlers.onSelectAll?.();
    return true;
  }
  if (mod && (e.key === "=" || e.key === "+")) {
    e.preventDefault();
    options.handlers.onZoomIn?.();
    return true;
  }
  if (mod && e.key === "-") {
    e.preventDefault();
    options.handlers.onZoomOut?.();
    return true;
  }
  if (mod && e.key === "0") {
    e.preventDefault();
    options.handlers.onResetZoom?.();
    return true;
  }
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    options.handlers.onDelete?.();
    return true;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    options.handlers.onClearSelection?.();
    return true;
  }

  return false;
}
