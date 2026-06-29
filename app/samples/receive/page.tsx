import { Suspense } from "react";
import { SampleReceiveClient } from "@/components/samples/SampleReceiveClient";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSampleRequestPrefill,
} from "@/lib/services/samples/sample-requests";
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
  const [session, methodOptions, chemicalReferences, prefill] = await Promise.all([
    getSessionUser(),
    listMethodOptions(),
    listChemicalReferenceOptions(),
    requestId ? getSampleRequestPrefill(requestId) : Promise.resolve(null),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SampleReceiveClient
        methodOptions={methodOptions}
        chemicalReferences={chemicalReferences}
        prefill={prefill}
        defaultReceivedBy={session?.name ?? ""}
      />
    </Suspense>
  );
}
