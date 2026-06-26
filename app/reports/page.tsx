import { ReportsClient } from "@/components/reports/ReportsClient";
import {
  getAuditLogs,
  getInventoryTransactionExportRows,
  getReportsStats,
  getStockInExportRows,
  getStockLotExportRows,
  getUsageExportRows,
} from "@/lib/services/reports";

export default async function ReportsPage() {
  const [auditLogs, stats, stockRows, usageRows, stockInRows, txnRows] = await Promise.all([
    getAuditLogs(100),
    getReportsStats(),
    getStockLotExportRows(),
    getUsageExportRows(),
    getStockInExportRows(),
    getInventoryTransactionExportRows(500),
  ]);

  return (
    <ReportsClient
      auditLogs={auditLogs}
      stats={stats}
      stockExport={stockRows}
      usageExport={usageRows}
      stockInExport={stockInRows}
      transactionExport={txnRows}
    />
  );
}
