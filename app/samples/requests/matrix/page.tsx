import Link from "next/link";
import { listSampleRequests } from "@/lib/services/samples/sample-requests";

export const dynamic = "force-dynamic";

export default async function RequestMatrixPickerPage() {
  const { items } = await listSampleRequests({
    q: "",
    status: "All",
    sortBy: "requestDate",
    sortOrder: "desc",
    page: 1,
    limit: 30,
    sortActive: false,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Ma trận mẫu – chỉ tiêu</h1>
      <p className="text-sm text-slate-500">Chọn phiếu yêu cầu để xem/chỉnh ma trận.</p>
      <ul className="divide-y rounded-2xl border border-slate-200 bg-white">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{r.requestCode}</p>
              <p className="text-xs text-slate-500">
                {r.requesterName} · {r.sampleCount} mẫu
              </p>
            </div>
            <Link
              href={`/samples/requests/${r.id}/matrix`}
              className="rounded-lg border border-cyan-200 px-3 py-1.5 text-sm text-cyan-800"
            >
              Mở ma trận
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
