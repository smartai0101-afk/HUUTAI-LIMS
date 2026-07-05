"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function AppShell({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 xl:p-8">
          <div className={fullWidth ? "mx-auto w-full max-w-[1600px]" : "mx-auto w-full max-w-7xl"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
