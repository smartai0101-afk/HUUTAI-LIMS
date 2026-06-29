import { SampleStorageClient } from "@/components/samples/SampleStorageClient";
import { getSessionUser } from "@/lib/auth/session";
import { listSamplesForStorage } from "@/lib/services/samples/sample-list";

export const dynamic = "force-dynamic";

export default async function SampleStoragePage() {
  const [samples, session] = await Promise.all([listSamplesForStorage(), getSessionUser()]);
  return (
    <SampleStorageClient
      samples={samples}
      defaultStoredBy={session?.name ?? ""}
      defaultDisposedBy={session?.name ?? ""}
    />
  );
}
