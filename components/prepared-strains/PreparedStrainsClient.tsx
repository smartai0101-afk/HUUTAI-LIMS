"use client";

import { ModuleCrudClient } from "@/components/modules/ModuleCrudClient";
import { useRole } from "@/components/RoleProvider";
import { bulkImportPreparedStrains } from "@/lib/actions/prepared-import";
import type { FieldDef, ModuleRow } from "@/lib/modules/shared";
import type { PreparedBatchRowMeta } from "@/lib/prepared-batch-rows";
import {
  buildPreparedStrainExportRows,
  PREPARED_STRAIN_EXCEL_COLUMNS,
  PREPARED_STRAIN_IMPORT_COLUMN_MAP,
} from "@/lib/prepared-excel";
import type { PaginatedResult } from "@/lib/list-query";
import type { PreparedListParams } from "@/lib/services/prepared-list";
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
  result: PaginatedResult<ModuleRow & PreparedBatchRowMeta>;
  listQuery: PreparedListParams;
  fields: FieldDef[];
  searchKeys: string[];
  extraFilters?: { key: string; label: string; options: string[] }[];
  stockLotMasters: Array<{ id: string; stockLots: StockLotView[] }>;
  staff: import("@/lib/services/staff").StaffView[];
};

type StrainTableKey = {
  key: string;
  header: string;
  isDate?: boolean;
  isStatus?: boolean;
  sortable?: boolean;
  sortKey?: string;
};

const STRAIN_TABLE_KEYS: StrainTableKey[] = [
  { key: "parentCode", header: "Mã nhóm", sortable: true, sortKey: "parentCode" },
  { key: "code", header: "Mã lô", sortable: true, sortKey: "code" },
  { key: "level", header: "Cấp chủng", sortable: true, sortKey: "level" },
  { key: "name", header: "Tên", sortable: true, sortKey: "name" },
  { key: "formula", header: "Công thức" },
  { key: "concentration", header: "Nồng độ lý thuyết" },
  { key: "finalConcentration", header: "Nồng độ thực tế" },
  { key: "sourceCode", header: "Nguồn gốc" },
  { key: "sourceLotNumber", header: "Lot nguồn" },
  { key: "passage", header: "Passage" },
  { key: "lot", header: "Lot" },
  { key: "expiryDate", header: "Hạn dùng", isDate: true, sortable: true, sortKey: "expiryDate" },
  { key: "status", header: "Trạng thái", isStatus: true, sortable: true, sortKey: "status" },
];

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
      tableKeys={STRAIN_TABLE_KEYS}
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
