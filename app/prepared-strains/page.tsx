import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PreparedStrainsClient } from "@/components/prepared-strains/PreparedStrainsClient";
import { moduleConfigs } from "@/lib/modules/configs";
import { getMicrobialStrainOptions } from "@/lib/services/modules";
import {
  listPreparedStrains,
  parsePreparedListParams,
  PREPARED_STRAIN_SORT_ALLOWLIST,
} from "@/lib/services/prepared-list";
import { getActiveStaff } from "@/lib/services/staff";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parsePreparedListParams(params, PREPARED_STRAIN_SORT_ALLOWLIST);
  const [result, sources, staff] = await Promise.all([
    listPreparedStrains(listQuery),
    getMicrobialStrainOptions(),
    getActiveStaff(),
  ]);
  const cfg = moduleConfigs.preparedStrain;
  const fields = cfg.fields.map((f) =>
    f.key === "sourceStrainId"
      ? { ...f, options: sources.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` })) }
      : f,
  );

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <PreparedStrainsClient
        title={cfg.title}
        subtitle={cfg.subtitle}
        exportName={cfg.exportName}
        result={result}
        listQuery={listQuery}
        fields={fields}
        searchKeys={cfg.searchKeys}
        stockLotMasters={sources}
        staff={staff}
      />
    </Suspense>
  );
}
