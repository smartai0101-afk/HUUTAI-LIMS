import { WorksheetsClient } from "@/components/analysis/WorksheetsClient";
import {
  listChemicalOptions,
  listStandardOptions,
  listWorklistsForWorksheet,
  listWorksheets,
} from "@/lib/services/analysis/worksheet";

export const dynamic = "force-dynamic";

export default async function WorksheetsPage() {
  const [worksheets, worklists, chemicals, standards] = await Promise.all([
    listWorksheets(),
    listWorklistsForWorksheet(),
    listChemicalOptions(),
    listStandardOptions(),
  ]);
  return (
    <WorksheetsClient
      worksheets={worksheets}
      worklists={worklists}
      chemicals={chemicals}
      standards={standards}
    />
  );
}
