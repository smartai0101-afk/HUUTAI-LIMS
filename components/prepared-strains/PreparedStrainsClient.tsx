"use client";

import { ModuleCrudClient } from "@/components/modules/ModuleCrudClient";
import { useRole } from "@/components/RoleProvider";
import { bulkImportPreparedStrains } from "@/lib/actions/prepared-import";
import type { FieldDef, ModuleRow } from "@/lib/modules/shared";
import {
  buildPreparedStrainExportRows,
  PREPARED_STRAIN_EXCEL_COLUMNS,
  PREPARED_STRAIN_IMPORT_COLUMN_MAP,
} from "@/lib/prepared-excel";
import type { StockLotView } from "@/types";
import {
  createPreparedStrain,
  deletePreparedStrain,
  updatePreparedStrain,
} from "@/lib/actions/modules";

type Props = {
  title: string;
  subtitle: string;
  exportName: string;
  items: ModuleRow[];
  fields: FieldDef[];
  tableKeys: { key: string; header: string; isDate?: boolean; isStatus?: boolean }[];
  searchKeys: string[];
  extraFilters?: { key: string; label: string; options: string[] }[];
  stockLotMasters: Array<{ id: string; stockLots: StockLotView[] }>;
  staff: import("@/lib/services/staff").StaffView[];
};

export function PreparedStrainsClient(props: Props) {
  const { role } = useRole();

  const handleImport = async (rows: Record<string, string>[]) => {
    const fd = new FormData();
    fd.set("user", role);
    fd.set("rows", JSON.stringify(rows));
    return bulkImportPreparedStrains(fd);
  };

  return (
    <ModuleCrudClient
      {...props}
      preparationType="STRAIN"
      createAction={createPreparedStrain}
      updateAction={updatePreparedStrain}
      deleteAction={deletePreparedStrain}
      importColumnMap={PREPARED_STRAIN_IMPORT_COLUMN_MAP}
      importTitle="Import chủng pha chế"
      exportRowsBuilder={buildPreparedStrainExportRows}
      exportColumns={PREPARED_STRAIN_EXCEL_COLUMNS}
      onImport={handleImport}
    />
  );
}
