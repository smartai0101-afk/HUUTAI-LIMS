import { formatCoaDate } from "@/lib/test-report/coa-format";
import { SCI_TECH_LAB_CONFIG, type BilingualText } from "@/lib/test-report/sci-tech-lab-config";
import type { TestReportDocumentSnapshot } from "@/types/result-delivery";

type Props = {
  doc: TestReportDocumentSnapshot;
  issueDate: string | null;
  labManagerName?: string;
};
function normalizeIsoNotes(
  notes: TestReportDocumentSnapshot["isoNotes"],
): BilingualText[] {
  if (!notes.length) return [...SCI_TECH_LAB_CONFIG.isoNotes];
  const first = notes[0];
  if (typeof first === "string") {
    return notes.map((n) => ({ en: String(n), vi: String(n) }));
  }
  return notes as BilingualText[];
}

function uniqueMethods(doc: TestReportDocumentSnapshot): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const m of doc.methods) {
    const key = `${m.methodCode}|${m.methodName}|${m.methodVersion}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const line = [m.methodCode, m.methodName, m.methodVersion !== "—" ? `v${m.methodVersion}` : ""]
      .filter(Boolean)
      .join(" — ");
    if (line) lines.push(line);
  }
  return lines;
}

export function CoaNotesPage({ doc, issueDate, labManagerName = "" }: Props) {
  const cfg = SCI_TECH_LAB_CONFIG;
  const isoNotes = normalizeIsoNotes(doc.isoNotes);
  const methods = uniqueMethods(doc);

  const technicalManagerName =
    doc.signatureDetails.labManager.name.trim() || labManagerName.trim() || "—";
  const technicalManagerDate = doc.signatureDetails.labManager.signedAt;

  const companyDate =
    doc.signatureDetails.finalApprover.signedAt ||
    (issueDate ? formatCoaDate(issueDate) : "") ||
    (doc.sample.issueDate !== "—" ? doc.sample.issueDate : "");
  return (
    <div className="coa-notes-body">
      <div className="coa-notes-section">
        <strong>Note/Ghi chú:</strong>
        <ul className="coa-notes-list">
          {doc.remarks ? (
            <li>
              {doc.remarks}
            </li>
          ) : null}
          {isoNotes.map((note) => (
            <li key={note.en}>
              {note.en}
              <br />
              <em>{note.vi}</em>
            </li>
          ))}
        </ul>
      </div>

      <div className="coa-notes-section">
        <ul className="coa-notes-list coa-technical-list">
          {cfg.technicalNotes.map((note) => (
            <li key={note.en}>
              {note.en}
              <br />
              <em>{note.vi}</em>
            </li>
          ))}
        </ul>
      </div>

      {doc.conclusion.text ? (
        <div className="coa-notes-section">
          <strong>Conclusion / Kết luận:</strong>
          <p className="coa-conclusion-text">{doc.conclusion.text}</p>
        </div>
      ) : null}

      {methods.length > 0 ? (
        <div className="coa-notes-section">
          <strong>Analysis method / Phương pháp phân tích:</strong>
          <ul className="coa-methods-list">
            {methods.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="coa-notes-section">
        <strong>Authorised signatures / Chữ ký:</strong>
        <div className="coa-signatures">
          <div className="coa-signature-col">
            <div className="coa-signature-title">
              Technical Manager
              <br />
              <em>Phụ trách kỹ thuật</em>
            </div>
            <div className="coa-signature-name">{technicalManagerName}</div>
            {technicalManagerDate ? (
              <div className="coa-signature-meta">Date / Ngày: {technicalManagerDate}</div>
            ) : null}
          </div>
          <div className="coa-signature-col coa-signature-col--company">
            <div className="coa-signature-title">
              For SCI-TECH
              <br />
              <em>Đại diện công ty</em>
            </div>
            <div className="coa-signature-name coa-signature-company">{cfg.companyNameVi}</div>
            {companyDate ? (
              <div className="coa-signature-meta">Date / Ngày: {companyDate}</div>
            ) : null}
          </div>
        </div>
      </div>    </div>
  );
}
