import { Suspense } from "react";
import { RequestLineReceivePanel } from "@/components/samples/RequestLineReceivePanel";
import { SampleReceiveClient } from "@/components/samples/SampleReceiveClient";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSampleRequestDetail,
  getSampleRequestPrefill,
} from "@/lib/services/samples/sample-requests";
import { listRequestSampleLines } from "@/lib/services/samples/request-sample-lines";
import {
  listChemicalReferenceOptions,
  listMethodOptions,
} from "@/lib/services/samples/sample-detail";

export const dynamic = "force-dynamic";

export default async function SampleReceivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestId = typeof params.requestId === "string" ? params.requestId : undefined;
  const [session, methodOptions, chemicalReferences, prefill, requestDetail, requestLines] =
    await Promise.all([
      getSessionUser(),
      listMethodOptions(),
      listChemicalReferenceOptions(),
      requestId ? getSampleRequestPrefill(requestId) : Promise.resolve(null),
      requestId ? getSampleRequestDetail(requestId) : Promise.resolve(null),
      requestId ? listRequestSampleLines(requestId) : Promise.resolve([]),
    ]);

  const receivedCount = requestLines.filter((l) => l.status === "received").length;

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <div className="space-y-6">
        {requestDetail && requestLines.length > 0 ? (
          <RequestLineReceivePanel
            requestId={requestDetail.id}
            requestCode={requestDetail.requestCode}
            sampleCount={requestDetail.sampleCount}
            receivedCount={receivedCount}
            lines={requestLines}
            defaultReceivedBy={session?.name ?? ""}
          />
        ) : null}
        <SampleReceiveClient
          methodOptions={methodOptions}
          chemicalReferences={chemicalReferences}
          prefill={prefill}
          defaultReceivedBy={session?.name ?? ""}
        />
      </div>
    </Suspense>
  );
}
