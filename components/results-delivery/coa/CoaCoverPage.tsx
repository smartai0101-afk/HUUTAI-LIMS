import type { ReactNode } from "react";
import { SCI_TECH_LAB_CONFIG } from "@/lib/test-report/sci-tech-lab-config";
import { formatCoaDateEn, formatCoaDateVi } from "@/lib/test-report/coa-format";
import type { TestReportCoverSnapshot, TestReportDocumentSnapshot } from "@/types/result-delivery";
import { BilingualInline, BilingualLabel } from "./bilingual-label";

type Props = {
  doc: TestReportDocumentSnapshot;
  cover: TestReportCoverSnapshot;
  issueDate: string | null;
};

function KvRow({
  labelEn,
  labelVi,
  value,
}: {
  labelEn: string;
  labelVi: string;
  value: ReactNode;
}) {
  return (
    <tr>
      <td className="coa-kv-label">
        <BilingualLabel en={labelEn} vi={labelVi} />
      </td>
      <td className="coa-kv-value">{value}</td>
    </tr>
  );
}

export function CoaCoverPage({ doc, cover, issueDate }: Props) {
  const cfg = SCI_TECH_LAB_CONFIG;
  const issueEn = formatCoaDateEn(issueDate);
  const issueVi = formatCoaDateVi(issueDate);

  return (
    <div className="coa-cover-body">
      <div className="coa-doc-title">
        <h1>ANALYSIS REPORT</h1>
        <p className="coa-doc-title-vi">BÁO CÁO PHÂN TÍCH</p>
      </div>

      <div className="coa-cover-meta-line">
        <span>
          {cfg.coverLocationLabel}, Date: {issueEn}
          <br />
          <em>
            {cfg.coverLocationLabel}, Ngày: {issueVi}
          </em>
        </span>
        <span className="coa-cover-job">
          <strong>JOB NO.:</strong> {cover.jobNumber}
          <br />
          <em>
            <strong>Đơn hàng:</strong> {cover.jobNumber}
          </em>
        </span>
      </div>

      <section className="coa-cover-section">
        <div className="coa-section-heading">
          <strong>CLIENT&apos;S NAME</strong>
          <em>Tên khách hàng</em>
        </div>
        <div className="coa-cover-client-block">
          <div>{doc.customer.name || "—"}</div>
          <div className="coa-cover-client-address">
            <strong>CLIENT&apos;S ADDRESS / Địa chỉ:</strong>
            <br />
            {doc.customer.address || "—"}
          </div>
        </div>
      </section>

      <section className="coa-cover-section">
        <div className="coa-section-heading coa-section-heading-lg">
          <strong>SAMPLE INFORMATION</strong>
          <em>THÔNG TIN MẪU</em>
        </div>
        <table className="coa-table coa-kv-table coa-cover-kv">
          <tbody>
            <KvRow
              labelEn="Sampled/Submitted by"
              labelVi="Được lấy/gửi bởi"
              value={<BilingualInline en={cover.sampledByEn} vi={cover.sampledByVi} />}
            />
            <KvRow
              labelEn="Client's reference"
              labelVi="Chú thích của khách hàng"
              value={doc.sample.customerSampleCode}
            />
            <KvRow
              labelEn="Sample description"
              labelVi="Mô tả mẫu"
              value={
                <BilingualInline
                  en={cover.sampleDescriptionEn}
                  vi={cover.sampleDescriptionVi}
                />
              }
            />
            <KvRow labelEn="Sample ID" labelVi="Mã số mẫu" value={doc.sample.sciTechSampleCode} />
            <KvRow
              labelEn="Date sample(s) received"
              labelVi="Ngày nhận mẫu"
              value={doc.sample.receivedAt}
            />
            <KvRow
              labelEn="Testing period"
              labelVi="Thời gian thử nghiệm"
              value={cover.testingPeriod}
            />
            <KvRow
              labelEn="Test(s) requested"
              labelVi="Yêu cầu thử nghiệm"
              value={
                <BilingualInline
                  en={cover.testsRequestedEn}
                  vi={cover.testsRequestedVi}
                />
              }
            />
            <KvRow
              labelEn="Test result(s)"
              labelVi="Kết quả kiểm nghiệm"
              value={
                <BilingualInline
                  en={cfg.testResultsReferNext.en}
                  vi={cfg.testResultsReferNext.vi}
                />
              }
            />
          </tbody>
        </table>
        <p className="coa-client-disclaimer">
          <em>
            {cfg.clientInfoDisclaimer.en}
            <br />
            {cfg.clientInfoDisclaimer.vi}
          </em>
        </p>
      </section>
    </div>
  );
}
