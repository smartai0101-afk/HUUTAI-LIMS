"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Beaker,
  Boxes,
  ChartColumn,
  FlaskConical,
  ShieldCheck,
  Syringe,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AlertPanel } from "@/components/AlertPanel";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { alerts, chemicals, solutions, standards, transactions } from "@/lib/data";
import { formatDate } from "@/lib/utils";

const inventoryGroups = [
  { label: "Hoá chất", value: 78, color: "bg-cyan-500" },
  { label: "Chất chuẩn", value: 64, color: "bg-emerald-500" },
  { label: "Dung dịch chuẩn", value: 52, color: "bg-violet-500" },
];

export default function Home() {
  const lowStock = chemicals.filter(
    (item) => item.status === "Low Stock" || item.status === "Expired",
  ).length;
  const expiringSoon = chemicals.filter((item) => {
    const diff = new Date(item.expiryDate).getTime() - Date.now();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const pendingDisposal = chemicals.filter((item) => item.status === "Pending Disposal").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Overview</p>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <ChartColumn className="h-4 w-4" />
            Generate report
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard title="Tổng hoá chất" value={`${chemicals.length}`} change="↑ 8.2% vs last week" icon={Beaker} />
          <StatCard title="Tổng chất chuẩn" value={`${standards.length}`} change="↑ 3.1%" icon={ShieldCheck} />
          <StatCard title="Dung dịch chuẩn" value={`${solutions.length}`} change="5 active" icon={FlaskConical} />
          <StatCard title="Sắp hết hạn" value={`${expiringSoon}`} change="2 urgent" icon={AlertTriangle} tone="warning" />
          <StatCard title="Tồn kho thấp" value={`${lowStock}`} change="Review needed" icon={Boxes} tone="warning" />
          <StatCard title="Chờ huỷ" value={`${pendingDisposal}`} change="1 today" icon={Syringe} tone="danger" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Inventory mix</p>
                <h3 className="mt-1 font-semibold text-slate-900">Tồn kho theo nhóm</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +5.4%
              </span>
            </div>
            <div className="mt-5 flex items-end gap-3">
              {inventoryGroups.map((group) => (
                <div key={group.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-52 w-full items-end rounded-2xl bg-slate-50 p-3">
                    <div className={`${group.color} w-full rounded-xl`} style={{ height: `${group.value}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{group.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Compliance status</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "COA completeness", value: "92%", tone: "bg-emerald-500", width: "92%" },
                  { label: "SDS completeness", value: "88%", tone: "bg-cyan-500", width: "88%" },
                  { label: "Expiry risk", value: "6 items", tone: "bg-amber-500", width: "55%" },
                  { label: "Low stock", value: "3 items", tone: "bg-rose-500", width: "40%" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.tone}`} style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Critical actions</h3>
              <div className="mt-3 space-y-2">
                {[
                  "Review 2 expired standards",
                  "Approve 3 pending solutions",
                  "Recount shelf A1-03",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  >
                    <span>{item}</span>
                    <button type="button" className="font-medium text-cyan-700">
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent activity</h3>
              <span className="text-sm text-slate-500">Today</span>
            </div>
            <div className="mt-4 space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{tx.itemName}</p>
                    <p className="text-sm text-slate-500">
                      {tx.performedBy} · {tx.purpose}
                    </p>
                  </div>
                  <StatusBadge status={tx.type} />
                </div>
              ))}
            </div>
          </div>

          <AlertPanel alerts={alerts.slice(0, 5)} />
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Critical inventory</h3>
          <DataTable
            columns={[
              { key: "code", header: "Mã" },
              { key: "name", header: "Tên" },
              { key: "quantity", header: "Tồn kho" },
              { key: "expiryDate", header: "Hạn dùng", render: (value) => formatDate(String(value)) },
              { key: "status", header: "Trạng thái", render: (value) => <StatusBadge status={String(value)} /> },
            ]}
            rows={chemicals.filter((item) => item.status !== "Available")}
          />
        </div>
      </div>
    </AppShell>
  );
}
