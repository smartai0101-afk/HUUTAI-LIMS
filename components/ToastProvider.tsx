"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => undefined,
});

function iconFor(type: ToastType) {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "error":
      return AlertCircle;
    default:
      return Info;
  }
}

function toneFor(type: ToastType) {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const duration = latest.message.includes("\n") ? 9000 : 3200;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, duration);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((current) => [...current, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = iconFor(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-lg ${toneFor(toast.type)}`}
            >
              <div className="mt-0.5 rounded-xl bg-white/50 p-1.5">
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 whitespace-pre-line text-sm font-medium">{toast.message}</p>
              <button onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
