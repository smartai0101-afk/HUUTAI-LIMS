export function BilingualLabel({ en, vi }: { en: string; vi: string }) {
  return (
    <span className="coa-bilingual-label">
      <span className="coa-label-en">{en}</span>
      <span className="coa-label-vi">{vi}</span>
    </span>
  );
}

export function BilingualInline({ en, vi }: { en: string; vi: string }) {
  return (
    <>
      {en}
      <br />
      <em>{vi}</em>
    </>
  );
}
