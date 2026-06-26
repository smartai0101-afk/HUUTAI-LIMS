import { PreparedStandardsClient } from "@/components/prepared-standards/PreparedStandardsClient";
import {
  getPreparedStandardCatalog,
  getPreparedStandards,
} from "@/lib/services/prepared-standards";
import { getActiveStaff } from "@/lib/services/staff";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [items, catalog, staff] = await Promise.all([
    getPreparedStandards(),
    getPreparedStandardCatalog(),
    getActiveStaff(),
  ]);
  return (
    <PreparedStandardsClient
      items={items}
      standards={catalog.standards}
      preparedStandards={catalog.preparedStandards}
      levelCounts={catalog.levelCounts}
      chemicals={catalog.chemicals}
      staff={staff}
    />
  );
}
