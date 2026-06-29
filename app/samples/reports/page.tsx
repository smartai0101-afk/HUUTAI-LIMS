import { exportSampleReceptionReport } from "@/lib/services/samples/sample-storage";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(String(r[h] ?? ""))).join(","))].join("\n");
}

export default async function SampleReportsPage() {
  const rows = await exportSampleReceptionReport();
  const csv = toCsv(rows);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Báo cáo tiếp nhận mẫu</h1>
        <p className="text-sm text-slate-500">Xuất danh sách mẫu đã tiếp nhận (CSV)</p>
      </div>
      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
        download="sample-reception-report.csv"
        className="inline-flex rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white"
      >
        Tải CSV ({rows.length} dòng)
      </a>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {rows[0] ? Object.keys(rows[0]).map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>) : null}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Object.values(row).map((v, j) => (
                  <td key={j} className="px-3 py-2">{String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
