import { ReceptionLogClient } from "@/components/samples/ReceptionLogClient";
import { listReceptionLogEvents } from "@/lib/services/workflow-orchestrator";

export const dynamic = "force-dynamic";

export default async function ReceptionLogPage() {
  const events = await listReceptionLogEvents();
  return <ReceptionLogClient events={events} timeline={[]} />;
}
