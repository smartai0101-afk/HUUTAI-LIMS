import {
  formatEvaluationRemark,
  formatLimitDisplay,
  formatMethodDisplay,
} from "@/lib/test-report/coa-format";
import type { ResultsTableRow } from "./paginate-results";

type Props = {
  rows: ResultsTableRow[];
};

export function CoaResultsTable({ rows }: Props) {
  return (
    <div className="coa-results-body">
      <div className="coa-doc-title coa-doc-title-sm">
        <h1>TEST RESULT(S)</h1>
        <p className="coa-doc-title-vi">KẾT QUẢ KIỂM NGHIỆM</p>
      </div>
      <table className="coa-table coa-results-table">
        <thead>
          <tr>
            <th>
              Analyte
              <br />
              <em>Chỉ tiêu phân tích</em>
            </th>
            <th>
              Method
              <br />
              <em>Phương pháp</em>
            </th>
            <th>
              Result
              <br />
              <em>Kết quả</em>
            </th>
            <th>LOD</th>
            <th>LOQ</th>
            <th>
              Limit
              <br />
              <em>Giới hạn</em>
            </th>
            <th>
              Unit
              <br />
              <em>Đơn vị</em>
            </th>
            <th>
              Remark
              <br />
              <em>Chú thích</em>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="coa-empty-row">
                No test results recorded. / Không có kết quả.
              </td>
            </tr>
          ) : (
            rows.map((entry, idx) => {
              if (entry.type === "group") {
                return (
                  <tr key={`group-${entry.index}-${idx}`} className="coa-group-row">
                    <td colSpan={8}>
                      {entry.index}. {entry.label}
                    </td>
                  </tr>
                );
              }
              const r = entry.row;
              return (
                <tr key={`${r.parameterGroup}-${r.parameterName}-${idx}`}>
                  <td>{r.parameterName}</td>
                  <td>{formatMethodDisplay(r)}</td>
                  <td className="coa-num">{r.resultValue || "—"}</td>
                  <td className="coa-num">{r.lod || "—"}</td>
                  <td className="coa-num">{r.loq || "—"}</td>
                  <td className="coa-num">{formatLimitDisplay(r.limitValue)}</td>
                  <td className="coa-num">{r.unit || "—"}</td>
                  <td>{formatEvaluationRemark(r.evaluation)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
