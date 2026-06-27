import { EnvironmentalLogsClient } from "@/components/environment/EnvironmentalLogsClient";
import { getEnvironmentalLogs } from "@/lib/services/environmental-logs";
import { getActiveStaff } from "@/lib/services/staff";

export const dynamic = "force-dynamic";

export default async function EnvironmentLogsPage() {
  const [items, staff] = await Promise.all([getEnvironmentalLogs(), getActiveStaff()]);
  return <EnvironmentalLogsClient items={items} staff={staff} />;
}
