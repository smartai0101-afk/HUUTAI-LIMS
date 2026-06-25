import { PreparedStandardsClient } from "@/components/prepared-standards/PreparedStandardsClient";
import {
  getPreparedStandardCatalog,
  getPreparedStandards,
} from "@/lib/services/prepared-standards";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [items, catalog] = await Promise.all([getPreparedStandards(), getPreparedStandardCatalog()]);
  return (
    <PreparedStandardsClient
      items={items}
      standards={catalog.standards}
      preparedStandards={catalog.preparedStandards}
      levelCounts={catalog.levelCounts}
      chemicals={catalog.chemicals}
    />
  );
}
