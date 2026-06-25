import { PreparedChemicalsClient } from "@/components/prepared-chemicals/PreparedChemicalsClient";
import { getChemicals } from "@/lib/services/chemicals";
import { getPreparedChemicals } from "@/lib/services/prepared-chemicals";

export default async function Page() {
  const [items, chemicals] = await Promise.all([getPreparedChemicals(), getChemicals()]);
  return <PreparedChemicalsClient items={items} chemicals={chemicals} />;
}
