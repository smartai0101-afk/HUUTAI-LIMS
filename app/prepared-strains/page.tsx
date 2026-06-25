import { ModuleCrudClient } from "@/components/modules/ModuleCrudClient";
import { moduleConfigs } from "@/lib/modules/configs";
import {
  createPreparedStrain,
  deletePreparedStrain,
  updatePreparedStrain,
} from "@/lib/actions/modules";
import { getMicrobialStrainOptions, getPreparedStrains } from "@/lib/services/modules";

export default async function Page() {
  const [items, sources] = await Promise.all([getPreparedStrains(), getMicrobialStrainOptions()]);
  const cfg = moduleConfigs.preparedStrain;
  const fields = cfg.fields.map((f) =>
    f.key === "sourceStrainId"
      ? { ...f, options: sources.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` })) }
      : f,
  );
  return (
    <ModuleCrudClient
      {...cfg}
      items={items}
      fields={fields}
      stockLotMasters={sources}
      createAction={createPreparedStrain}
      updateAction={updatePreparedStrain}
      deleteAction={deletePreparedStrain}
    />
  );
}
