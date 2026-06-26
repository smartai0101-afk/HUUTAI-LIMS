import { PreparedChemicalsClient } from "@/components/prepared-chemicals/PreparedChemicalsClient";
import { getChemicals } from "@/lib/services/chemicals";
import { getPreparedChemicals } from "@/lib/services/prepared-chemicals";
import { getActiveStaff } from "@/lib/services/staff";

export default async function Page() {
  const [items, chemicals, staff] = await Promise.all([
    getPreparedChemicals(),
    getChemicals(),
    getActiveStaff(),
  ]);
  return <PreparedChemicalsClient items={items} chemicals={chemicals} staff={staff} />;
}
