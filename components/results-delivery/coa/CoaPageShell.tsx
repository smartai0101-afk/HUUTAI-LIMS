import type { ReactNode } from "react";
import { CoaFooter } from "./CoaFooter";
import { CoaHeader } from "./CoaHeader";

type Props = {
  reportCode: string;
  pageNumber: number;
  totalPages: number;
  isDraft?: boolean;
  children: ReactNode;
};

export function CoaPageShell({
  reportCode,
  pageNumber,
  totalPages,
  isDraft = false,
  children,
}: Props) {
  return (
    <div className="coa-page">
      {isDraft ? <div className="coa-draft-watermark">NHÁP</div> : null}
      <div className="coa-content">
        <CoaHeader reportCode={reportCode} pageNumber={pageNumber} totalPages={totalPages} />
        {children}
      </div>
      <CoaFooter />
    </div>
  );
}
