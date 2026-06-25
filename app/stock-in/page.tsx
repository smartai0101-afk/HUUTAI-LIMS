import { StockInClient } from "@/components/stock-in/StockInClient";
import { getActiveStaff } from "@/lib/services/staff";
import { getStockInHistory } from "@/lib/services/stock-in-history";
import { getStockInMasterOptions } from "@/lib/services/stock-in-options";

export default async function StockInPage() {
  const [masterOptions, history, staff] = await Promise.all([
    getStockInMasterOptions(),
    getStockInHistory(),
    getActiveStaff(),
  ]);

  return <StockInClient masterOptions={masterOptions} history={history} staff={staff} />;
}
