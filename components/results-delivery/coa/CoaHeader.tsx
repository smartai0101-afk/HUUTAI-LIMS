import Image from "next/image";
import { SCI_TECH_LAB_CONFIG } from "@/lib/test-report/sci-tech-lab-config";

type Props = {
  reportCode: string;
  pageNumber: number;
  totalPages: number;
};

export function CoaHeader({ reportCode, pageNumber, totalPages }: Props) {
  const cfg = SCI_TECH_LAB_CONFIG;
  return (
    <header className="coa-header-bar">
      <div className="coa-header-spacer" />
      <div className="coa-header-brand">
        <Image
          src={cfg.logoPath}
          alt="SCI-TECH"
          width={120}
          height={48}
          className="coa-logo"
          priority
        />
      </div>
      <div className="coa-header-meta">
        <div className="coa-header-meta-row">
          <span>
            <strong>Report N°:</strong> {reportCode}
          </span>
          <span>
            <strong>Page N°:</strong> {pageNumber}/{totalPages}
          </span>
        </div>
      </div>
    </header>
  );
}
