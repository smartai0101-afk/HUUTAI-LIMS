"use client";

import { resolveCoverSnapshot } from "@/lib/test-report/build-document-snapshot";
import type { TestReportView } from "@/types/result-delivery";
import { CoaCoverPage } from "./coa/CoaCoverPage";
import { CoaNotesPage } from "./coa/CoaNotesPage";
import { CoaPageShell } from "./coa/CoaPageShell";
import { CoaResultsTable } from "./coa/CoaResultsTable";
import { paginateResults } from "./coa/paginate-results";
import "./test-report-coa.css";

type Props = {
  report: TestReportView;
  mode?: "preview" | "print";
};

export function TestReportDocument({ report, mode = "preview" }: Props) {
  const doc = report.document;
  const cover = resolveCoverSnapshot(report);
  const isDraft = !["issued", "reissued"].includes(report.status);
  const resultPages = paginateResults(report.results);
  const totalPages = 1 + resultPages.length + 1;

  return (
    <div className={`coa-root ${mode === "preview" ? "coa-preview" : "coa-print-root"}`}>
      {mode === "print" ? (
        <div className="coa-print-actions no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded px-4 py-2 text-sm text-white"
            style={{ backgroundColor: "#2D5A9E" }}
          >
            In / Lưu PDF
          </button>
        </div>
      ) : null}

      <CoaPageShell
        reportCode={report.reportCode}
        pageNumber={1}
        totalPages={totalPages}
        isDraft={isDraft}
      >
        <CoaCoverPage doc={doc} cover={cover} issueDate={report.issueDate} />
      </CoaPageShell>

      {resultPages.map((rows, index) => (
        <CoaPageShell
          key={`results-${index}`}
          reportCode={report.reportCode}
          pageNumber={index + 2}
          totalPages={totalPages}
          isDraft={isDraft}
        >
          <CoaResultsTable rows={rows} />
        </CoaPageShell>
      ))}

      <CoaPageShell
        reportCode={report.reportCode}
        pageNumber={totalPages}
        totalPages={totalPages}
        isDraft={isDraft}
      >
        <CoaNotesPage
          doc={doc}
          issueDate={report.issueDate}
          labManagerName={report.labManagerName}
        />
      </CoaPageShell>
    </div>
  );
}
