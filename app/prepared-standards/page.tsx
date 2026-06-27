import { PreparedStandardsClient } from "@/components/prepared-standards/PreparedStandardsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-options";
import { getRecentEnvironmentalLogs } from "@/lib/services/environmental-logs";
import {
  getPreparedStandardCatalog,
  getPreparedStandards,
} from "@/lib/services/prepared-standards";
import { getActiveStaff } from "@/lib/services/staff";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [items, catalog, staff, equipmentOptions, environmentalLogs] = await Promise.all([
    getPreparedStandards(),
    getPreparedStandardCatalog(),
    getActiveStaff(),
    getEquipmentOptions(),
    getRecentEnvironmentalLogs(),
  ]);
  return (
    <PreparedStandardsClient
      items={items}
      standards={catalog.standards}
      preparedStandards={catalog.preparedStandards}
      levelCounts={catalog.levelCounts}
      chemicals={catalog.chemicals}
      staff={staff}
      equipmentOptions={equipmentOptions}
      environmentalLogs={environmentalLogs}
    />
  );
}
