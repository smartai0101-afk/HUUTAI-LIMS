import { SCI_TECH_LAB_CONFIG } from "@/lib/test-report/sci-tech-lab-config";
import { formatCoaDate } from "@/lib/test-report/coa-format";

export function CoaFooter() {
  const cfg = SCI_TECH_LAB_CONFIG;
  const docDate = formatCoaDate(new Date());

  return (
    <footer className="coa-page-footer">
      <div className="coa-footer-left">
        <strong>{cfg.companyNameVi}</strong>
        <br />
        {cfg.footerAddressLines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
        MST: {cfg.taxCode} · Tel: {cfg.phone}
        <br />
        {cfg.website !== "(để cấu hình)" ? (
          <>
            Website: {cfg.website}
            <br />
          </>
        ) : null}
        {cfg.email !== "(để cấu hình)" ? <>Email: {cfg.email}</> : null}
        <div className="coa-footer-doc-id">
          {cfg.documentCode} · Rev {cfg.documentVersion} · {docDate}
        </div>
      </div>
      <div className="coa-footer-right">{cfg.legalDisclaimer}</div>
    </footer>
  );
}
