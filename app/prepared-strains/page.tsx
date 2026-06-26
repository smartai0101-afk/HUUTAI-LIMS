import { PreparedStrainsClient } from "@/components/prepared-strains/PreparedStrainsClient";
import { moduleConfigs } from "@/lib/modules/configs";
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
    <PreparedStrainsClient
      title={cfg.title}
      subtitle={cfg.subtitle}
      exportName={cfg.exportName}
      items={items}
      fields={fields}
      tableKeys={cfg.tableKeys}
      searchKeys={cfg.searchKeys}
      stockLotMasters={sources}
    />
  );
}
