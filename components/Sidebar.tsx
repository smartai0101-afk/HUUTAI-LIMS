"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  FlaskConical,
  Menu,
  ScanLine,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import {
  getAdminNavItems,
  getEquipmentNavItems,
  getMaterialsNavItems,
} from "@/lib/auth/nav-permissions";
import { cn } from "@/lib/utils";

function isMaterialsRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = useSession();
  const [open, setOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [equipmentOpen, setEquipmentOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const visibleMaterials = useMemo(
    () => getMaterialsNavItems().filter((item) => hasPermission(item.key, "read")),
    [hasPermission],
  );
  const visibleEquipment = useMemo(
    () => getEquipmentNavItems().filter((item) => hasPermission(item.key, "read")),
    [hasPermission],
  );
  const visibleAdmin = useMemo(
    () => getAdminNavItems().filter((item) => hasPermission(item.key, "read")),
    [hasPermission],
  );

  useEffect(() => {
    const savedMaterials = localStorage.getItem("materials-nav-open");
    if (savedMaterials !== null) setMaterialsOpen(savedMaterials === "true");
    const savedEquipment = localStorage.getItem("equipment-nav-open");
    if (savedEquipment !== null) setEquipmentOpen(savedEquipment === "true");
    const savedAdmin = localStorage.getItem("admin-nav-open");
    if (savedAdmin !== null) setAdminOpen(savedAdmin === "true");
  }, []);

  const isMaterialsActive = visibleMaterials.some((item) => isMaterialsRoute(pathname, item.href));
  const isEquipmentActive = pathname.startsWith("/equipment");
  const isAdminActive = pathname.startsWith("/admin");

  const toggleMaterials = () => {
    setMaterialsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("materials-nav-open", String(next));
      return next;
    });
  };

  const toggleEquipment = () => {
    setEquipmentOpen((prev) => {
      const next = !prev;
      localStorage.setItem("equipment-nav-open", String(next));
      return next;
    });
  };

  const toggleAdmin = () => {
    setAdminOpen((prev) => {
      const next = !prev;
      localStorage.setItem("admin-nav-open", String(next));
      return next;
    });
  };

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lab</p>
            <h2 className="font-semibold text-white">Inventory LIMS</h2>
          </div>
        </div>
        <button className="text-slate-300 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {visibleMaterials.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={toggleMaterials}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isMaterialsActive
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <FlaskConical className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Hoá chất - Chuẩn - Chủng</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  materialsOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {materialsOpen ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                {visibleMaterials.map((item) => {
                  const isActive = isMaterialsRoute(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {visibleEquipment.length > 0 ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={toggleEquipment}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isEquipmentActive
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Thiết bị</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  equipmentOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {equipmentOpen ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                {visibleEquipment.map((item) => {
                  const isActive =
                    item.href === "/equipment"
                      ? pathname === "/equipment"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {visibleAdmin.length > 0 ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={toggleAdmin}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isAdminActive
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Quản trị</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  adminOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {adminOpen ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                {visibleAdmin.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs text-slate-400">System status</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-medium text-white">Operational</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
              Online
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-slate-950 lg:flex">
        {content}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 bg-slate-950 shadow-xl">{content}</aside>
        </div>
      ) : null}
    </>
  );
}
