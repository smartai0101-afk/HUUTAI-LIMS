import { PreparedChemicalsClient } from "@/components/prepared-chemicals/PreparedChemicalsClient";
import { getChemicals } from "@/lib/services/chemicals";
import { getRecentEnvironmentalLogs } from "@/lib/services/environmental-logs";
import { getPreparedChemicals } from "@/lib/services/prepared-chemicals";
import { getActiveStaff } from "@/lib/services/staff";

export default async function Page() {
  const [items, chemicals, staff, environmentalLogs] = await Promise.all([
    getPreparedChemicals(),
    getChemicals(),
    getActiveStaff(),
    getRecentEnvironmentalLogs(),
  ]);
  return (
    <PreparedChemicalsClient
      items={items}
      chemicals={chemicals}
      staff={staff}
      environmentalLogs={environmentalLogs}
    />
  );
}
